import React from 'react';

export default function CuponDescuento({ value = '', onChange = () => {}, onApply = () => {}, placeholder = 'Código', buttonText = 'Aplicar', className = '' }) {
    return (
        <div className={`mt-3 ${className}`}>
            <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-[0.25em] mb-2">Código especial</label>
            <div className="flex gap-2">
                <input type="text" value={value} onChange={onChange} placeholder={placeholder} className="flex-1 border border-gray-200 rounded-lg py-3 px-4 text-[12px] font-bold"/>
                <button type="button" onClick={onApply} disabled={!value} className="px-4 py-3 text-[12px] font-bold bg-[#7a0202] text-white rounded-lg disabled:opacity-50">
                    {buttonText}
                </button>
            </div>
        </div>
    );
}
