import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ExtractedMarkdownPreviewProps {
  markdown: string;
}

export function ExtractedMarkdownPreview({ markdown }: ExtractedMarkdownPreviewProps) {
  return (
    <div className="extracted-markdown-preview">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
