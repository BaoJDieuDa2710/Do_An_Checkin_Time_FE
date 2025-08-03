// DropdownHover.tsx
import React, { useState } from "react";
import { Button } from "./Button";
import { CheckInFilters } from "../../services/checkins";

export type DropdownItem<T> = {
    label: string;
    value: T;
};

interface GenericDropdownProps<T> {
    items: DropdownItem<T>[];
    onSelect: (value: T) => void;
    placeholder?: string;
    className?: string;
}

const GenericDropdown = <T,>({
    items,
    onSelect,
    placeholder = "Select an option",
    className,
}: GenericDropdownProps<T>) => {
    const [selected, setSelected] = useState<DropdownItem<T> | null>(null);

    const handleSelect = (item: DropdownItem<T>) => {
        setSelected(item);
        onSelect(item.value);
    };

    return (
        <div className={`relative inline-block group ${className}`} onClick={(e) => {e.preventDefault(); e.stopPropagation()}}>
            <Button variant="secondary" className="relative">
                {selected?.label || placeholder}
            </Button>

            {/* Dropdown menu */}
            <ul className="absolute left-0 mt-0 w-48 z-10 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 ease-in-out z-20 transform group-hover:-translate-y-1">
                {items.map((item) => (
                    <li
                        key={item.label}
                        onClick={() => handleSelect(item)}
                        className="text-sm px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
                    >
                        {item.label}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GenericDropdown;
