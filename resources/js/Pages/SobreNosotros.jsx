import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function SobreNosotros() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 text-gray-900 font-sans overflow-hidden relative">

            <div className="max-w-6xl mx-auto p-8">
                <header className="flex items-center justify-between mb-8">
                    <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-gray-700/80 hover:text-gray-900 transition-colors">
                        <ArrowLeftIcon className="w-4 h-4" /> Volver
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 border border-gray-200 rounded-full">
                            <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span className="text-xs font-black uppercase tracking-[0.08em] text-gray-600">Sobre nosotros</span>
                        </div>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <section className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                        <h1 className="text-4xl font-black mb-4">Sobre nosotros</h1>
                        <p className="text-gray-700 leading-relaxed mb-6">Bienvenido a Hotel Gludio — un refugio boutique donde la elegancia clásica se encuentra con la hospitalidad moderna. Nuestro equipo se dedica a ofrecer experiencias memorables, desde estancias relajantes hasta eventos cuidadosamente gestionados.</p>

                        <h2 className="text-xl font-bold mt-6 mb-2">Qué ofrecemos</h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                            <li>Desayuno buffet incluido</li>
                            <li>Wi‑Fi gratuito y alta velocidad</li>
                            <li>Recepción 24h y conserjería</li>
                            <li>Spa y gimnasio</li>
                            <li>Servicio de habitaciones</li>
                            <li>Salas para eventos y reuniones</li>
                        </ul>

                        <h2 className="text-xl font-bold mt-6 mb-2">Políticas rápidas</h2>
                        <ul className="list-disc list-inside text-gray-700">
                            <li>Check‑in desde las 15:00 — Check‑out hasta las 12:00.</li>
                            <li>Cancelación gratuita hasta 48 horas antes de la llegada.</li>
                            <li>Se aceptan mascotas en habitaciones indicadas (consulta disponibilidad).</li>
                        </ul>
                    </section>

                    <aside className="lg:col-span-5 bg-gradient-to-br from-[#8b0000] to-[#3b0000] text-white rounded-2xl p-8 shadow-2xl">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-extrabold">Reserva y atención</h3>
                            <p className="text-sm opacity-90">Para preguntas sobre reservas, servicios o eventos ponte en contacto con nuestro equipo de recepción.</p>

                            <div className="mt-4 bg-white/10 p-4 rounded">
                                <div className="text-xs uppercase opacity-80 tracking-widest">Contacto</div>
                                <div className="mt-2 font-bold">reservas@hotelgludio.example</div>
                                <div className="text-sm opacity-90">+34 912 345 678</div>
                            </div>

                            <div className="mt-6">
                                <h4 className="text-sm uppercase opacity-80 tracking-widest">Servicios destacados</h4>
                                <ul className="mt-3 text-sm space-y-2 opacity-95">
                                    <li>Servicio privado de traslado</li>
                                    <li>Experiencias gastronómicas</li>
                                    <li>Paquetes románticos y de empresa</li>
                                </ul>
                            </div>

                            <div className="mt-6">
                                <a href="/reservas" className="inline-block w-full text-center bg-white text-[#8b0000] font-bold py-3 rounded">Reservar ahora</a>
                            </div>
                        </div>
                    </aside>
                </main>

                <footer className="mt-12 text-center text-sm text-gray-500">
                    <div>© {new Date().getFullYear()} Hotel Gludio — Todos los derechos reservados.</div>
                </footer>
            </div>
        </div>
    );
}
