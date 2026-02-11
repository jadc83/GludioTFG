import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import React from 'react';

export default function Boton({
    children,
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    onClick,
    className = '',
    icon = null,
    ...props
}) {
    // Variantes de color
    const variants = {
        primary:
            'bg-[#7a0202] text-white hover:bg-black focus:ring-[#920303] shadow-lg shadow-red-100',
        secondary:
            'bg-gray-900 text-white hover:bg-[#7a0202] focus:ring-gray-700 shadow-sm',
        outline:
            'border-2 border-gray-900 bg-transparent text-gray-900 hover:bg-gray-900 hover:text-white focus:ring-gray-700',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
        success:
            'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
        light: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-300 shadow-sm',
    };

    // Tamaños
    const sizes = {
        xs: 'px-3 py-1.5 text-[10px] rounded-lg',
        sm: 'px-4 py-2 text-xs rounded-lg',
        md: 'px-6 py-3 text-sm rounded-xl',
        lg: 'px-8 py-4 text-base rounded-xl',
        xl: 'px-12 py-5 text-lg rounded-2xl',
    };

    const baseClasses =
        'inline-flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

    const variantClasses = variants[variant] || variants.primary;
    const sizeClasses = sizes[size] || sizes.md;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            aria-disabled={disabled || loading ? 'true' : undefined}
            aria-busy={loading ? 'true' : undefined}
            className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
            {...props}
        >
            {loading ? (
                <>
                    <LoadingSpinner className="!py-0" />
                    <span className="sr-only">Cargando</span>
                    {children}
                </>
            ) : (
                <>
                    {icon &&
                        React.createElement(icon, { className: 'h-4 w-4' })}
                    {children}
                </>
            )}
        </button>
    );
}
