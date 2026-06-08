export function createIdempotencyKey(): string {
  const webCrypto = globalThis.crypto;
  if (!webCrypto) throw new Error('Web Crypto is required to initialize a secure payment.');
  if (typeof webCrypto.randomUUID === 'function') return webCrypto.randomUUID();

  const values = new Uint8Array(16);
  webCrypto.getRandomValues(values);
  values[6] = (values[6] & 0x0f) | 0x40;
  values[8] = (values[8] & 0x3f) | 0x80;
  const hex = [...values].map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
