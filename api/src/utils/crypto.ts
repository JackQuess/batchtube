import crypto from 'node:crypto';

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function generateApiKey(prefix = 'bt_live_'): { plain: string; hash: string } {
  const plain = `${prefix}${crypto.randomBytes(24).toString('hex')}`;
  return { plain, hash: sha256(plain) };
}

export function hmacSha256Hex(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
