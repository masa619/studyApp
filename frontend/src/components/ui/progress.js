import { jsx as _jsx } from "react/jsx-runtime";
// src/components/ui/progress.tsx
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../../lib/utils";
import { colors } from "@/styles/colors";
const Progress = React.forwardRef(({ className, value, ...props }, ref) => (_jsx(ProgressPrimitive.Root, { ref: ref, className: cn("relative h-2 w-full overflow-hidden rounded-full", `bg-[${colors.primary.light}] dark:bg-[${colors.primary.light}]`, className), ...props, children: _jsx(ProgressPrimitive.Indicator, { className: "h-full w-full flex-1 transition-all", style: {
            backgroundColor: colors.primary.main,
            transform: `translateX(-${100 - (value || 0)}%)`
        } }) })));
Progress.displayName = ProgressPrimitive.Root.displayName;
export { Progress };
