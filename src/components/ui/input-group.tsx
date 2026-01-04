import * as React from "react"
import { cn } from "@/lib/utils"

const InputGroup = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn("relative flex items-center", className)}
            {...props}
        />
    )
})
InputGroup.displayName = "InputGroup"

const InputGroupIcon = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground",
                "[&>svg]:h-5 [&>svg]:w-5",
                className
            )}
            {...props}
        />
    )
})
InputGroupIcon.displayName = "InputGroupIcon"

export { InputGroup, InputGroupIcon }
