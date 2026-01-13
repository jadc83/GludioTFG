import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { CheckCircleIcon, StarIcon, ShieldCheckIcon, BoltIcon } from '@heroicons/react/24/solid';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

export default function AuthLayout({ children }) {
    const beneficios = [
        {
            icono: CheckCircleIcon,
            titulo: 'Reservas Instantáneas',
            descripcion: 'Acceso inmediato a disponibilidad en tiempo real'
        },
        {
            icono: StarIcon,
            titulo: 'Gestión Completa',
            descripcion: 'Panel de control para tus reservas'
        },
        {
            icono: ShieldCheckIcon,
            titulo: 'Seguridad Garantizada',
            descripcion: 'Tus datos protegidos con encriptación'
        },
        {
            icono: BoltIcon,
            titulo: 'Soporte 24/7',
            descripcion: 'Ayuda disponible cuando la necesites'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#E2E0DC] via-[#f5f3f0] to-[#E2E0DC]">
            <div className="fixed top-0 left-0 w-96 h-96 bg-[#7a0202] rounded-full mix-blend-multiply filter blur-3xl opacity-5 -z-10"></div>
            <div className="fixed -bottom-8 right-0 w-80 h-80 bg-[#920303] rounded-full mix-blend-multiply filter blur-3xl opacity-5 -z-10"></div>

            <div className="grid lg:grid-cols-2 min-h-screen">
                <div
                    className="hidden lg:flex flex-col justify-center items-center px-4 py-12 bg-cover bg-center bg-no-repeat relative"
                    style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=1600&fit=crop)'}}>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/50 to-black/40"></div>
                    <div className="relative z-10 w-full max-w-xs mx-auto">
                        <div className="mb-6">
                            <Link href="/">
                                <ApplicationLogo className="h-12 w-12 fill-current text-white" />
                            </Link>
                            <h1 className="mt-2 text-3xl font-bold text-white">Hotel Gludio</h1>
                            <p className="text-gray-200 text-xs mt-0.5">Donde todo comienza... tu aventura</p>
                        </div>

                        <div className="space-y-4 mb-6">
                            {beneficios.map((benefit, idx) => {
                                const Icon = benefit.icono;
                                return (
                                    <div key={idx} className="flex gap-2.5">
                                        <div className="flex-shrink-0 pt-0.5">
                                            <Icon className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white text-xs">{benefit.titulo}</h3>
                                            <p className="text-xs text-gray-200 mt-0.5">{benefit.descripcion}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center px-4 sm:px-6 py-8 lg:py-0 bg-[#E2E0DC]">
                    <div className="lg:hidden text-center mb-6">
                        <Link href="/">
                            <ApplicationLogo className="h-12 w-12 fill-current text-[#7a0202] mx-auto" />
                        </Link>
                        <h1 className="mt-2 text-2xl font-bold text-[#7a0202]">Hotel Gludio</h1>
                    </div>

                    <div className="w-full mx-auto max-w-xs">
                        {children}
                    </div>

                    <p className="text-center text-gray-600 text-xs mt-4">
                        Con protección de privacidad y seguridad de datos
                    </p>
                </div>
            </div>
        </div>
    );
}
