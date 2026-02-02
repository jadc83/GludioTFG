import { useEffect } from 'react';

export default function TarifasSelector({
    tarifas = [],
    seleccion = {},
    onChange,
}) {
    const esDesayuno = (t) => {
        const nombre = String(t.nombre || '').toLowerCase();
        const slug = String(t.slug || '').toLowerCase();
        return nombre.includes('desayun') || slug.includes('desayun');
    };

    useEffect(() => {
        if (!onChange || tarifas.length === 0) return;
        const desayunoIds = tarifas.filter(esDesayuno).map((t) => t.id);
        if (desayunoIds.length === 0) return;

        let necesitaUpdate = false;
        const next = { ...seleccion };
        desayunoIds.forEach((id) => {
            if (!next[id]) {
                next[id] = true;
                necesitaUpdate = true;
            }
        });

        if (necesitaUpdate) {
            onChange(next);
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('tarifasLista', { detail: tarifas }),
            );
        }
    }, [tarifas, onChange]);

    function toggleTarifa(id) {
        const tarifa = tarifas.find((t) => t.id === id);
        if (tarifa && esDesayuno(tarifa)) return;

        const next = { ...seleccion, [id]: !seleccion[id] };
        if (onChange) onChange(next);
    }

    const ordenadas = [
        ...tarifas.filter(esDesayuno),
        ...tarifas.filter((t) => !esDesayuno(t)),
    ];
    const esReembolsable = (t) => {
        const nombre = String(t.nombre || '').toLowerCase();
        const slug = String(t.slug || '').toLowerCase();
        return nombre.includes('reembols') || slug.includes('reembols');
    };

    const esOfertaEspecial = (t) => {
        const nombre = String(t.nombre || '').toLowerCase();
        const slug = String(t.slug || '').toLowerCase();
        return (
            nombre.includes('ofert') ||
            nombre.includes('especial') ||
            slug.includes('ofert') ||
            slug.includes('especial')
        );
    };

    const ordenadasVisibles = ordenadas.filter((t) => {
        if (esDesayuno(t)) return true;
        if (esReembolsable(t)) return false;
        if (esOfertaEspecial(t)) return false;
        return true;
    });

    return (
        <aside>
            <div className="sticky top-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 p-4">
                    <h4 className="text-sm font-bold text-gray-900">
                        Servicios disponibles
                    </h4>
                    <p className="mt-1 text-[11px] text-gray-500">
                        Personaliza tu estancia
                    </p>
                </div>

                <div className="p-4">
                    {tarifas.length === 0 ? (
                        <p className="py-4 text-center text-xs italic text-gray-400">
                            Cargando servicios...
                        </p>
                    ) : (
                        <>
                            <div className="space-y-2">
                                {ordenadasVisibles.map((t) => {
                                    const breakfast = esDesayuno(t);
                                    const checked = breakfast
                                        ? true
                                        : !!seleccion[t.id];
                                    const priceText = breakfast
                                        ? 'Gratis'
                                        : `${Number(t.modificador_precio) >= 0 ? '+' : ''}${Number(t.modificador_precio).toFixed(0)}€`;

                                    return (
                                        <label
                                            key={t.id}
                                            className={`flex cursor-pointer items-center justify-between rounded-md border p-1 transition-colors ${checked ? 'border-red-200 bg-red-50' : 'border-gray-100 hover:bg-gray-50'}`}
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() =>
                                                        toggleTarifa(t.id)
                                                    }
                                                    className="h-3 w-3 rounded border-gray-300 text-[#7a0202] focus:ring-[#7a0202]"
                                                    aria-label={`Seleccionar servicio ${t.nombre}`}
                                                    disabled={breakfast}
                                                />
                                                <div className="ml-1 min-w-0 flex-1">
                                                    <span
                                                        title={t.nombre}
                                                        className="block truncate text-[10px] font-semibold text-gray-800"
                                                    >
                                                        {t.nombre}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="ml-2 flex-shrink-0 text-[9px] font-semibold text-gray-700">
                                                {priceText}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </>
                    )}
                    <button
                        type="button"
                        onClick={() =>
                            window.dispatchEvent(
                                new CustomEvent('abrirInfoTarifas'),
                            )
                        }
                        className="mt-4 w-full rounded-lg border border-[#7a0202] py-2 text-[11px] font-bold text-[#7a0202] transition-colors hover:bg-[#7a0202] hover:text-white"
                    >
                        Información detallada
                    </button>
                </div>
            </div>
        </aside>
    );
}
