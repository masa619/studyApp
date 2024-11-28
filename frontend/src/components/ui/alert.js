import { jsx as _jsx } from "react/jsx-runtime";
// src/components/ui/alert.tsx
import * as React from "react";
import { cn } from "../../lib/utils";
const Alert = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
    const variantStyles = {
        default: "bg-gray-100 text-gray-800",
        success: "bg-green-100 text-green-800",
        error: "bg-red-100 text-red-800",
    };
    return (_jsx("div", { ref: ref, role: "alert", className: cn("rounded-lg p-4", variantStyles[variant], className), ...props }));
});
Alert.displayName = "Alert";
const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("text-sm", className), ...props })));
AlertDescription.displayName = "AlertDescription";
export { Alert, AlertDescription };
