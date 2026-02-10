import { router } from '@inertiajs/react';
import { useState } from 'react';

/* Hook personalizado para manejar modales en el escáner QR */
export function useQRModal() {
    const [mostrarModal, setmostrarModal] = useState(false);
    const [tipoModal, settipoModal] = useState(null);
    const [reservaInfo, setReservaInfo] = useState(null);

    const abrirModal = (type, reserva = null) => {
        settipoModal(type);
        setReservaInfo(reserva);
        setmostrarModal(true);
    };

    const cerrarModal = () => {
        setmostrarModal(false);

        if (tipoModal === 'checkin') {
            const loc = reservaInfo?.localizador || '';
            if (loc) {
                router.visit(`/reserva/${encodeURIComponent(loc)}`);
            }
        } else if (tipoModal === 'checkout') {
            router.visit('/');
        } else if (tipoModal === 'success') {
            const loc = reservaInfo?.localizador || '';
            if (loc) {
                router.visit(route('reserva.show', { reserva: loc }));
            }
        }
    };

    return { mostrarModal, tipoModal, reservaInfo, abrirModal, cerrarModal };
}
