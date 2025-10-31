import { HTMLAttributes, ReactNode, useState } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  noPadding?: boolean;
  variant?: 'default' | 'glass' | '3d' | 'glossy' | 'chrome' | 'plastic';
  hover3d?: boolean;
}

export default function Card({
  children,
  noPadding = false,
  variant = 'default',
  hover3d = true,
  className = '',
  ...props
}: CardProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hover3d || variant === 'glass') return;

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Reduced from 10 to 2 degrees for subtle effect
    const rotateX = ((y - centerY) / centerY) * -2;
    const rotateY = ((x - centerX) / centerX) * 2;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  const variantStyles = {
    default: 'bg-white rounded-2xl shadow-glossy border-t-4 border-ocean-400 transition-all duration-300 hover:shadow-glossy-hover hover:-translate-y-1',
    glass: 'bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-lg rounded-2xl shadow-plastic border-2 border-white/60 transition-all duration-300 hover:from-white/60 hover:to-white/40 hover:shadow-gel',
    '3d': 'bg-gradient-to-br from-white via-ocean-50 to-ocean-100 rounded-2xl shadow-gel border-t-4 border-l-2 border-ocean-400 border-r border-b transition-all duration-500',
    glossy: 'bg-gradient-to-br from-ocean-50 to-white rounded-2xl shadow-glossy hover:shadow-glossy-hover border-t-2 border-l border-ocean-200 transition-all duration-300 hover:-translate-y-1',
    chrome: 'bg-gradient-to-br from-chrome-100 via-chrome-200 to-chrome-300 rounded-2xl shadow-chrome border border-chrome-400 transition-all duration-300 hover:from-chrome-200 hover:via-chrome-300 hover:to-chrome-400',
    plastic: 'bg-gradient-to-br from-white to-ocean-100 rounded-3xl shadow-plastic border-t-4 border-ocean-300 transition-all duration-300 hover:shadow-gel hover:-translate-y-1',
  };

  const paddingStyles = noPadding ? '' : 'p-6 md:p-8';

  const style3d = hover3d && variant !== 'glass'
    ? {
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(0)`,
        transition: 'transform 0.1s ease-out',
      }
    : {};

  return (
    <div
      className={`${variantStyles[variant]} ${paddingStyles} ${className} relative overflow-hidden`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style3d}
      {...props}
    >
      {/* Glossy highlight overlay for certain variants */}
      {(variant === 'glossy' || variant === 'plastic' || variant === '3d') && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none rounded-2xl"
          style={{ height: '60%', width: '80%' }}
        />
      )}

      {/* Chrome reflection effect */}
      {variant === 'chrome' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none rounded-2xl" />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}
