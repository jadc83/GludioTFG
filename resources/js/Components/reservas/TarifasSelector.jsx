import React, { useEffect, useState } from 'react';

export default function TarifasSelector({ tarifas = [], seleccion = {}, onChange }) {
    // Detecta si una tarifa parece corresponder al desayuno
    const esDesayuno = (t) => {
        const nombre = String(t.nombre || '').toLowerCase();
        const slug = String(t.slug || '').toLowerCase();
        return nombre.includes('desayun') || slug.includes('desayun');
    };

    // Al montar / cuando cambian las tarifas, nos aseguramos de que las tarifas de desayuno estén marcadas
    useEffect(() => {
        if (!onChange || tarifas.length === 0) return;
        const desayunoIds = tarifas.filter(esDesayuno).map(t => t.id);
        if (desayunoIds.length === 0) return;

        let necesitaUpdate = false;
        const next = { ...seleccion };
        desayunoIds.forEach(id => {
            if (!next[id]) { next[id] = true; necesitaUpdate = true; }
        });

        if (necesitaUpdate) {
            onChange(next);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('tarifasSeleccionadas', { detail: next }));
            }
        }
        // Emitir la lista completa de tarifas para que otros componentes la conozcan
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tarifasLista', { detail: tarifas }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tarifas]);

    function toggleTarifa(id) {
        const tarifa = tarifas.find(t => t.id === id);
        if (tarifa && esDesayuno(tarifa)) return; // desayuno siempre marcado, no se puede desactivar

        const next = { ...seleccion, [id]: !seleccion[id] };
        if (onChange) onChange(next);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tarifasSeleccionadas', { detail: next }));
        }
    }

    const ordenadas = [...tarifas.filter(esDesayuno), ...tarifas.filter(t => !esDesayuno(t))];

    // Ocultar tarifas redundantes como "reembolsable" (que no suman ni restan), pero mantener desayuno
    const esReembolsable = (t) => {
        const nombre = String(t.nombre || '').toLowerCase();
        const slug = String(t.slug || '').toLowerCase();
        return nombre.includes('reembols') || slug.includes('reembols');
    };

    // Ocultar tarifas de tipo "oferta especial" si existen
    const esOfertaEspecial = (t) => {
        const nombre = String(t.nombre || '').toLowerCase();
        const slug = String(t.slug || '').toLowerCase();
        return nombre.includes('ofert') || nombre.includes('especial') || slug.includes('ofert') || slug.includes('especial');
    };

    const ordenadasVisibles = ordenadas.filter(t => {
        if (esDesayuno(t)) return true;
        if (esReembolsable(t)) return false;
        if (esOfertaEspecial(t)) return false;
        return true;
    });

    // Estado para código especial temporal
    const [codigoEspecial, setCodigoEspecial] = useState('');

    function aplicarCodigo() {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('codigoEspecialAplicar', { detail: { codigo: codigoEspecial } }));
        }
    }

    return (
        <aside>
            <div className="sticky top-6 rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900">Servicios disponibles</h4>
                    <p className="text-[11px] text-gray-500 mt-1">Personaliza tu estancia</p>
                </div>

                <div className="p-4">
                    {tarifas.length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-center py-4">Cargando servicios...</p>
                    ) : (
                        <>
                            <div className="space-y-2">
                                {ordenadasVisibles.map((t) => {
                                const breakfast = esDesayuno(t);
                                            const checked = breakfast ? true : !!seleccion[t.id];
                                const priceText = breakfast ? 'Gratis' : `${Number(t.modificador_precio) >= 0 ? '+' : ''}${Number(t.modificador_precio).toFixed(0)}€`;

                                return (
                                    <label key={t.id} className={`flex items-center justify-between p-1 rounded-md border transition-colors cursor-pointer ${checked ? 'bg-red-50 border-red-200' : 'hover:bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-center gap-2 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleTarifa(t.id)}
                                                className="w-3 h-3 rounded border-gray-300 text-[#7a0202] focus:ring-[#7a0202]"
                                                aria-label={`Seleccionar servicio ${t.nombre}`}
                                                disabled={breakfast}
                                            />
                                            <div className="flex-1 min-w-0 ml-1">
                                                <span title={t.nombre} className="text-[10px] font-semibold text-gray-800 truncate block">{t.nombre}</span>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-semibold text-gray-700 flex-shrink-0 ml-2">
                                            {priceText}
                                        </span>
                                    </label>
                                );
                            })}
                            </div>

                            {/* Campo para código especial (temporal) */}
                            <div className="mt-3 flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={codigoEspecial}
                                    onChange={(e) => setCodigoEspecial(e.target.value)}
                                    placeholder="Código"
                                    className="w-full text-[10px] p-2 border border-gray-200 rounded-md"
                                />
                                <button type="button" onClick={aplicarCodigo} className="w-full px-3 py-2 text-[10px] font-bold bg-[#7a0202] text-white rounded-md">Aplicar</button>
                            </div>
                    </>
                    )}
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('abrirInfoTarifas'))}
                        className="mt-4 w-full py-2 text-[11px] font-bold text-[#7a0202] border border-[#7a0202] rounded-lg hover:bg-[#7a0202] hover:text-white transition-colors"
                    >
                        Información detallada
                    </button>
                </div>
            </div>
        </aside>
    );
}
