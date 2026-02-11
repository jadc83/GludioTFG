import { useEffect, useRef } from 'react';
import {
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    UsersIcon,
    ArrowsPointingOutIcon,
    MoonIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { t } from '@/i18n';

export default function ModalGaleria({
    titulo,
    fotos = [
        "https://upload.wikimedia.org/wikipedia/commons/5/51/InterContinental_Hong_Kong_Superior_Room.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/d/d4/Hotel_room_at_the_Hotel_du_Collectionneur_-_Paris.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/e/e5/Park_Hyatt_Tokyo_Deluxe_Twin_Room.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/0/03/Grand_Hyatt_Hong_Kong_Grand_Room_Bed.jpg"
    ],
    abierto = false,
    onCerrar = () => { },
    descripcion = "Disfrute de una estancia inigualable donde la sofisticación se encuentra con el descanso. Nuestras estancias premium en Hotel Gludio ofrecen una atmósfera de paz diseñada meticulosamente para los huéspedes más exigentes.",
    precio = "250",
    m2 = "52",
    capacidad = "2",
    camas = "1 King Size Premium",
    amenidades = ["Servicio de Habitaciones 24h", "Caja fuerte para portátil", "Sistema de sonido Premium", "Climatización inteligente"]
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-fade-in">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-2xl"
                onClick={onCerrar}
            />

            <div className="relative w-full max-w-6xl z-10 animate-scale-up overflow-hidden bg-white rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row max-h-[90vh]">
                <button
                    onClick={onCerrar}
                    className="absolute top-6 right-6 z-[110] p-2 bg-white/90 backdrop-blur-md rounded-full text-black hover:text-[#7a0202] transition-all shadow-md"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>

                <div className="w-full lg:w-3/5 bg-[#f9f9f9] p-6 flex flex-col justify-center border-r border-gray-100">
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
                            className="rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <SplideTrack>
                                {fotos.map((foto, idx) => (
                                    <SplideSlide key={idx}>
                                        <div className="aspect-[4/3] lg:aspect-[16/10] w-full">
                                            <img src={foto} alt={`${titulo} - ${idx}`} className="h-full w-full object-cover" />
                                        </div>
                                    </SplideSlide>
                                ))}
                            </SplideTrack>

                            <div className="splide__arrows">
                                <button className="splide__arrow splide__arrow--prev !bg-white !opacity-100 !w-12 !h-12 shadow-xl !left-4">
                                    <ChevronLeftIcon className="w-6 h-6 text-[#7a0202]" />
                                </button>
                                <button className="splide__arrow splide__arrow--next !bg-white !opacity-100 !w-12 !h-12 shadow-xl !right-4">
                                    <ChevronRightIcon className="w-6 h-6 text-[#7a0202]" />
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
                                    <SplideSlide key={idx} className="opacity-40 [&.is-active]:opacity-100 [&.is-active]:ring-2 ring-[#7a0202] rounded-lg overflow-hidden transition-all cursor-pointer">
                                        <img src={foto} className="h-full w-full object-cover" />
                                    </SplideSlide>
                                ))}
                            </Splide>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-2/5 p-8 md:p-12 flex flex-col bg-white overflow-y-auto">

                    <div className="mb-8">
                        <span className="text-[#7a0202] font-bold text-xs uppercase tracking-[0.4em] block mb-3">{t('modal.gallery.room_badge')}</span>
                        <h2 className="text-4xl font-serif text-black leading-tight">
                            {titulo}
                        </h2>
                        <div className="h-1 w-20 bg-[#7a0202] mt-6" />
                    </div>

                    <div className="grid grid-cols-3 gap-6 py-8 border-y border-gray-100 my-4 text-black text-center">
                        <div className="space-y-2">
                            <ArrowsPointingOutIcon className="h-6 w-6 text-[#7a0202] mx-auto" />
                            <p className="text-[10px] uppercase font-black tracking-tighter">{m2} {t('modal.gallery.meters')}</p>
                        </div>
                        <div className="space-y-2">
                            <UsersIcon className="h-6 w-6 text-[#7a0202] mx-auto" />
                            <p className="text-[10px] uppercase font-black tracking-tighter">{capacidad} {t('modal.gallery.guests')}</p>
                        </div>
                        <div className="space-y-2">
                            <MoonIcon className="h-6 w-6 text-[#7a0202] mx-auto" />
                            <p className="text-[10px] uppercase font-black tracking-tighter">{camas}</p>
                        </div>
                    </div>

                    <div className="flex-1 mt-6 space-y-10">
                        <div>
                            <h3 className="text-black font-bold uppercase text-[10px] tracking-widest mb-4 opacity-40">{t('modal.gallery.description_title')}</h3>
                            <p className="text-gray-700 leading-relaxed font-light text-lg">
                                {descripcion}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-black font-bold uppercase text-[10px] tracking-widest mb-4 opacity-40">{t('modal.gallery.amenities_title')}</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {amenidades.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-black font-medium">
                                        <CheckCircleIcon className="h-5 w-5 text-[#7a0202]" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-100 flex items-end justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em]">{t('modal.gallery.price_per_night')}</span>
                            <div className="text-black">
                                <span className="text-4xl font-serif font-bold">{precio}€</span>
                            </div>
                        </div>

                        <button
                            onClick={onCerrar}
                            className="bg-[#7a0202] text-white px-10 py-5 rounded-2xl font-bold hover:bg-black transition-all shadow-[0_10px_30px_rgba(122,2,2,0.3)] active:scale-95 uppercase tracking-widest text-xs"
                        >
                            {t('modal.gallery.back')}
                        </button>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
				@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
				@keyframes scale-up {
					from { opacity: 0; transform: scale(0.97) translateY(20px); }
					to { opacity: 1; transform: scale(1) translateY(0); }
				}
				.animate-fade-in { animation: fade-in 0.4s ease-out; }
				.animate-scale-up { animation: scale-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
				.splide__slide.is-active { border: none !important; }
			`}} />
        </div>
    );
}
