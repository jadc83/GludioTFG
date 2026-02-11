export default function ReservaRooms({ habitaciones = [], localizador }) {
    if (!habitaciones || habitaciones.length === 0) return null;
    return (
        <section
            aria-label="Habitaciones reservadas"
            className="overflow-hidden rounded-2xl border border-gray-200 bg-gris shadow-sm"
        >
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-800">
                    Contrato y Activos
                </h3>
            </div>
            <div className="divide-y divide-gray-100">
                {habitaciones.map((hab, idx) => (
                    <div
                        key={hab.id || idx}
                        className="flex items-center justify-between p-6 transition hover:bg-gray-50"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-xs font-black uppercase text-white">
                                {hab.tipo?.charAt(0) || 'H'}
                            </div>
                            <div>
                                <span className="block text-lg font-black uppercase leading-tight text-gray-900">
                                    {hab.numero
                                        ? `Habitación ${hab.numero}`
                                        : hab.tipo}
                                </span>
                                <span className="font-mono text-[10px] uppercase tracking-tighter text-gray-400">
                                    {hab.numero
                                        ? hab.tipo
                                        : `ID: ${localizador}-${idx + 1}`}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
