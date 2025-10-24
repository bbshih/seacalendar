import { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
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
  const baseStyles =
    "font-semibold rounded-full shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

  const variantStyles = {
    primary: "bg-ocean-500 hover:bg-ocean-600 transform hover:scale-105",
    secondary: "bg-coral-400 hover:bg-coral-500 transform hover:scale-105",
    outline: "bg-white border-2 border-ocean-400 hover:bg-ocean-50",
  };

  const variantTextColors = {
    primary: "#ffffff",
    secondary: "#ffffff",
    outline: "#0284c7",
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
      {...props}
    >
      {children}
    </button>
  );
}
