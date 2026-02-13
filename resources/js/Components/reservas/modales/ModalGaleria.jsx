import { XMarkIcon } from '@heroicons/react/24/outline';
import { useRef } from 'react';
import ModalGaleriaMain from './ModalGaleriaMain';
import ModalGaleriaInfo from './ModalGaleriaInfo';

export default function ModalGaleria({
    titulo,
    fotos = [
        'https://upload.wikimedia.org/wikipedia/commons/5/51/InterContinental_Hong_Kong_Superior_Room.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/d/d4/Hotel_room_at_the_Hotel_du_Collectionneur_-_Paris.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/e/e5/Park_Hyatt_Tokyo_Deluxe_Twin_Room.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/0/03/Grand_Hyatt_Hong_Kong_Grand_Room_Bed.jpg',
    ],
    abierto = false,
    onCerrar = () => {},
    descripcion = 'Disfrute de una estancia inigualable donde la sofisticación se encuentra con el descanso. Nuestras estancias premium en Hotel Gludio ofrecen una atmósfera de paz diseñada meticulosamente para los huéspedes más exigentes.',
    precio = '250',
    m2 = '52',
    capacidad = '2',
    camas = '1 King Size Premium',
    amenidades = [
        'Servicio de Habitaciones 24h',
        'Caja fuerte para portátil',
        'Sistema de sonido Premium',
        'Climatización inteligente',
    ],
}) {
    const mainRef = useRef(null);
    const thumbsRef = useRef(null);

    if (!abierto) return null;

    return (
        <div
            className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-galeria-title"
        >
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-2xl"
                onClick={onCerrar}
                aria-hidden="true"
            />

            <div className="animate-scale-up relative z-10 flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_50px_100px_rgba(0,0,0,0.5)] lg:flex-row">
                <button
                    onClick={onCerrar}
                    aria-label="Cerrar galería"
                    className="absolute right-6 top-6 z-[110] rounded-full bg-white/90 p-2 text-black shadow-md backdrop-blur-md transition-all hover:text-[#7a0202]"
                >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>

                <ModalGaleriaMain mainRef={mainRef} thumbsRef={thumbsRef} fotos={fotos} titulo={titulo} />

                <ModalGaleriaInfo
                    titulo={titulo}
                    descripcion={descripcion}
                    precio={precio}
                    m2={m2}
                    capacidad={capacidad}
                    camas={camas}
                    amenidades={amenidades}
                    onCerrar={onCerrar}
                />
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
				@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
				@keyframes scale-up {
					from { opacity: 0; transform: scale(0.97) translateY(20px); }
					to { opacity: 1; transform: scale(1) translateY(0); }
				}
				.animate-fade-in { animation: fade-in 0.4s ease-out; }
				.animate-scale-up { animation: scale-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
				.splide__slide.is-active { border: none !important; }
			`,
                }}
            />
        </div>
    );
}
