import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 border bg-white text-base transition-all duration-200 ease-out outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: 
          "border-sophisticated-gray-300 rounded-lg px-4 py-3 shadow-sm hover:border-ocean-blue-400 hover:shadow-md focus:border-ocean-blue-600 focus:ring-2 focus:ring-ocean-blue-600/20 focus:shadow-lg dark:bg-sophisticated-gray-900 dark:border-sophisticated-gray-600 dark:hover:border-ocean-blue-500 dark:focus:border-ocean-blue-500 dark:focus:ring-ocean-blue-500/20",
        filled:
          "border-sophisticated-gray-200 bg-sophisticated-gray-50 rounded-lg px-4 py-3 shadow-sm hover:bg-sophisticated-gray-100 hover:border-ocean-blue-400 focus:bg-white focus:border-ocean-blue-600 focus:ring-2 focus:ring-ocean-blue-600/20 focus:shadow-lg dark:bg-sophisticated-gray-800 dark:border-sophisticated-gray-700 dark:hover:bg-sophisticated-gray-700 dark:focus:bg-sophisticated-gray-900",
        outline:
          "border-2 border-sophisticated-gray-300 rounded-lg px-4 py-3 bg-transparent hover:border-ocean-blue-400 hover:shadow-sm focus:border-ocean-blue-600 focus:ring-2 focus:ring-ocean-blue-600/20 focus:shadow-md dark:border-sophisticated-gray-600 dark:hover:border-ocean-blue-500 dark:focus:border-ocean-blue-500",
        ghost:
          "border-transparent rounded-lg px-4 py-3 bg-transparent hover:bg-sophisticated-gray-50 hover:border-sophisticated-gray-200 focus:bg-white focus:border-ocean-blue-600 focus:ring-2 focus:ring-ocean-blue-600/20 dark:hover:bg-sophisticated-gray-800 dark:focus:bg-sophisticated-gray-900",
      },
      size: {
        sm: "h-8 px-3 py-1 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-12 px-6 py-3 text-base",
      },
      state: {
        default: "",
        error: "border-red-500 focus:border-red-600 focus:ring-red-600/20 dark:border-red-400 dark:focus:border-red-500",
        success: "border-green-500 focus:border-green-600 focus:ring-green-600/20 dark:border-green-400 dark:focus:border-green-500",
        warning: "border-amber-500 focus:border-amber-600 focus:ring-amber-600/20 dark:border-amber-400 dark:focus:border-amber-500",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
)

interface InputProps 
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {
  variant?: "default" | "filled" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"  
  state?: "default" | "error" | "success" | "warning"
}

function Input({ className, variant, size, state, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, size, state }), className)}
      {...props}
    />
  )
}

export { Input }
