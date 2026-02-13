import React from 'react';

export default function DialogoConfirmacion({ abierto = false, titulo = 'Confirmar', mensaje = '', onConfirm = () => {}, onCancelar = () => {} }) {
    if (!abierto) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onCancelar} />
            <div className="z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                <h3 className="mb-2 text-lg font-bold">{titulo}</h3>
                <p className="mb-4 text-sm text-gray-600">{mensaje}</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancelar} className="rounded-md px-3 py-2">Cancelar</button>
                    <button onClick={onConfirm} className="rounded-md bg-red-600 px-3 py-2 text-white">Confirmar</button>
                </div>
            </div>
        </div>
    );
}
