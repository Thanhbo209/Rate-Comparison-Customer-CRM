import { Ref } from "react";
import { Input } from "./input";
import { cn } from "cn";

/** Number input with an optional unit suffix. The wheel and spinners are disabled so a scroll can't change a price. */
export function NumberField({
  id,
  value,
  onChange,
  suffix,
  placeholder,
  min,
  required,
  autoFocus,
  inputRef,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  placeholder?: string;
  min?: string;
  required?: boolean;
  autoFocus?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        ref={inputRef}
        type="number"
        inputMode="decimal"
        step="any"
        min={min}
        value={value}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onWheel={(e) => e.currentTarget.blur()}
        className={cn(
          "h-10 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          suffix && "pr-14",
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}
