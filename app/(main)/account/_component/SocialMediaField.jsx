import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SocialMediaField({
  id,
  name,
  label,
  placeholder,
  defaultValue,
  icon,
  disabled
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name} // <-- crucial for form submission
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="pl-9"
          disabled={disabled}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}
