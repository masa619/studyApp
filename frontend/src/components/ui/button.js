import { jsx as _jsx } from "react/jsx-runtime";
// frontend/src/components/ui/Button.tsx
import * as React from "react";
import { Button as MUIButton } from "@mui/material";
const variantMapping = {
    default: "contained",
    destructive: "contained",
    outline: "outlined",
    secondary: "contained",
    ghost: "text",
    link: "text",
    primary: "contained",
};
const Button = React.forwardRef(({ variant = "default", color, className, ...props }, ref) => {
    // variantがMUIの標準バリアントかどうかをチェック
    const isMuiVariant = ["contained", "outlined", "text"].includes(variant);
    // MUIの標準バリアントの場合はそのまま使用し、
    // カスタムバリアントの場合はマッピングを使用
    const buttonVariant = isMuiVariant ? variant : variantMapping[variant];
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
    return (_jsx(MUIButton, { ref: ref, variant: buttonVariant, color: buttonColor, className: className, ...props }));
});
Button.displayName = "Button";
export { Button };
