import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function SobreNosotros() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white to-gray-50 font-sans text-gray-900">
            <div className="mx-auto max-w-6xl p-8">
                <header className="mb-8 flex items-center justify-between">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-gray-700/80 transition-colors hover:text-gray-900"
                    >
                        <ArrowLeftIcon className="h-4 w-4" /> Volver
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1">
                            <svg
                                className="h-4 w-4 text-emerald-500"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                            >
                                <path
                                    d="M5 13l4 4L19 7"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span className="text-xs font-black uppercase tracking-[0.08em] text-gray-600">
                                Sobre nosotros
                            </span>
                        </div>
                    </div>
                </header>

                <main className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm lg:col-span-7">
                        <h1 className="mb-4 text-4xl font-black">
                            Sobre nosotros
                        </h1>
                        <p className="mb-6 leading-relaxed text-gray-700">
                            Bienvenido a Hotel Gludio — un refugio boutique
                            donde la elegancia clásica se encuentra con la
                            hospitalidad moderna. Nuestro equipo se dedica a
                            ofrecer experiencias memorables, desde estancias
                            relajantes hasta eventos cuidadosamente gestionados.
                        </p>

                        <h2 className="mb-2 mt-6 text-xl font-bold">
                            Qué ofrecemos
                        </h2>
                        <ul className="grid grid-cols-1 gap-3 text-gray-700 sm:grid-cols-2">
                            <li>Desayuno buffet incluido</li>
                            <li>Wi‑Fi gratuito y alta velocidad</li>
                            <li>Recepción 24h y conserjería</li>
                            <li>Spa y gimnasio</li>
                            <li>Servicio de habitaciones</li>
                            <li>Salas para eventos y reuniones</li>
                        </ul>

                        <h2 className="mb-2 mt-6 text-xl font-bold">
                            Políticas rápidas
                        </h2>
                        <ul className="list-inside list-disc text-gray-700">
                            <li>
                                Check‑in desde las 15:00 — Check‑out hasta las
                                12:00.
                            </li>
                            <li>
                                Cancelación gratuita hasta 48 horas antes de la
                                llegada.
                            </li>
                            <li>
                                Se aceptan mascotas en habitaciones indicadas
                                (consulta disponibilidad).
                            </li>
                        </ul>
                    </section>

                    <aside className="rounded-2xl bg-gradient-to-br from-[#8b0000] to-[#3b0000] p-8 text-white shadow-2xl lg:col-span-5">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-extrabold">
                                Reserva y atención
                            </h3>
                            <p className="text-sm opacity-90">
                                Para preguntas sobre reservas, servicios o
                                eventos ponte en contacto con nuestro equipo de
                                recepción.
                            </p>

                            <div className="mt-4 rounded bg-white/10 p-4">
                                <div className="text-xs uppercase tracking-widest opacity-80">
                                    Contacto
                                </div>
                                <div className="mt-2 font-bold">
                                    reservas@hotelgludio.example
                                </div>
                                <div className="text-sm opacity-90">
                                    +34 912 345 678
                                </div>
                            </div>

                            <div className="mt-6">
                                <h4 className="text-sm uppercase tracking-widest opacity-80">
                                    Servicios destacados
                                </h4>
                                <ul className="mt-3 space-y-2 text-sm opacity-95">
                                    <li>Servicio privado de traslado</li>
                                    <li>Experiencias gastronómicas</li>
                                    <li>Paquetes románticos y de empresa</li>
                                </ul>
                            </div>

                            <div className="mt-6">
                                <a
                                    href="/reservas"
                                    className="inline-block w-full rounded bg-white py-3 text-center font-bold text-[#8b0000]"
                                >
                                    Reservar ahora
                                </a>
                            </div>
                        </div>
                    </aside>
                </main>

                <footer className="mt-12 text-center text-sm text-gray-500">
                    <div>
                        © {new Date().getFullYear()} Hotel Gludio — Todos los
                        derechos reservados.
                    </div>
                </footer>
            </div>
        </div>
    );
}
