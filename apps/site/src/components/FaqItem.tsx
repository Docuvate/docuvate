import { ChevronDown } from 'lucide-react';
import { RichText } from '../lib/richText';

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="faq-item">
      <summary className="faq-summary">
        <span className="faq-question">{question}</span>
        <ChevronDown className="faq-chevron" size={18} aria-hidden />
      </summary>
      <p className="faq-answer">
        <RichText text={answer} />
      </p>
    </details>
  );
}
