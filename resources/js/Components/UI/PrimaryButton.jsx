export default function PrimaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            aria-disabled={disabled ? 'true' : undefined}
            className={
                `inline-flex items-center justify-center rounded-sm border border-transparent bg-black px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-[#7a0202] focus:bg-[#7a0202] focus:outline-none focus:ring-2 focus:ring-[#920303] focus:ring-offset-2 active:bg-[#6b0101] ${
                    disabled ? 'pointer-events-none opacity-25' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
