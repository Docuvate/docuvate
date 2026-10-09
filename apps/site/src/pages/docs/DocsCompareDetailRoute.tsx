import { useParams } from 'react-router-dom';
import { DocsCompareDetailPage } from '../DocsCompareDetailPage';

export function DocsCompareDetailRoute() {
  const { slug } = useParams();
  return <DocsCompareDetailPage slug={slug ?? ''} />;
}
