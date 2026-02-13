import React from 'react';

export default function GaleriaPrevisualizacion({ imagenes = [] }) {
    if (!imagenes || imagenes.length === 0) return null;
    return (
        <div className="grid grid-cols-3 gap-2">
            {imagenes.map((src, i) => (
                <div key={i} className="overflow-hidden rounded-md bg-gray-50">
                    <img src={src} alt={`preview-${i}`} className="h-24 w-full object-cover" />
                </div>
            ))}
        </div>
    );
}
