import { t } from '@/i18n';
import {
    ArrowsPointingOutIcon,
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MoonIcon,
    UsersIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { useEffect, useRef } from 'react';

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

    useEffect(() => {
        if (mainRef.current && thumbsRef.current && fotos.length > 0) {
            mainRef.current.sync(thumbsRef.current.splide);
        }
    }, [abierto, fotos]);

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

                <div className="flex w-full flex-col justify-center border-r border-gray-100 bg-[#f9f9f9] p-6 lg:w-3/5">
                    <div className="relative">
                        <Splide
                            hasTrack={false}
                            ref={mainRef}
                            options={{
                                type: 'fade',
                                rewind: true,
                                pagination: false,
                                arrows: true,
                                speed: 1000,
                                autoplay: true,
                                interval: 3000,
                            }}
                            className="overflow-hidden rounded-2xl shadow-2xl"
                        >
                            <SplideTrack>
                                {fotos.map((foto, idx) => (
                                    <SplideSlide key={idx}>
                                        <div className="aspect-[4/3] w-full lg:aspect-[16/10]">
                                            <img
                                                src={foto}
                                                alt={`${titulo} - ${idx}`}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    </SplideSlide>
                                ))}
                            </SplideTrack>

                            <div className="splide__arrows">
                                <button className="splide__arrow splide__arrow--prev !left-4 !h-12 !w-12 !bg-white !opacity-100 shadow-xl">
                                    <ChevronLeftIcon className="h-6 w-6 text-[#7a0202]" />
                                </button>
                                <button className="splide__arrow splide__arrow--next !right-4 !h-12 !w-12 !bg-white !opacity-100 shadow-xl">
                                    <ChevronRightIcon className="h-6 w-6 text-[#7a0202]" />
                                </button>
                            </div>
                        </Splide>

                        <div className="mt-5">
                            <Splide
                                ref={thumbsRef}
                                options={{
                                    fixedWidth: 90,
                                    fixedHeight: 65,
                                    isNavigation: true,
                                    gap: 12,
                                    focus: 'center',
                                    pagination: false,
                                    arrows: false,
                                }}
                            >
                                {fotos.map((foto, idx) => (
                                    <SplideSlide
                                        key={idx}
                                        className="overflow-hidden rounded-lg opacity-40 ring-[#7a0202] transition-all [&.is-active]:opacity-100 [&.is-active]:ring-2"
                                    >
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`Ver imagen ${idx + 1}`}
                                            className="h-full w-full"
                                            onClick={() =>
                                                thumbsRef.current?.splide?.go(
                                                    idx,
                                                )
                                            }
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === 'Enter' ||
                                                    e.key === ' '
                                                ) {
                                                    e.preventDefault();
                                                    thumbsRef.current?.splide?.go(
                                                        idx,
                                                    );
                                                }
                                            }}
                                        >
                                            <img
                                                src={foto}
                                                className="h-full w-full object-cover"
                                                alt={`${titulo} - ${idx}`}
                                            />
                                        </div>
                                    </SplideSlide>
                                ))}
                            </Splide>
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-col overflow-y-auto bg-white p-8 md:p-12 lg:w-2/5">
                    <div className="mb-8">
                        <span className="mb-3 block text-xs font-bold uppercase tracking-[0.4em] text-[#7a0202]">
                            {t('modal.gallery.room_badge')}
                        </span>
                        <h2
                            id="modal-galeria-title"
                            className="font-serif text-4xl leading-tight text-black"
                        >
                            {titulo}
                        </h2>
                        <div className="mt-6 h-1 w-20 bg-[#7a0202]" />
                    </div>

                    <div className="my-4 grid grid-cols-3 gap-6 border-y border-gray-100 py-8 text-center text-black">
                        <div className="space-y-2">
                            <ArrowsPointingOutIcon className="mx-auto h-6 w-6 text-[#7a0202]" />
                            <p className="text-[10px] font-black uppercase tracking-tighter">
                                {m2} {t('modal.gallery.meters')}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <UsersIcon className="mx-auto h-6 w-6 text-[#7a0202]" />
                            <p className="text-[10px] font-black uppercase tracking-tighter">
                                {capacidad} {t('modal.gallery.guests')}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <MoonIcon className="mx-auto h-6 w-6 text-[#7a0202]" />
                            <p className="text-[10px] font-black uppercase tracking-tighter">
                                {camas}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex-1 space-y-10">
                        <div>
                            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-black opacity-40">
                                {t('modal.gallery.description_title')}
                            </h3>
                            <p className="text-lg font-light leading-relaxed text-gray-700">
                                {descripcion}
                            </p>
                        </div>

                        <div>
                            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-black opacity-40">
                                {t('modal.gallery.amenities_title')}
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {amenidades.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 text-sm font-medium text-black"
                                    >
                                        <CheckCircleIcon className="h-5 w-5 text-[#7a0202]" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex items-end justify-between border-t border-gray-100 pt-8">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                {t('modal.gallery.price_per_night')}
                            </span>
                            <div className="text-black">
                                <span className="font-serif text-4xl font-bold">
                                    {precio}€
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onCerrar}
                            aria-label="Volver"
                            className="rounded-2xl bg-[#7a0202] px-10 py-5 text-xs font-bold uppercase tracking-widest text-white shadow-[0_10px_30px_rgba(122,2,2,0.3)] transition-all hover:bg-black active:scale-95"
                        >
                            {t('modal.gallery.back')}
                        </button>
                    </div>
                </div>
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
