// frontend/src/components/ui/Button.tsx
import * as React from "react";
import { Button as MUIButton } from "@mui/material";
import { ButtonProps as MUIButtonProps } from "@mui/material";

// MUIの標準variantのみを型として定義
type MUIVariant = "text" | "contained" | "outlined";
// カスタムvariantを定義
type CustomVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "primary";

export interface ButtonProps extends Omit<MUIButtonProps, "variant"> {
  variant?: MUIVariant | CustomVariant;
}

const variantMapping: Record<CustomVariant, MUIVariant> = {
  default: "contained",
  destructive: "contained",
  outline: "outlined",
  secondary: "contained",
  ghost: "text",
  link: "text",
  primary: "contained",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", color, className, ...props }, ref) => {
    // variantがMUIの標準バリアントかどうかをチェック
    const isMuiVariant = ["contained", "outlined", "text"].includes(variant);
    
    // MUIの標準バリアントの場合はそのまま使用し、
    // カスタムバリアントの場合はマッピングを使用
    const buttonVariant = isMuiVariant ? variant : variantMapping[variant as keyof typeof variantMapping];

    const buttonColor = color || (() => {
      switch (variant) {
        case "destructive":
          return "error";
        case "secondary":
          return "secondary";
        case "primary":
          return "primary";
        default:
          return "primary";
      }
    })();

    return (
      <MUIButton
        ref={ref}
        variant={buttonVariant as MUIVariant}
        color={buttonColor}
        className={className}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
