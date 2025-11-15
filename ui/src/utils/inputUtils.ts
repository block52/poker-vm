/**
 * Input validation and parsing utilities
 */

/**
 * Handles decimal input validation and parsing for currency/amount fields
 * Allows user to type incomplete decimals like "2.", "2.0", or "2.08"
 * 
 * @param rawValue - The raw input value from the text field
 * @param onValidInput - Callback function when valid input is entered (receives parsed number)
 * @param onClear - Callback function when input is cleared
 * @param onRawUpdate - Callback function to update raw input state (receives raw string)
 * 
 * @example
 * ```tsx
 * <input
 *   type="text"
 *   value={amount.toFixed(2)}
 *   onChange={e => handleDecimalInput(
 *     e.target.value,
 *     (value) => setAmount(value),
 *     () => { setAmount(0); setRawInput(""); },
 *     (raw) => setRawInput(raw)
 *   )}
 * />
 * ```
 */
export function handleDecimalInput(
    rawValue: string,
    onValidInput: (value: number) => void,
    onClear: () => void,
    onRawUpdate?: (raw: string) => void
): void {
    // Always allow clearing the field
    if (rawValue === "") {
        onClear();
        return;
    }

    // Allow typing incomplete decimals like "2.", "2.0", or "2.08"
    if (/^\d*\.?\d{0,2}$/.test(rawValue)) {
        // Update raw input state if callback provided
        if (onRawUpdate) {
            onRawUpdate(rawValue);
        }

        // Only parse if it's a valid number (e.g. "2", "2.0", "2.08")
        if (!isNaN(Number(rawValue)) && /^\d*\.?\d{1,2}$/.test(rawValue)) {
            onValidInput(parseFloat(rawValue));
        }
    }
}
