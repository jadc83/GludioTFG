export default function ApplicationLogo(props) {
    return (
        <svg
            {...props}
            role="img"
            aria-label={props['aria-label'] || 'Hotel Gludio logo'}
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <mask id="g-mask">
                    <rect x="0" y="0" width="100" height="100" fill="white" />

                    <circle cx="50" cy="50" r="28" fill="black" />

                    <polygon points="53,-10 110,-10 110,42 40,42" fill="black" />
                </mask>
            </defs>

            <circle cx="50" cy="50" r="44" fill="#800020" mask="url(#g-mask)" />

            <polygon points="50,42 70,42 66,58 46,58" fill="#800020" />
        </svg>
    );
}
