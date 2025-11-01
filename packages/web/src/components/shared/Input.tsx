import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const widthStyles = fullWidth ? 'w-full' : '';

    const baseStyles = 'px-4 py-2 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 bg-gray-900/50 text-cyan-300 placeholder-cyan-700';
    const normalStyles = 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-500/50';
    const errorStyles = 'border-red-500/50 focus:border-red-400 focus:ring-red-500/50';

    return (
      <div className={`${widthStyles}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-cyan-400 mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseStyles} ${error ? errorStyles : normalStyles} ${widthStyles} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-400 font-mono">ERROR: {error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-cyan-500/70">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
