import { useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function Dashboard() {
    useEffect(() => {
        const timer = setTimeout(() => {
            // router.visit(route('home'));
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AuthenticatedLayout header={null}>
            <Head title="Bienvenido a su Estancia" />

            <div className="relative min-h-[calc(100vh-65px)] flex items-center justify-center bg-[#fdfaf6] overflow-hidden">

                {/* Bloque de Color Superior (Rojo Vino) */}
                    <div className="absolute top-0 inset-x-0 h-[40vh] bg-[#7a0202] shadow-2xl">
                        <img
                            src={`/fondo3.jpg?v=${Date.now()}`}
                            className="w-full h-full object-cover opacity-20 mix-blend-luminosity animate-subtle-zoom"
                            alt="Background"
                        />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#7a0202]/50 to-[#7a0202]" />
                </div>

                {/* Contenido Central */}
                <div className="relative z-20 max-w-4xl w-full px-8 flex flex-col items-center">

                    {/* Tarjeta Principal de Bienvenida */}
                    <div className="bg-white/90 backdrop-blur-md p-12 md:p-20 rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(122,2,2,0.3)] text-center relative overflow-hidden border border-white">

                        {/* Decoración sutil */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#7a0202] rounded-b-full" />

                        <span className="text-[#7a0202] text-xs tracking-[0.6em] uppercase font-bold block mb-6 animate-fade-in">
                            Experiencia Exclusiva
                        </span>

                        <h1 className="text-4xl md:text-6xl font-serif text-gray-900 leading-tight mb-6 animate-fade-in-up">
                            Donde cada detalle <br/>
                            <span className="text-[#7a0202] italic underline decoration-1 underline-offset-8">cuenta una historia.</span>
                        </h1>

                        <p className="text-gray-500 text-lg font-light max-w-lg mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            Estamos preparando su llegada para que su única preocupación sea disfrutar del descanso que merece.
                        </p>

                        {/* Indicador de carga orgánico */}
                        <div className="mt-12 flex flex-col items-center gap-4">
                            <div className="flex gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#7a0202] animate-bounce" style={{ animationDelay: '0s' }}></span>
                                <span className="w-2 h-2 rounded-full bg-[#7a0202] animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 rounded-full bg-[#7a0202] animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        try {
                                            router.visit(route('home'));
                                        } catch (e) {
                                            router.visit('/');
                                        }
                                    }}
                                    className="inline-flex items-center gap-3 bg-[#7a0202] hover:bg-[#5f0101] text-white px-5 py-2 rounded-full font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-[#7a0202]/40 transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path d="M10.707 1.707a1 1 0 00-1.414 0l-7 7A1 1 0 003 10h1v6a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6h1a1 1 0 00.707-1.707l-7-7z" />
                                    </svg>
                                    Ir al inicio
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Fotos Flotantes Tipo Mosaico */}
                    <div className="absolute -left-12 top-1/4 w-48 h-64 hidden xl:block rounded-2xl overflow-hidden shadow-2xl -rotate-6 animate-float border-8 border-white">
                        <img
                            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=500"
                            className="w-full h-full object-cover"
                            alt="Habitación"
                        />
                    </div>

                    <div className="absolute -right-12 bottom-1/4 w-56 h-48 hidden xl:block rounded-2xl overflow-hidden shadow-2xl rotate-6 animate-float-delayed border-8 border-white">
                        <img
                            src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=500"
                            className="w-full h-full object-cover"
                            alt="Piscina"
                        />
                    </div>
                </div>

                {/* Adorno de esquina: Logo sutil */}
                <div className="absolute bottom-10 left-10 flex items-center gap-4 opacity-30">
                    <div className="w-10 h-[1px] bg-[#7a0202]" />
                    <span className="text-[#7a0202] font-serif tracking-widest text-sm italic">Hotel Gludio</span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes subtle-zoom {
                    from { transform: scale(1); }
                    to { transform: scale(1.15); }
                }
                @keyframes float {
                    0% { transform: translateY(0px) rotate(-6deg); }
                    50% { transform: translateY(-20px) rotate(-8deg); }
                    100% { transform: translateY(0px) rotate(-6deg); }
                }
                @keyframes float-delayed {
                    0% { transform: translateY(0px) rotate(6deg); }
                    50% { transform: translateY(20px) rotate(8deg); }
                    100% { transform: translateY(0px) rotate(6deg); }
                }
                .animate-fade-in-up { animation: fade-in-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .animate-fade-in { animation: fade-in 2s forwards; opacity: 0; }
                .animate-subtle-zoom { animation: subtle-zoom 20s infinite alternate ease-in-out; }
                .animate-float { animation: float 6s infinite ease-in-out; }
                .animate-float-delayed { animation: float-delayed 7s infinite ease-in-out; }
            `}} />
        </AuthenticatedLayout>
    );
}
