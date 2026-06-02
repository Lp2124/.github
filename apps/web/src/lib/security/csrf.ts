import { headers } from 'next/headers';

export async function assertSameOriginRequest() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin');
  const host = requestHeaders.get('host');

  if (!origin || !host) {
    throw new Error('Missing origin headers for server action request.');
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new Error('Rejected malformed origin header for server action request.');
  }

  if (originHost !== host) {
    throw new Error('Rejected cross-origin server action request.');
  }
}
