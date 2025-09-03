import * as React from "react";

import {
  Select as SelectPrimitive,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface SelectProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive> {}

type SelectItem = {
  label: string;
  value: string;
};

export function Select({
  placeholder,
  options,
  ...props
}: SelectProps & { placeholder: string; options: SelectItem[] }) {
  return (
    <SelectPrimitive {...props}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value} className="cursor-pointer">
              {item.label}
            </SelectItem>
          ))}
      </SelectContent>
    </SelectPrimitive>
  );
}
