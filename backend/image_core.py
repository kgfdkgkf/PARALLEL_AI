"""Generate illustrations with an OpenAI-compatible Images endpoint."""

import asyncio
import base64
import binascii
import os
from collections import OrderedDict
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/v1")
MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_ENCODED = (MAX_IMAGE_BYTES + 2) // 3 * 4
cache: OrderedDict[tuple[str, str, str, str], dict[str, str]] = OrderedDict()
generation = asyncio.Semaphore(2)
in_progress: dict[tuple[str, str, str, str], asyncio.Task[dict[str, str]]] = {}


class IllustrationRequest(BaseModel):
    kind: Literal["location", "portrait"]
    description: str = Field(min_length=10, max_length=900)


def image_mime(encoded: str) -> str:
    if not encoded or len(encoded) > MAX_ENCODED:
        raise ValueError("image too large or empty")
    data = base64.b64decode(encoded, validate=True)
    if len(data) > MAX_IMAGE_BYTES:
        raise ValueError("image too large")
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    raise ValueError("unsupported image")


async def generate(key: tuple[str, str, str, str]) -> dict[str, str]:
    url, model, kind, description = key
    framing = (
        "Wide establishing shot of the location, visible architecture and lived-in details"
        if kind == "location"
        else "Single fictional character, chest-up portrait in their working environment"
    )
    prompt = (
        f"{framing}. Science-fiction editorial illustration, cinematic natural light, grounded materials. "
        f"No letters, captions, interface or watermarks. Fictional art brief: {description}"
    )
    api_key = os.getenv("IMAGE_API_KEY", "").strip()
    headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
    payload = {"model": model, "prompt": prompt, "size": "1024x1024", "n": 1}
    try:
        async with generation, httpx.AsyncClient(timeout=95) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            encoded = response.json()["data"][0]["b64_json"]
            if not isinstance(encoded, str):
                raise ValueError("invalid image")
            image = {"mime": image_mime(encoded), "base64": encoded}
        cache[key] = image
        cache.move_to_end(key)
        while len(cache) > 12:
            cache.popitem(last=False)
        return image
    except (httpx.HTTPError, ValueError, TypeError, KeyError, IndexError, binascii.Error) as error:
        raise HTTPException(status_code=502, detail="Image provider did not return a supported image.") from error
    finally:
        in_progress.pop(key, None)


@router.post("/illustrations")
async def illustrate(request: IllustrationRequest) -> dict[str, str]:
    url = os.getenv("IMAGE_API_URL", "").strip()
    model = os.getenv("IMAGE_MODEL", "").strip()
    if not url or not model:
        raise HTTPException(status_code=503, detail="Illustration model is not configured.")
    key = (url, model, request.kind, request.description.strip())
    cached = cache.get(key)
    if cached:
        cache.move_to_end(key)
        return cached
    task = in_progress.get(key)
    if task is None:
        if len(in_progress) >= 4:
            raise HTTPException(status_code=429, detail="Illustration queue is full.")
        task = asyncio.create_task(generate(key))
        in_progress[key] = task
    return await asyncio.shield(task)
