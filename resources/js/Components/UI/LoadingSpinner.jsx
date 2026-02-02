export default function LoadingSpinner({
    color = 'text-[#7a0202]',
    size = 'loading-sm',
    className = '',
}) {
    return (
        <span
            className={`loading loading-spinner ${color} ${size} ${className}`}
        ></span>
    );
}
