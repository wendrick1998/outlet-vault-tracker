import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

export interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  showPasswordToggle?: boolean;
  loading?: boolean;
  debounceMs?: number;
  onDebouncedChange?: (value: string) => void;
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({
    className,
    type,
    label,
    error,
    success,
    hint,
    showPasswordToggle = false,
    loading = false,
    debounceMs = 300,
    onDebouncedChange,
    onChange,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(props.value || '');
    const debounceRef = React.useRef<NodeJS.Timeout>();

    // Handle debounced changes
    React.useEffect(() => {
      if (onDebouncedChange && debounceMs > 0) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        
        debounceRef.current = setTimeout(() => {
          onDebouncedChange(String(internalValue));
        }, debounceMs);

        return () => {
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
          }
        };
      }
    }, [internalValue, onDebouncedChange, debounceMs]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInternalValue(value);
      onChange?.(e);
    };

    const inputType = showPasswordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password')
      : type;

    const hasError = Boolean(error);
    const hasSuccess = Boolean(success && !error);

    return (
      <div className="space-y-2">
        {label && (
          <Label 
            htmlFor={props.id}
            className={cn(
              "text-sm font-medium",
              hasError && "text-destructive",
              hasSuccess && "text-green-600"
            )}
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          <Input
            type={inputType}
            className={cn(
              "pr-10",
              hasError && "border-destructive focus-visible:ring-destructive",
              hasSuccess && "border-green-500 focus-visible:ring-green-500",
              loading && "animate-pulse",
              className
            )}
            ref={ref}
            onChange={handleChange}
            {...props}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            )}
            
            {hasError && !loading && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            
            {hasSuccess && !loading && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            
            {showPasswordToggle && type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {hint && !error && !success && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {success && !error && (
          <Alert className="py-2 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-xs text-green-700">{success}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = "EnhancedInput";

export { EnhancedInput };