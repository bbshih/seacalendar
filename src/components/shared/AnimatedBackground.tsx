import { ReactNode } from 'react';

interface FloatingElement {
  id: number;
  left: string;
  delay: string;
  duration: string;
  size: string;
  emoji?: string;
  color?: string;
  shape?: 'circle' | 'square' | 'blob';
}

interface AnimatedBackgroundProps {
  children: ReactNode;
  variant?: 'bubbles' | 'minimal' | 'party';
}

export default function AnimatedBackground({
  children,
  variant = 'bubbles'
}: AnimatedBackgroundProps) {
  // Generate floating elements
  const generateFloatingElements = (): FloatingElement[] => {
    if (variant === 'minimal') {
      return Array.from({ length: 5 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        duration: `${15 + Math.random() * 10}s`,
        size: `${50 + Math.random() * 100}px`,
        color: i % 2 === 0 ? 'bg-ocean-200/20' : 'bg-coral-400/10',
        shape: 'blob' as const,
      }));
    }

    if (variant === 'party') {
      const emojis = ['🌊', '🐠', '🐟', '🦈', '🐙', '🦑', '🐚', '⚓', '🌺', '🎉'];
      return Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        duration: `${10 + Math.random() * 10}s`,
        size: `${30 + Math.random() * 50}px`,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        shape: 'circle' as const,
      }));
    }

    // Default: bubbles
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${15 + Math.random() * 15}s`,
      size: `${30 + Math.random() * 100}px`,
      color: i % 3 === 0 ? 'bg-ocean-300/30' : i % 3 === 1 ? 'bg-ocean-400/20' : 'bg-coral-400/20',
      shape: 'circle' as const,
    }));
  };

  const elements = generateFloatingElements();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-ocean-50 via-ocean-100 to-coral-100/30 animate-gradient-xy bg-[length:400%_400%]" />

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {elements.map((el) => (
          <div
            key={el.id}
            className={`absolute ${el.color || ''} ${
              el.shape === 'blob' ? 'animate-blob rounded-full' : 'rounded-full'
            }`}
            style={{
              left: el.left,
              bottom: '-100px',
              width: el.size,
              height: el.size,
              animation: `bubble ${el.duration} ease-in ${el.delay} infinite`,
              opacity: variant === 'party' ? 0.8 : 0.6,
            }}
          >
            {el.emoji && (
              <div className="flex items-center justify-center w-full h-full text-2xl md:text-4xl">
                {el.emoji}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional decorative blobs for depth */}
      {variant !== 'minimal' && (
        <>
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-ocean-300/20 to-coral-300/20 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-coral-300/20 to-ocean-400/20 rounded-full blur-3xl animate-float-medium" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
