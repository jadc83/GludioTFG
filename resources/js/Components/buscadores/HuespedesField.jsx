import Campo from '@/Components/reservas/utilidades/Campo';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { t } from '@/i18n';

export default function HuespedesField({ formularioReserva }) {
    return (
        <div className="flex flex-row items-center gap-1.5 rounded bg-gris px-2 py-1">
            <label className="whitespace-nowrap text-xs font-semibold text-gray-700">
                <span className="hidden sm:inline">{t('barra.huespedes')}:</span>
                <span className="inline-flex sm:hidden">
                    <UserGroupIcon className="h-5 w-5 text-gray-700" />
                </span>
            </label>
            <Campo
                id="num_huespedes_barra"
                type="number"
                min={1}
                max={4}
                sinEstilosPorDefecto={true}
                value={formularioReserva.numHuespedes}
                onChange={(e) =>
                    formularioReserva.setNumHuespedes(
                        Math.min(
                            4,
                            Math.max(1, Number(e.target.value) || 1),
                        ),
                    )
                }
                clase="w-16 text-sm px-2 py-1 rounded border border-gray-300 bg-white text-gray-700"
            />
        </div>
    );
}
