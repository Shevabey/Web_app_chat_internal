import { forwardRef } from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-semibold text-fg">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full h-11 rounded-xl border border-border bg-bg px-4 text-sm text-fg placeholder:text-fg-muted transition-colors focus:border-fg focus:outline-none focus:ring-2 focus:ring-fg/10 ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-fg-muted">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
