import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

@Injectable()
export class SftpAuthenticateRateLimiter {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  assertAllowed(clientKey: string): void {
    const key = clientKey.trim() || 'unknown';
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing || now >= existing.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return;
    }
    if (existing.count >= MAX_PER_WINDOW) {
      throw new HttpException('Too many authentication attempts', HttpStatus.TOO_MANY_REQUESTS);
    }
    existing.count += 1;
  }
}
