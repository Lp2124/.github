import { headers } from 'next/headers';

export async function assertSameOriginRequest() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin');
  const host = requestHeaders.get('host');

  if (!origin || !host) {
    throw new Error('Missing origin headers for server action request.');
  }

  const originHost = new URL(origin).host;
  if (originHost !== host) {
    throw new Error('Rejected cross-origin server action request.');
  }
}
