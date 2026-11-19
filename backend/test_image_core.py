import os
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from backend import image_core
from backend.main import app

PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l2YAAAAASUVORK5CYII="
REQUEST = {"kind": "location", "description": "Water reservoir in the city district"}


class IllustrationsTest(unittest.TestCase):
    def setUp(self):
        image_core.cache.clear()
        self.client = TestClient(app)
        self.addCleanup(self.client.close)

    def test_missing_configuration_and_invalid_kind(self):
        with patch.dict(os.environ, {"IMAGE_API_URL": "", "IMAGE_MODEL": ""}):
            self.assertEqual(self.client.post("/v1/illustrations", json=REQUEST).status_code, 503)
        self.assertEqual(self.client.post("/v1/illustrations", json={**REQUEST, "kind": "other"}).status_code, 422)

    def test_model_contract_and_cache(self):
        config = {"IMAGE_API_URL": "https://provider.example/v1/images/generations", "IMAGE_MODEL": "image-test"}
        response = httpx.Response(200, json={"data": [{"b64_json": PNG}]}, request=httpx.Request("POST", config["IMAGE_API_URL"]))
        post = AsyncMock(return_value=response)
        with patch.dict(os.environ, config), patch.object(httpx.AsyncClient, "post", post):
            first = self.client.post("/v1/illustrations", json=REQUEST)
            second = self.client.post("/v1/illustrations", json=REQUEST)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.json(), {"mime": "image/png", "base64": PNG})
        self.assertEqual(first.json(), second.json())
        post.assert_awaited_once()
        self.assertEqual(post.call_args.kwargs["json"]["model"], "image-test")
        self.assertIn(REQUEST["description"], post.call_args.kwargs["json"]["prompt"])

    def test_invalid_provider_output_is_rejected(self):
        config = {"IMAGE_API_URL": "https://provider.example/v1/images/generations", "IMAGE_MODEL": "image-test"}
        response = httpx.Response(200, json={"data": [{"b64_json": "xyz"}]}, request=httpx.Request("POST", config["IMAGE_API_URL"]))
        with patch.dict(os.environ, config), patch.object(httpx.AsyncClient, "post", AsyncMock(return_value=response)):
            self.assertEqual(self.client.post("/v1/illustrations", json=REQUEST).status_code, 502)
