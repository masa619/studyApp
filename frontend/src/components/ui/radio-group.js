import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "../../lib/utils";
const RadioGroup = React.forwardRef(({ className, ...props }, ref) => {
    return (_jsx(RadioGroupPrimitive.Root, { className: cn("grid gap-2", className), ...props, ref: ref }));
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;
const RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => {
    return (_jsx(RadioGroupPrimitive.Item, { ref: ref, className: cn("aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className), ...props, children: _jsx(RadioGroupPrimitive.Indicator, { className: "flex items-center justify-center", children: _jsx(CheckIcon, { className: "h-3.5 w-3.5 fill-primary" }) }) }));
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;
export { RadioGroup, RadioGroupItem };