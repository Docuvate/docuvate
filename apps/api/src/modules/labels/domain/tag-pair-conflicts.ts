// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Order-independent key for a pair of tag ids. */
export function tagPairKey(tagIdA: string, tagIdB: string): string {
  return tagIdA < tagIdB ? `${tagIdA}:${tagIdB}` : `${tagIdB}:${tagIdA}`;
}

export function tagPairConflicts(
  tagIdA: string,
  tagIdB: string,
  exclusivePairs: ReadonlySet<string>
): boolean {
  return exclusivePairs.has(tagPairKey(tagIdA, tagIdB));
}
