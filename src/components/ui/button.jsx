import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#FF8C00] text-white hover:bg-[#0080C8] transition-colors duration-200',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border-2 border-[#0080C8] bg-transparent text-[#0080C8] hover:bg-[#4DB8E8] hover:text-white hover:border-[#4DB8E8] transition-all duration-200',
        secondary: 'bg-[#0080C8] text-white hover:bg-[#4DB8E8] transition-colors duration-200',
        ghost: 'hover:bg-[#4DB8E8]/20 hover:text-[#0080C8] transition-all duration-200',
        link: 'text-[#FF8C00] underline-offset-4 hover:underline hover:text-[#0080C8] transition-colors duration-200',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };