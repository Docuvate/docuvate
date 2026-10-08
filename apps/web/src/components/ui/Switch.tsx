import { useId, type InputHTMLAttributes } from 'react';

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role' | 'onChange'> & {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function Switch({
  label,
  checked,
  onCheckedChange,
  disabled,
  id,
  className = '',
  ...rest
}: SwitchProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <label className={`switch-field ${className}`.trim()} htmlFor={inputId}>
      <span className="switch-field-label">{label}</span>
      <span className="switch">
        <input
          {...rest}
          id={inputId}
          type="checkbox"
          role="switch"
          className="switch-input"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange(event.target.checked)}
        />
        <span className="switch-track" aria-hidden />
      </span>
    </label>
  );
}
