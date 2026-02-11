export default function InputError({ message, className = '', id, ...props }) {
    if (!message) return null;
    const propsToUse = { ...props };
    if (id) propsToUse.id = id;
    return (
        <p
            {...propsToUse}
            role="alert"
            aria-atomic="true"
            className={'text-sm text-red-600 ' + className}
        >
            {message}
        </p>
    );
}
