import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-border bg-white p-6 shadow-sm",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 pb-4", className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          "text-lg font-semibold leading-none tracking-tight",
          className
        )}
        {...props}
      />
    );
  }
);

CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps
  extends HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-muted", className)}
        {...props}
      />
    );
  }
);

CardDescription.displayName = "CardDescription";

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("pt-0", className)} {...props} />;
  }
);

CardContent.displayName = "CardContent";

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center pt-4", className)}
        {...props}
      />
    );
  }
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
