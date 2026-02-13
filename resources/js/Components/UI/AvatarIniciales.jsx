import React from 'react';

export default function AvatarIniciales({ name = '', size = 10 }) {
    const letra = (name && name.charAt(0)) || '?';
    const px = size === 10 ? 'h-10 w-10' : 'h-8 w-8';
    return (
        <div className={`flex ${px} items-center justify-center rounded-full bg-gray-100 text-xs font-black uppercase text-gray-400`}>
            {letra}
        </div>
    );
}
