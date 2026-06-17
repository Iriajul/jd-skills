"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-sans font-semibold uppercase tracking-widest text-xs transition-all duration-200 min-h-[44px] min-w-[44px] px-6 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-[#111111] text-[#F9F9F7] border border-[#111111] hover:bg-[#F9F9F7] hover:text-[#111111]",
        outline:
          "bg-transparent text-[#111111] border border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]",
        ghost:
          "bg-transparent text-[#111111] border border-transparent hover:bg-[#E5E5E0]",
        danger:
          "bg-[#CC0000] text-[#F9F9F7] border border-[#CC0000] hover:bg-[#F9F9F7] hover:text-[#CC0000]",
      },
      size: {
        sm: "text-[10px] px-4 min-h-[36px]",
        md: "text-xs px-6 min-h-[44px]",
        lg: "text-xs px-8 min-h-[52px]",
        full: "text-xs px-6 min-h-[44px] w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="font-mono text-[10px] tracking-widest">LOADING...</span>
      ) : (
        children
      )}
    </button>
  );
}
