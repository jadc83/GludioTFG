import FechaEditor from '@/Components/reservas/FechaEditor';
import { t } from '@/i18n';
import { useMemo } from 'react';

export default function FechasPanel({
    reserva,
    showFechaEditor,
    setShowFechaEditor,
    vistaPrevia,
    previewLoading,
    previewError,
    fetchPreview,
    clearPreview,
    setFechaModalCheckIn,
    setFechaModalCheckOut,
    setMostrarModalFechas,
    confirmarModalFechas,
    vistaPreviaCargada,
    refresh,
}) {
    const manejarOnRequestConfirmDates = (ci, co) => {
        try {
            setFechaModalCheckIn(ci);
            setFechaModalCheckOut(co);
            setMostrarModalFechas(true);
        } catch (e) {
        }
    };

    return (
        <div className="w-full">
            <div className="w-full overflow-hidden rounded-lg border bg-white">
                <button
                    type="button"
                    onClick={() => setShowFechaEditor((s) => !s)}
                    aria-expanded={showFechaEditor}
                    className="flex w-full items-center justify-between bg-[#7a0202] px-4 py-3 text-white hover:bg-[#5f0101]"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-black text-white">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="font-medium">{t('edit_reserva.modify_dates_button')}</span>
                    </div>
                    <svg
                        className={`h-5 w-5 transform text-white transition-transform duration-200 ${showFechaEditor ? 'rotate-180' : 'rotate-0'}`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {showFechaEditor && (
                    <div className="p-4">
                        <FechaEditor
                            reserva={reserva}
                            setReserva={() => {}}
                            refresh={refresh}
                            vistaPrevia={vistaPrevia}
                            cargandoVistaPrevia={previewLoading}
                            errorVistaPrevia={previewError}
                            obtenerPreview={fetchPreview}
                            clearPreview={clearPreview}
                            noWrapper={true}
                            onRequestConfirmDates={manejarOnRequestConfirmDates}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
