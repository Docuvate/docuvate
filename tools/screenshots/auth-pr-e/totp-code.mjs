// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createHmac } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input) {
  const cleaned = input.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out = [];
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function hotp(secret, counter, digits = 6) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 10 ** digits).padStart(digits, '0');
}

/** RFC 6238 TOTP for otpauth:// URIs returned by Better Auth. */
export function totpFromOtpAuthUri(uri) {
  const normalized = uri.trim();
  const url = normalized.startsWith('otpauth://')
    ? new URL(normalized.replace('otpauth://', 'https://'))
    : new URL(normalized);
  const secret = url.searchParams.get('secret');
  if (!secret) {
    throw new Error('otpauth URI missing secret');
  }
  const period = Number(url.searchParams.get('period') ?? '30');
  const digits = Number(url.searchParams.get('digits') ?? '6');
  const counter = Math.floor(Date.now() / 1000 / period);
  return hotp(base32Decode(secret), counter, digits);
}
