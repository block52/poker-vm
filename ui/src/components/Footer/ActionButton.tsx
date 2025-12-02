import React from "react";
import { LoadingSpinner } from "../common";

interface ActionButtonProps {
    action: string;
    label: string;
    amount?: string;
    icon?: React.ReactNode;
    variant?: "primary" | "secondary" | "danger" | "success";
    loading?: boolean;
    disabled?: boolean;
    onClick: () => void;
    className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    action,
    label,
    amount,
    icon,
    variant = "primary",
    loading,
    disabled,
    onClick,
    className = ""
}) => {
    const variantStyles: Record<string, string> = {
        primary: "btn-raise",
        secondary: "btn-check",
        danger: "btn-fold",
        success: "btn-call"
    };

    const baseClass = variantStyles[variant] || variantStyles.primary;

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseClass} ${className} flex items-center justify-center gap-1 lg:gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            data-action={action}
        >
            {loading && <LoadingSpinner size="sm" />}
            {icon}
            <span>{loading ? `${label}...` : label}</span>
            {amount && !loading && (
                <span className="font-bold ml-1">${amount}</span>
            )}
        </button>
    );
};
