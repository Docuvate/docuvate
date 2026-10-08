import { useTranslation } from 'react-i18next';
import type { DocumentStatus } from '@docuvate/contracts';

export function Badge({ status }: { status: DocumentStatus }) {
  const { t } = useTranslation();
  return <span className={`badge badge-${status}`}>{t(`library.status.${status}`)}</span>;
}
