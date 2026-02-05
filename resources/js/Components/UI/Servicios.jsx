import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

export default function Servicios() {
    return (
        <section className="overflow-hidden bg-gris py-12 md:py-16">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="mb-8 max-w-3xl md:mb-12">
                    <h2 className="mb-6 text-4xl font-bold leading-tight text-black md:text-5xl lg:text-6xl">
                        Una experiencia casi del más allá
                    </h2>
                    <p className="text-lg leading-relaxed text-black">
                        En Hotel Gludio, cada momento está cuidadosamente
                        orquestado para crear recuerdos que perduran. Desde
                        nuestro spa de clase mundial hasta experiencias
                        gastronómicas excepcionales.
                    </p>
                </div>

                <div className="w-full">
                    <Splide
                        options={{
                            type: 'loop',
                            perPage: 4,
                            perMove: 1,
                            gap: '1rem',
                            arrows: true,
                            pagination: false,
                            autoplay: true,
                            interval: 3500,
                            pauseOnHover: true,
                            breakpoints: {
                                1024: { perPage: 3 },
                                768: { perPage: 2 },
                                480: { perPage: 1 },
                            },
                        }}
                        className="pb-8 pt-2"
                    >
                        {[
                            {
                                src: '/spa.png',
                                alt: 'Spa y bienestar',
                                descripcion:
                                    'Masajes que te harán olvidar hasta tu nombre',
                            },
                            {
                                src: '/spa2.jpg',
                                alt: 'Spa y bienestar',
                                descripcion:
                                    'Masajes que te harán olvidar hasta tu nombre',
                            },
                            {
                                src: '/cena.jpg',
                                alt: 'Gastronomía',
                                descripcion:
                                    'Platos que tu madre nunca supo hacer',
                            },
                            {
                                src: '/piscina.png',
                                alt: 'Piscina Infinita',
                                descripcion:
                                    'Donde el horizonte y el agua se confunden',
                            },
                            {
                                src: '/piscina2.jpg',
                                alt: 'Piscina Infinita',
                                descripcion:
                                    'Donde el horizonte y el agua se confunden',
                            },
                            {
                                src: '/bar.jpg',
                                alt: 'Cocktail Bar',
                                descripcion:
                                    'Cócteles que justifican malas decisiones',
                            },
                            {
                                src: '/tejado.jpg',
                                alt: 'Cocktail Bar',
                                descripcion:
                                    'Cócteles que justifican malas decisiones',
                            },
                        ].map((imagen, index) => (
                            <SplideSlide key={index}>
                                <div className="group relative h-[400px] cursor-pointer overflow-hidden rounded-2xl shadow-lg transition-transform duration-500 hover:scale-[1.02] hover:shadow-2xl md:h-[480px]">
                                    <img
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        src={imagen.src}
                                        alt={imagen.alt}
                                    />

                                    <div className="from-neutral/90 via-neutral/40 absolute inset-0 bg-gradient-to-t to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

                                    <div className="absolute bottom-0 left-0 right-0 p-6">
                                        <h3 className="mb-2 text-2xl font-bold text-white">
                                            {imagen.alt}
                                        </h3>
                                        <p className="translate-y-4 text-sm text-white/80 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                                            {imagen.descripcion}
                                        </p>
                                        <div className="mt-4 h-0.5 w-0 bg-white transition-all duration-500 group-hover:w-full" />
                                    </div>
                                </div>
                            </SplideSlide>
                        ))}
                    </Splide>
                </div>
            </div>
        </section>
    );
}
