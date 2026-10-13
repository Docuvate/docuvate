// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { BlockList, isIP } from 'node:net';

const DOCUMENT_CHAT_CLOUD_BLOCKED_IPS = new BlockList();
DOCUMENT_CHAT_CLOUD_BLOCKED_IPS.addSubnet('127.0.0.0', 8, 'ipv4');
DOCUMENT_CHAT_CLOUD_BLOCKED_IPS.addSubnet('10.0.0.0', 8, 'ipv4');
DOCUMENT_CHAT_CLOUD_BLOCKED_IPS.addSubnet('172.16.0.0', 12, 'ipv4');
DOCUMENT_CHAT_CLOUD_BLOCKED_IPS.addSubnet('192.168.0.0', 16, 'ipv4');
DOCUMENT_CHAT_CLOUD_BLOCKED_IPS.addSubnet('100.64.0.0', 10, 'ipv4');
DOCUMENT_CHAT_CLOUD_BLOCKED_IPS.addSubnet('169.254.0.0', 16, 'ipv4');
DOCUMENT_CHAT_CLOUD_BLOCKED_IPS.addSubnet('0.0.0.0', 8, 'ipv4');
DOCUMENT_CHAT_CLOUD_BLOCKED_IPS.addSubnet('::', 128, 'ipv6');
DOCUMENT_CHAT_CLOUD_BLOCKED_IPS.addSubnet('::1', 128, 'ipv6');
DOCUMENT_CHAT_CLOUD_BLOCKED_IPS.addSubnet('fc00::', 7, 'ipv6');
DOCUMENT_CHAT_CLOUD_BLOCKED_IPS.addSubnet('fe80::', 10, 'ipv6');

/** Unwrap IPv4-mapped IPv6 (::ffff:a.b.c.d) for blocklist checks. */
export function normalizeIpForDocumentChatCloudBlockCheck(ip: string): string {
  const trimmed = ip.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('::ffff:')) {
    const v4 = trimmed.slice('::ffff:'.length);
    if (isIP(v4) === 4) {
      return v4;
    }
  }
  return trimmed;
}

export function isDocumentChatCloudBlockedIp(ip: string): boolean {
  const normalized = normalizeIpForDocumentChatCloudBlockCheck(ip);
  const family = isIP(normalized);
  if (family === 4) {
    return DOCUMENT_CHAT_CLOUD_BLOCKED_IPS.check(normalized, 'ipv4');
  }
  if (family === 6) {
    return DOCUMENT_CHAT_CLOUD_BLOCKED_IPS.check(normalized, 'ipv6');
  }
  return true;
}
