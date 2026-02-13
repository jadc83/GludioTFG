import Modal from '@/Components/Modal';
import PropTypes from 'prop-types';
import React from 'react';

export default function ClienteExistenteModal({ show, cliente, onClose, onRetry, onEdit }) {
    return (
        <Modal show={Boolean(show)} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <h3 className="mb-2 text-lg font-black text-gray-900">Cliente existente detectado</h3>
                <p className="mb-4 text-[12px] text-gray-600">Parece que el DNI ya está registrado. ¿Quieres usar este cliente para la reserva?</p>
                {cliente && (
                    <div className="mb-4 rounded bg-gray-50 p-4">
                        <p className="font-bold">{cliente.name}</p>
                        <p className="text-sm text-gray-600">{cliente.email}</p>
                        <p className="text-sm text-gray-600">DNI: {cliente.numero_documento}</p>
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="rounded border border-gray-200 bg-white px-4 py-2" aria-label="Cerrar diálogo - cancelar">Cancelar</button>
                    <button onClick={onEdit} className="rounded bg-yellow-500 px-4 py-2 font-bold text-white" aria-label="Editar documento del cliente">Editar documento</button>
                    <button onClick={onRetry} className="rounded bg-[#7a0202] px-4 py-2 font-bold text-white" aria-label="Usar cliente existente para reserva">Usar este cliente</button>
                </div>
            </div>
        </Modal>
    );
}

ClienteExistenteModal.propTypes = {
    show: PropTypes.bool,
    cliente: PropTypes.object,
    onClose: PropTypes.func,
    onRetry: PropTypes.func,
    onEdit: PropTypes.func,
};
