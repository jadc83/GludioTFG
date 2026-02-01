import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

export default function ModalGaleria({ titulo, fotos = [], abierto = false, onCerrar = () => {} }) {
    if (!abierto) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                        Galería - <span className="text-[#7a0202]">{titulo}</span>
                    </h2>
                    <button
                        onClick={onCerrar}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                {/* Carousel */}
                <div className="flex-1 overflow-hidden flex items-center justify-center bg-gray-50">
                    {fotos.length > 0 ? (
                        <Splide
                            options={{
                                type: 'fade',
                                autoplay: true,
                                interval: 3000,
                                pauseOnHover: true,
                                resetProgress: false,
                                arrows: true,
                                pagination: true,
                            }}
                            className="w-full h-full"
                        >
                            {fotos.map((foto, idx) => (
                                <SplideSlide key={idx} className="h-96">
                                    <img
                                        src={foto}
                                        alt={`${titulo} - Foto ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </SplideSlide>
                            ))}
                        </Splide>
                    ) : (
                        <div className="text-center text-gray-500">
                            <p className="font-semibold">No hay fotos disponibles</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <button
                        onClick={onCerrar}
                        className="px-6 py-2 bg-[#7a0202] text-white font-bold rounded-lg hover:bg-black transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
