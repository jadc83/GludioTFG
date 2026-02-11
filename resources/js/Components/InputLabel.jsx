export default function InputLabel({
    value,
    htmlFor,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            htmlFor={htmlFor}
            {...props}
            className={`block text-sm font-medium text-gray-700 ` + className}
            aria-hidden={props['aria-hidden'] || undefined}
        >
            {value ? value : children}
        </label>
    );
}
