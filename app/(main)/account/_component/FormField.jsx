"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function FormField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  defaultValue,
  required = false,
  icon,
  isTextarea = false,
  className = "",
  disabled
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>

      <div className="relative">
        {isTextarea ? (
          <Textarea
            id={id}
            name={name}
            required={required}
            defaultValue={defaultValue}
            placeholder={placeholder}
            disabled={disabled}
            className={`resize-none ${icon ? "pl-9 pt-3" : ""}`}
            rows={3}
          />
        ) : (
          <Input
            id={id}
            name={name}
            type={type}
            required={required}
            defaultValue={defaultValue}
             disabled={disabled}
            placeholder={placeholder}
            className={icon ? "pl-9" : ""}
          />
        )}

        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
