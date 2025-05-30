import { cn } from "@/lib/utils";

interface LoadingDotsProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingDots({ className, size = 'md' }: LoadingDotsProps) {
  const dotSizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <div className={cn("flex space-x-2 justify-center items-center", className)}>
      <span className="sr-only">Loading...</span>
      <div className={cn(dotSizeClasses[size], "bg-primary rounded-full animate-bounce [animation-delay:-0.3s]")}></div>
      <div className={cn(dotSizeClasses[size], "bg-primary rounded-full animate-bounce [animation-delay:-0.15s]")}></div>
      <div className={cn(dotSizeClasses[size], "bg-primary rounded-full animate-bounce")}></div>
    </div>
  );
}
