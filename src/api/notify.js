import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};
const siteUrl =
  process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  extra.siteUrl?.replace(/\/$/, '') ??
  '';

/**
 * Misma carga útil que la web (Next /api/notify-*).
 * Solo se llama si EXPO_PUBLIC_SITE_URL apunta al despliegue de la web.
 */
export async function notifyReservation(payload) {
  if (!siteUrl) return;
  const base = siteUrl;
  try {
    await Promise.all([
      fetch(`${base}/api/notify-telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      fetch(`${base}/api/notify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, barberoId: payload.barberoId }),
      }),
    ]);
  } catch (e) {
    console.warn('[notify]', e);
  }
}
