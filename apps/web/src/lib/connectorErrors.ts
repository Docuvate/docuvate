import { formatUserFacingError } from './apiErrors';

export function formatConnectorError(err: unknown, fallbackKey: string): string {
  return formatUserFacingError(err, fallbackKey);
}
