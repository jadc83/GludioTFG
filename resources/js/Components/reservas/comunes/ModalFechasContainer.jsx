import ModalFechas from '@/Components/reservas/comunes/ModalFechas';
import React from 'react';

export default function ModalFechasContainer({
    mostrar,
    setMostrar,
    reserva,
    fechaCheckIn,
    fechaCheckOut,
    setFechaCheckIn,
    setFechaCheckOut,
    preview,
    previewLoading,
    previewError,
    previewLoaded,
    clearPreview,
    refresh,
    setReserva,
    originalPrecioBackup,
    setOriginalPrecioBackup,
    confirmarModalFechas,
    procesando,
}) {
    return (
        <ModalFechas
            mostrar={mostrar}
            modalCheckIn={fechaCheckIn}
            modalCheckOut={fechaCheckOut}
            setModalCheckIn={setFechaCheckIn}
            setModalCheckOut={setFechaCheckOut}
            isCheckedIn={String(reserva.status || '').toLowerCase() === 'checked_in'}
            vistaPrevia={preview}
            cargandoVistaPrevia={previewLoading}
            errorVistaPrevia={previewError}
            vistaPreviaCargada={previewLoaded}
            reserva={reserva}
            clearPreview={clearPreview}
            onCerrar={() => setMostrar(false)}
            onConfirmar={confirmarModalFechas}
            onApplied={async (resData) => {
                setMostrar(false);
                try {
                    const currentPrecio = Number(reserva.precio_total ?? 0);
                    if (originalPrecioBackup === null) setOriginalPrecioBackup(currentPrecio);
                } catch (e) {
                }

                if (resData && resData.reserva) {
                    setReserva(resData.reserva);
                    try {
                        clearPreview();
                    } catch (e) {
                    }
                } else if (preview && preview.nuevo_total !== undefined) {
                    setReserva((r) => ({ ...r, precio_total: Number(preview.nuevo_total) }));
                }

                (async () => {
                    try {
                        await refresh();
                        setOriginalPrecioBackup(null);
                    } catch (e) {
                        if (resData && resData.reserva) setReserva(resData.reserva);
                    }
                })();
            }}
            procesando={procesando}
        />
    );
}
