import { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  noPadding?: boolean;
}

export default function Card({
  children,
  noPadding = false,
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'bg-white rounded-2xl shadow-xl border-t-4 border-ocean-400';
  const paddingStyles = noPadding ? '' : 'p-6 md:p-8';

  return (
    <div
      className={`${baseStyles} ${paddingStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
