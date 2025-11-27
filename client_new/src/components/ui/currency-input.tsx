import React, { useState, useEffect, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string | number;
    onChange: (value: string) => void;
}

export function CurrencyInput({ value, onChange, className, ...props }: CurrencyInputProps) {
    const [displayValue, setDisplayValue] = useState('');

    // Format number with commas
    const formatCurrency = (val: string) => {
        if (!val) return '';
        const number = parseFloat(val.replace(/,/g, ''));
        if (isNaN(number)) return val;
        return number.toLocaleString('en-US', { maximumFractionDigits: 20 });
    };

    useEffect(() => {
        // When external value changes, update display value if it's not currently being edited or if it's different
        // We need to be careful not to mess up typing, but for initial load or external updates:
        if (value === '' || value === undefined || value === null) {
            setDisplayValue('');
        } else {
            // Check if the current display value roughly matches the new value to avoid cursor jumping issues during typing
            // This is a simple heuristic. For a robust solution, we might need more complex cursor management.
            // But for this task, let's try to keep it simple: always format on blur, or handle simple typing.

            // Actually, let's just format the incoming value. 
            // If the user is typing "1234", value might be "1234". We want to show "1,234".
            // If we just setDisplayValue(formatCurrency(value.toString())), it might interfere if we do it on every render caused by parent update.
            // However, since we control the onChange, we can manage it.

            // Let's rely on the local state for driving the input, and sync from props when they change significantly.
            const stringValue = value.toString();
            const numericValue = parseFloat(stringValue.replace(/,/g, ''));
            const currentDisplayNumeric = parseFloat(displayValue.replace(/,/g, ''));

            // Only update if the numeric value is actually different (handling "1000" vs "1,000")
            if (numericValue !== currentDisplayNumeric) {
                setDisplayValue(formatCurrency(stringValue));
            }
        }
    }, [value]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Allow digits, one decimal point, and commas
        // Remove non-numeric chars except dot
        const rawValue = inputValue.replace(/[^0-9.]/g, '');

        // Prevent multiple dots
        const parts = rawValue.split('.');
        if (parts.length > 2) return;

        // Update parent with the raw numeric string (no commas)
        onChange(rawValue);

        // Update local display value with formatting
        // We need to handle the case where user types a dot or is in the middle of typing
        // If we format immediately, "1000" becomes "1,000".
        // If user types "1000.", we want "1,000."

        const formatted = formatNumberString(rawValue);
        setDisplayValue(formatted);
    };

    const formatNumberString = (val: string) => {
        if (!val) return '';
        const parts = val.split('.');
        const integerPart = parts[0];
        const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

        // Format integer part with commas
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        return formattedInteger + decimalPart;
    };

    return (
        <Input
            {...props}
            type="text" // Must be text to allow commas
            value={displayValue}
            onChange={handleChange}
            className={className}
        />
    );
}
