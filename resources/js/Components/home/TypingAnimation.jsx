import { useState, useEffect } from 'react';

export default function TypingAnimation({ words = [], typeSpeed = 50, deleteSpeed = 30, pauseDelay = 1500, loop = true }) {
    const [displayText, setDisplayText] = useState('');
    const [wordIndex, setWordIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (words.length === 0) return;

        const currentWord = words[wordIndex];
        const targetText = isDeleting ? '' : currentWord;
        const speed = isDeleting ? deleteSpeed : typeSpeed;

        const timer = setTimeout(() => {
            if (!isDeleting && displayText === currentWord) {
                // Pause antes de eliminar
                setTimeout(() => setIsDeleting(true), pauseDelay);
            } else if (isDeleting && displayText === '') {
                // Cambiar a siguiente palabra
                setIsDeleting(false);
                setWordIndex((prev) => (prev + 1) % words.length);
            } else {
                // Tipear o eliminar
                const newText = isDeleting
                    ? currentWord.substring(0, displayText.length - 1)
                    : currentWord.substring(0, displayText.length + 1);
                setDisplayText(newText);
            }
        }, speed);

        return () => clearTimeout(timer);
    }, [displayText, wordIndex, isDeleting, words, typeSpeed, deleteSpeed, pauseDelay]);

    return (
        <span className="inline-flex items-center gap-1">
            <span className="font-medium text-gray-700">{displayText}</span>
            <span className="inline-block w-0.5 h-5 bg-[#7a0202] animate-pulse"></span>
        </span>
    );
}
