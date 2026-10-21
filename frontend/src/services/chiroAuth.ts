import Keycloak from 'keycloak-js';

export interface AuthSettings { mode: 'local' | 'keycloak'; url: string; realm: string; clientId: string; requireVerifiedEmail: boolean }
export let authSettings: AuthSettings;
let client: Keycloak | undefined;
let initialization: Promise<void> | undefined;
export function initializeAuth(): Promise<void> {
  return initialization ??= (async () => {
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:3003';
    const response = await fetch(`${base}/auth/config/`);
    if (!response.ok) throw new Error('Unable to load sign-in settings. Please reload.');
    authSettings = await response.json();
    if (authSettings.mode === 'keycloak') {
      for (const key of ['chiro_trade_token']) localStorage.removeItem(key);
      client = new Keycloak({ url: authSettings.url, realm: authSettings.realm, clientId: authSettings.clientId });
      await client.init({ onLoad: 'check-sso', pkceMethod: 'S256', checkLoginIframe: false, redirectUri: `${location.origin}/login`, responseMode: 'query' });
    }
  })();
}
export const isCentralAuth = () => authSettings?.mode === 'keycloak';
export const hasCentralSession = () => Boolean(client?.authenticated);
export async function accessToken() {
  if (!client?.authenticated) return null;
  try { await client.updateToken(30); return client.token || null; }
  catch { client.clearToken(); window.dispatchEvent(new Event('cctbm:unauthorized')); throw new Error('Your session expired. Please sign in again.'); }
}
export async function signIn(register = false) {
  if (!client) throw new Error('Chiro Auth is unavailable.');
  const options = { redirectUri: `${location.origin}/login` };
  await (register ? client.register(options) : client.login(options));
}
export async function signOut() {
  if (client) await client.logout({ redirectUri: `${location.origin}/login` });
}
