export const IconSvg = ({ name, className = 'inline-block w-5 h-5' }) => {
    switch (name) {
        case 'bed-single':
            return (
                <svg
                    className={className}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M3 13v3a1 1 0 001 1h1v2h2v-2h8v2h2v-2h1a1 1 0 001-1v-3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M3 13h18V8a2 2 0 00-2-2H5a2 2 0 00-2 2v5z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );
        case 'bed-double':
            return (
                <svg
                    className={className}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M3 13v3a1 1 0 001 1h16a1 1 0 001-1v-3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <rect
                        x="3"
                        y="7"
                        width="18"
                        height="6"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );
        case 'family':
            return (
                <svg
                    className={className}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M12 3l7 5v9a1 1 0 01-1 1h-3v-5H9v5H6a1 1 0 01-1-1V8l7-5z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );
        case 'suite':
            return (
                <svg
                    className={className}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M12 2l1.9 4.9L19 8l-4.5 3.2L15.8 16 12 13.5 8.2 16l1.3-4.8L5 8l5.1-1.1L12 2z"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );
        default:
            return (
                <svg
                    className={className}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect
                        x="3"
                        y="7"
                        width="18"
                        height="10"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );
    }
};

export default IconSvg;
