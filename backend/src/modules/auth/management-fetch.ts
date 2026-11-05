import * as http from 'node:http';
import * as https from 'node:https';

// Reuse a bounded set of IPv4 connections for the sequential management calls.
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 16, maxFreeSockets: 4, timeout: 15000 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 16, maxFreeSockets: 4, timeout: 15000 });

export const managementFetch: typeof fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported management protocol');
  if (options.body != null && typeof options.body !== 'string' && !(options.body instanceof URLSearchParams)) {
    throw new Error('Unsupported management body');
  }
  const body = options.body?.toString();
  const headers = Object.fromEntries(new Headers(options.headers).entries());
  if (options.body instanceof URLSearchParams) headers['content-type'] = 'application/x-www-form-urlencoded';
  if (body !== undefined) headers['content-length'] = String(Buffer.byteLength(body));
  return new Promise<Response>((resolve, reject) => {
    const secure = url.protocol === 'https:';
    const request = (secure ? https : http).request(url, {
      method: options.method || 'GET', headers, family: 4,
      agent: headers.connection?.toLowerCase() === 'close' ? false : secure ? httpsAgent : httpAgent,
      signal: options.signal ?? undefined,
      timeout: 15000,
    }, response => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => {
        const status = response.statusCode ?? 502;
        const responseHeaders = new Headers();
        for (const [key, value] of Object.entries(response.headers)) {
          if (Array.isArray(value)) value.forEach(item => responseHeaders.append(key, item));
          else if (value !== undefined) responseHeaders.set(key, value);
        }
        // Redirects are returned to the caller, never followed with credentials.
        resolve(new Response([204, 205, 304].includes(status) ? null : Buffer.concat(chunks), { status, headers: responseHeaders }));
      });
    });
    request.on('error', reject);
    request.on('timeout', () => request.destroy(new Error('Chiro Auth management timeout')));
    request.end(body);
  });
};
