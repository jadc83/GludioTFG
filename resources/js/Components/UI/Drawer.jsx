import React from 'react';

export default function Drawer({ open = false, onClose = () => {}, children, size = 'md' }) {
    // size can be 'sm'|'md'|'lg' to control max-width
    const sizeClass = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-md';

    return (
        <div className={`fixed inset-0 z-[9999] transition-all duration-300 ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
            <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} role="button" tabIndex={0} aria-label="Cerrar" onKeyDown={(e) => { if (['Enter', ' ', 'Escape'].includes(e.key)) { e.preventDefault(); onClose(); } }} />

            <div className={`absolute bottom-0 right-0 top-0 flex w-full ${sizeClass} transform flex-col bg-white shadow-2xl transition-transform duration-500 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'} overflow-hidden !rounded-l-[2rem]`}>
                {children}
            </div>
        </div>
    );
}
