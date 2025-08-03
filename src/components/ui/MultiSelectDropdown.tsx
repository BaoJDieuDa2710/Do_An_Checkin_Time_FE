import React from "react";
import { Button } from "./Button";
import { Check, X } from "lucide-react";

export type MultiSelectItem<T> = {
    label: string;
    value: T;
};

interface MultiSelectDropdownProps<T> {
    items: MultiSelectItem<T>[];
    onSelectionChange: (values: T[]) => void;
    placeholder?: string;
    className?: string;
    selectedValues?: T[];
}

const MultiSelectDropdown = <T,>({
    items,
    onSelectionChange,
    placeholder = "Select options",
    className,
    selectedValues = [],
}: MultiSelectDropdownProps<T>) => {
    const [selected, setSelected] = React.useState<T[]>(selectedValues);

    const handleToggleItem = (value: T) => {
        const newSelected = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value];
        setSelected(newSelected);
        onSelectionChange(newSelected);
    };

    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelected([]);
        onSelectionChange([]);
    };

    const getDisplayText = () => {
        if (selected.length === 0) return placeholder;
        if (selected.length === 1) {
            const item = items.find((item) => item.value === selected[0]);
            return item?.label || placeholder;
        }
        return `${selected.length} selected`;
    };

    return (
        <div className={`relative inline-block group ${className}`}>
            <Button 
                variant="secondary" 
                className="relative w-fit justify-between"
            >
                <span className="truncate">{getDisplayText()}</span>
                {selected.length > 0 && (
                    <X 
                        className="w-4 h-4 ml-2 opacity-60 hover:opacity-100"
                        onClick={handleClearAll}
                    />
                )}
            </Button>

            <ul className="absolute left-0 w-48 z-20 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block">
                {items.map((item) => (
                    <li
                        key={item.label}
                        onClick={() => handleToggleItem(item.value)}
                        className="flex items-center justify-between text-sm px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
                    >
                        <span>{item.label}</span>
                        {selected.includes(item.value) && (
                            <Check className="w-4 h-4 text-blue-600" />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MultiSelectDropdown;
