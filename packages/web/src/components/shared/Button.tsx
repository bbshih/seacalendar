import { ButtonHTMLAttributes, ReactNode, useState } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "gradient" | "glass" | "glow" | "glossy" | "chrome" | "gel" | "plastic";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = { x, y, id: Date.now() };

    setRipples((prev) => [...prev, ripple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, 600);
  };

  const baseStyles =
    "font-bold rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden active:translate-y-0.5";

  const variantStyles = {
    primary: "bg-ocean-500 hover:bg-ocean-600 transform hover:scale-105 shadow-glossy hover:shadow-glossy-hover",
    secondary: "bg-coral-400 hover:bg-coral-500 transform hover:scale-105 shadow-glossy hover:shadow-glossy-hover",
    outline: "bg-white border-3 border-ocean-400 hover:bg-ocean-50 transform hover:scale-105 shadow-bevel",
    gradient: "bg-gradient-to-b from-ocean-400 via-ocean-500 to-ocean-600 hover:from-ocean-500 hover:via-ocean-600 hover:to-ocean-700 transform hover:scale-105 shadow-gel",
    glass: "bg-gradient-to-b from-white/40 to-white/20 backdrop-blur-md border-2 border-white/50 hover:from-white/50 hover:to-white/30 transform hover:scale-105 shadow-plastic",
    glow: "bg-ocean-500 hover:bg-ocean-600 transform hover:scale-105 animate-pulse-glow shadow-glossy",
    glossy: "bg-gradient-to-b from-ocean-400 to-ocean-600 shadow-glossy hover:shadow-glossy-hover hover:from-ocean-500 hover:to-ocean-700 active:shadow-inset-deep",
    chrome: "bg-gradient-to-b from-chrome-100 via-chrome-300 to-chrome-400 shadow-chrome hover:from-chrome-200 hover:via-chrome-400 hover:to-chrome-500 border border-chrome-500",
    gel: "bg-gradient-to-b from-coral-400/90 to-coral-500 shadow-gel hover:from-coral-500/90 hover:to-coral-500 backdrop-blur-sm",
    plastic: "bg-gradient-to-b from-seaweed-500 to-seaweed-600 shadow-plastic hover:from-seaweed-600 hover:to-seaweed-700",
  };

  const variantTextColors = {
    primary: "#f0f9ff",
    secondary: "#fef3c7",
    outline: "#0284c7",
    gradient: "#ffffff",
    glass: "#0369a1",
    glow: "#f0f9ff",
    glossy: "#ffffff",
    chrome: "#0c4a6e",
    gel: "#ffffff",
    plastic: "#ffffff",
  };

  const sizeStyles = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-6 text-base",
    lg: "py-4 px-8 text-lg",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
      style={{
        color: variantTextColors[variant],
        textShadow: variant === 'chrome' ? '0 1px 0 rgba(255,255,255,0.5)' : '0 1px 2px rgba(0,0,0,0.3)',
      }}
      disabled={disabled}
      onClick={(e) => {
        createRipple(e);
        props.onClick?.(e);
      }}
      {...props}
    >
      {/* Glossy highlight overlay */}
      {(variant === 'glossy' || variant === 'gel' || variant === 'plastic') && (
        <span
          className="absolute inset-0 rounded-full bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none"
          style={{ height: '50%' }}
        />
      )}

      <span className="relative z-10">{children}</span>

      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/40 rounded-full animate-ripple pointer-events-none z-20"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 10,
            height: 10,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </button>
  );
}
