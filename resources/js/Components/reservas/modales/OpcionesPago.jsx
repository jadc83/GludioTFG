import { CreditCardIcon, BuildingLibraryIcon, CheckCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
export default function OpcionesPago({ pagarAlLlegar, setPagarAlLlegar, setOpcionPagoSeleccionada, prepararDatosReserva, errorPago}) {
    const cardBaseClass = "relative flex flex-col p-5 border-2 transition-all duration-300 cursor-pointer rounded-xl group";
    const activeClass = "border-white/40 bg-gradient-to-br from-[#920303] to-[#6b0202] shadow-xl text-white";
    const inactiveClass = "border-white/20 bg-black/20 hover:border-white/40 text-white/60";

    return (
        <div className="space-y-4">
            {/* SELECTORES DE MODO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* OPCIÓN: TARJETA (STRIPE) */}
                <div
                    onClick={() => { setPagarAlLlegar(false); setOpcionPagoSeleccionada(true); }}
                    className={`${cardBaseClass} ${!pagarAlLlegar ? activeClass : inactiveClass}`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <CreditCardIcon className={`h-6 w-6 ${!pagarAlLlegar ? 'text-white' : 'text-white/40'}`} />
                        {!pagarAlLlegar && <CheckCircleIcon className="h-5 w-5 text-white" />}
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${!pagarAlLlegar ? 'text-white' : 'text-white/60'}`}>Pago con Tarjeta</span>
                    <span className={`text-[9px] font-bold uppercase mt-1 ${!pagarAlLlegar ? 'text-white/60' : 'text-white/40'}`}>Pasarela Stripe SSL</span>
                </div>

                {/* OPCIÓN: RECEPCIÓN */}
                <div
                    onClick={() => { setPagarAlLlegar(true); setOpcionPagoSeleccionada(true); }}
                    className={`${cardBaseClass} ${pagarAlLlegar ? activeClass : inactiveClass}`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <BuildingLibraryIcon className={`h-6 w-6 ${pagarAlLlegar ? 'text-white' : 'text-white/40'}`} />
                        {pagarAlLlegar && <CheckCircleIcon className="h-5 w-5 text-white" />}
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${pagarAlLlegar ? 'text-white' : 'text-white/60'}`}>En Recepción</span>
                    <span className={`text-[9px] font-bold uppercase mt-1 ${pagarAlLlegar ? 'text-white/60' : 'text-white/40'}`}>Pago durante el check-in</span>
                </div>
            </div>

            {/* ÁREA DINÁMICA: Solo para pago en recepción */}
            {pagarAlLlegar && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="p-3 bg-gradient-to-br from-[#920303] to-[#6b0202] border border-white/20 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheckIcon className="h-6 w-6 text-white/60 flex-shrink-0" />
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">Garantía de Reserva</p>
                                <p className="text-[10px] font-bold text-white/60">No se realizará ningún cargo ahora. La confirmación es inmediata.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ERRORES */}
            {errorPago && (
                <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-lg flex items-center gap-4">
                    <span className="text-[10px] font-black text-red-800 uppercase tracking-widest">{errorPago}</span>
                </div>
            )}
        </div>
    );
}
