import React from 'react';

export default function SeccionFormulario({ titulo, children }) {
    return (
        <section className="mb-6">
            {titulo ? <h4 className="mb-2 text-sm font-black uppercase text-gray-700">{titulo}</h4> : null}
            <div className="space-y-3">{children}</div>
        </section>
    );
}
