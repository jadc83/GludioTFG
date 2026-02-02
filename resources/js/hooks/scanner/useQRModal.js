import { router } from '@inertiajs/react';
import { useState } from 'react';

/**
 * Hook personalizado para manejar modales en el escáner QR
 */
export function useQRModal() {
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [reservaInfo, setReservaInfo] = useState(null);

    const openModal = (type, reserva = null) => {
        setModalType(type);
        setReservaInfo(reserva);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);

        if (modalType === 'checkin') {
            const loc = reservaInfo?.localizador || '';
            if (loc) {
                router.visit(`/reserva/${encodeURIComponent(loc)}`);
            }
        } else if (modalType === 'checkout') {
            router.visit('/');
        } else if (modalType === 'success') {
            // Para escaneos sin acción específica, ir al detalle de la reserva
            const loc = reservaInfo?.localizador || '';
            if (loc) {
                router.visit(route('reserva.show', { reserva: loc }));
            }
        }
    };

    return {
        showModal,
        modalType,
        reservaInfo,
        openModal,
        closeModal,
    };
}
