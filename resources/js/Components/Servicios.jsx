import { Splide, SplideSlide } from "@splidejs/react-splide"
import "@splidejs/react-splide/css"

export default function Servicios() {
  return (
    <section className="py-12 md:py-16 overflow-hidden bg-gris">
      <div className="container mx-auto px-6 lg:px-12">

        <div className="max-w-3xl mb-8 md:mb-12">
          <span className="inline-block text-sm tracking-widest uppercase text-base-content/60 mb-4">La experiencia</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl text-base-content mb-6 font-bold leading-tight">
            Una experiencia casi del más allá
          </h2>
          <p className="text-base-content/70 text-lg leading-relaxed">
            En Hotel Gludio, cada momento está cuidadosamente orquestado para crear recuerdos que perduran. Desde nuestro spa de clase mundial hasta experiencias gastronómicas excepcionales.
          </p>
        </div>

        <div className="w-full">
          <Splide options={{
              type: "loop",
              perPage: 4,
              perMove: 1,
              gap: "1rem",
              arrows: true,
              pagination: false,
              autoplay: true,
              interval: 3500,
              pauseOnHover: true,
              breakpoints: { 1024: { perPage: 3 }, 768: { perPage: 2 }, 480: { perPage: 1 } },
            }} className="pt-2 pb-8">

            {[ { src: "/spa.png", alt: "Spa & Wellness", descripcion: "Masajes que te harán olvidar hasta tu nombre" },
               { src: "/spa2.jpg", alt: "Spa & Wellness", descripcion: "Masajes que te harán olvidar hasta tu nombre" },
               { src: "/cena.jpg", alt: "Gastronomía", descripcion: "Platos que tu madre nunca supo hacer" },
               { src: "/piscina.png", alt: "Piscina Infinita", descripcion: "Donde el horizonte y el agua se confunden" },
               { src: "/piscina2.jpg", alt: "Piscina Infinita", descripcion: "Donde el horizonte y el agua se confunden" },
               { src: "/bar.jpg", alt: "Cocktail Bar", descripcion: "Cócteles que justifican malas decisiones" },
               { src: "/tejado.jpg", alt: "Cocktail Bar", descripcion: "Cócteles que justifican malas decisiones" },
            ].map((imagen, index) => (
              <SplideSlide key={index}>
                <div className="relative h-[400px] md:h-[480px] rounded-2xl overflow-hidden shadow-lg transition-transform duration-500 hover:scale-[1.02] hover:shadow-2xl group cursor-pointer">
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={imagen.src} alt={imagen.alt}/>

                  <div className="absolute inset-0 bg-gradient-to-t from-neutral/90 via-neutral/40 to-transparent transition-opacity duration-500 group-hover:opacity-100 opacity-80" />

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl text-white mb-2 font-bold">{imagen.alt}</h3>
                    <p className="text-white/80 text-sm transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 opacity-0 translate-y-4">
                      {imagen.descripcion}
                    </p>
                    <div className="mt-4 h-0.5 bg-white transition-all duration-500 group-hover:w-full w-0" />
                  </div>
                </div>
              </SplideSlide>
            ))}
          </Splide>
        </div>
      </div>
    </section>
  )
}
