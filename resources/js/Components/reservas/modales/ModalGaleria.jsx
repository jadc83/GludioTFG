import { XMarkIcon } from '@heroicons/react/24/outline';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

export default function ModalGaleria({
    titulo,
    fotos = [],
    abierto = false,
    onCerrar = () => {},
}) {
    if (!abierto) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-6">
                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                        Galería -{' '}
                        <span className="text-[#7a0202]">{titulo}</span>
                    </h2>
                    <button
                        onClick={onCerrar}
                        className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                    >
                        <XMarkIcon className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                {/* Carousel */}
                <div className="flex flex-1 items-center justify-center overflow-hidden bg-gray-50">
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
                            className="h-full w-full"
                        >
                            {fotos.map((foto, idx) => (
                                <SplideSlide key={idx} className="h-96">
                                    <img
                                        src={foto}
                                        alt={`${titulo} - Foto ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </SplideSlide>
                            ))}
                        </Splide>
                    ) : (
                        <div className="text-center text-gray-500">
                            <p className="font-semibold">
                                No hay fotos disponibles
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-gray-200 bg-gray-50 p-6">
                    <button
                        onClick={onCerrar}
                        className="rounded-lg bg-[#7a0202] px-6 py-2 font-bold text-white transition-colors hover:bg-black"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
