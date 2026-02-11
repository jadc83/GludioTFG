import useTarifasSelector from '@/hooks/reservas/useTarifasSelector';
import { formatearModificador } from '@/utils/formatters';
import { t as translate } from '@/i18n';

export default function TarifasSelector({
    tarifas = [],
    seleccion = {},
    onChange,
}) {
    const { ordenadasVisibles, toggleTarifa, esDesayuno, isChecked } = useTarifasSelector({
        tarifas,
        seleccion,
        onChange,
    });

    return (
        <aside>
            <div className="sticky top-6 overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 p-4 rounded-t-xl">
                    <h4 className="text-sm font-bold text-gray-900">
                        {translate('paso2.services_title')}
                    </h4>
                    <p className="mt-1 text-[11px] text-gray-500">
                        {translate('paso2.services_subtitle')}
                    </p>
                </div>

                <div className="p-4">
                    {tarifas.length === 0 ? (
                        <p className="py-4 text-center text-xs italic text-gray-400">
                            {translate('paso2.loading_services')}
                        </p>
                    ) : (
                        <>
                            <div className="space-y-2">
                                {ordenadasVisibles.map((tarifa) => {
                                    const breakfast = esDesayuno(tarifa);
                                    const checked = isChecked(tarifa);
                                    const priceText = breakfast
                                        ? translate('paso2.free')
                                        : formatearModificador(tarifa.modificador_precio ?? 0, 'fijo');

                                    const keySlug = String(tarifa.slug || tarifa.id).replace(/-/g, '_');
                                    const transKey = `tarifas.${keySlug}.name`;
                                    const translatedName = translate(transKey);
                                    const displayName = translatedName === transKey ? tarifa.nombre : translatedName;

                                    return (
                                        <label
                                            key={tarifa.id}
                                            className={`flex cursor-pointer items-center justify-between rounded-md p-1`}
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() =>
                                                        toggleTarifa(tarifa.id)
                                                    }
                                                    className="h-3 w-3 rounded border-gray-300 text-[#7a0202] focus:ring-[#7a0202]"
                                                    aria-label={`Seleccionar servicio ${tarifa.nombre}`}
                                                    disabled={breakfast}
                                                />
                                                <div className="ml-1 min-w-0 flex-1">
                                                    <span
                                                        title={tarifa.nombre}
                                                        className="block truncate text-[10px] font-semibold text-gray-800"
                                                    >
                                                        {displayName}
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
                    {/* Información detallada eliminada por petición del usuario */}
                </div>
            </div>
        </aside>
    );
}
