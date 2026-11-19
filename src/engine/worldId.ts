let serial = 0;

export function newWorldId(prefix: 'u' | 'ai' | 'branch', seed: number): string {
  serial += 1;
  return `${prefix}-${seed.toString(36)}-${Date.now().toString(36)}-${serial.toString(36)}`;
}
