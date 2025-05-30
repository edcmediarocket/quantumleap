
"use client";

import * as React from 'react';
import { cn } from "@/lib/utils";

interface GlassCardRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlassCardRoot = React.forwardRef<HTMLDivElement, GlassCardRootProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "glass-effect glass-effect-interactive-hover p-6 flex flex-col h-full", // Updated hover class
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
GlassCardRoot.displayName = "GlassCardRoot";

const GlassCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props} />
);
GlassCardHeader.displayName = "GlassCardHeader";

const GlassCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h3 ref={ref} className={cn("text-xl font-semibold leading-none tracking-tight text-primary-foreground group-hover:text-primary transition-colors", className)} {...props} />
);
GlassCardTitle.displayName = "GlassCardTitle";

const GlassCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
);
GlassCardDescription.displayName = "GlassCardDescription";

const GlassCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex-grow space-y-3 text-sm", className)} {...props} />
);
GlassCardContent.displayName = "GlassCardContent";

const GlassCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center pt-4 mt-auto", className)} {...props} />
);
GlassCardFooter.displayName = "GlassCardFooter";

export {
  GlassCardRoot,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
};
