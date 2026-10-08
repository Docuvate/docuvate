import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

type Props = {
  icon: LucideIcon;
  label: string;
  expanded?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'>;

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { icon: Icon, label, expanded, className, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`icon-btn${className ? ` ${className}` : ''}`}
      aria-label={label}
      aria-expanded={expanded}
      aria-haspopup="menu"
      {...rest}
    >
      <Icon size={16} aria-hidden />
    </button>
  );
});
