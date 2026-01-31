import { useState } from 'react';
import { router } from '@inertiajs/react';

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
        }
    };

    return {
        showModal,
        modalType,
        reservaInfo,
        openModal,
        closeModal
    };
}