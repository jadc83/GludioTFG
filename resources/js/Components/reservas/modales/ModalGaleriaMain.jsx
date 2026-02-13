import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { useEffect } from 'react';

export default function ModalGaleriaMain({ mainRef, thumbsRef, fotos = [], titulo = '' }) {
    useEffect(() => {
        if (mainRef?.current && thumbsRef?.current && fotos.length > 0) {
            mainRef.current.sync(thumbsRef.current.splide);
        }
    }, [mainRef, thumbsRef, fotos]);

    return (
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
                                    onClick={() => thumbsRef?.current?.splide?.go(idx)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            thumbsRef?.current?.splide?.go(idx);
                                        }
                                    }}
                                >
                                    <img src={foto} className="h-full w-full object-cover" alt={`${titulo} - ${idx}`} />
                                </div>
                            </SplideSlide>
                        ))}
                    </Splide>
                </div>
            </div>
        </div>
    );
}
