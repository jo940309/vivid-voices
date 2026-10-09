// @ts-nocheck
export function validateGooglePayload(payload, clientId, nonce) {
  if (!payload || payload.aud !== clientId ||
      !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss) ||
      !payload.sub || payload.email_verified !== true ||
      typeof payload.email !== 'string' || !/@gmail\.com$/i.test(payload.email) ||
      payload.nonce !== nonce || !Number.isFinite(payload.exp) || payload.exp <= Date.now() / 1000) {
    throw new Error('Invalid Google identity');
  }
  return payload;
}
