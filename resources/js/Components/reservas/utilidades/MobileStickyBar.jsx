import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function MobileStickyBar({ children, className = '' }) {
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setMounted(true);
        const mq = window.matchMedia('(max-width: 767px)');
        const onChange = (e) => setIsMobile(e.matches);
        setIsMobile(mq.matches);
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else mq.addListener(onChange);
        return () => {
            if (mq.removeEventListener)
                mq.removeEventListener('change', onChange);
            else mq.removeListener(onChange);
        };
    }, []);

    if (!mounted || !isMobile) return null;

    return createPortal(
        <div
            className={`mobile-sticky-bar md:hidden ${className}`}
            style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                zIndex: 99999,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                backgroundColor: '#ffffff',
                boxShadow: '0 -10px 30px rgba(0,0,0,0.08)',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                backdropFilter: 'none',
                boxSizing: 'border-box',
                transform: 'none',
                pointerEvents: 'auto',
            }}
        >
            {children}
        </div>,
        document.body,
    );
}
