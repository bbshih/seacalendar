import { ButtonHTMLAttributes, ReactNode, useState } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "gradient" | "glass" | "glow";
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
    "font-semibold rounded-full shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden active:scale-95";

  const variantStyles = {
    primary: "bg-ocean-500 hover:bg-ocean-600 transform hover:scale-105 hover:shadow-xl",
    secondary: "bg-coral-400 hover:bg-coral-500 transform hover:scale-105 hover:shadow-xl",
    outline: "bg-white border-2 border-ocean-400 hover:bg-ocean-50 transform hover:scale-105",
    gradient: "bg-gradient-to-r from-ocean-500 via-ocean-400 to-coral-400 hover:from-ocean-600 hover:via-ocean-500 hover:to-coral-500 transform hover:scale-105 hover:shadow-2xl animate-gradient-x bg-[length:200%_100%]",
    glass: "bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transform hover:scale-105 hover:shadow-xl",
    glow: "bg-ocean-500 hover:bg-ocean-600 transform hover:scale-105 animate-pulse-glow",
  };

  const variantTextColors = {
    primary: "#f0f9ff",
    secondary: "#fef3c7",
    outline: "#0284c7",
    gradient: "#ffffff",
    glass: "#ffffff",
    glow: "#f0f9ff",
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
      }}
      disabled={disabled}
      onClick={(e) => {
        createRipple(e);
        props.onClick?.(e);
      }}
      {...props}
    >
      {children}

      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
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
