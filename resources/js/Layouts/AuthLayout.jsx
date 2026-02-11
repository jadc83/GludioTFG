import ApplicationLogo from '@/Components/UI/ApplicationLogo';
import CookieBanner from '@/Components/UI/CookieBanner';
import {
    BoltIcon,
    CheckCircleIcon,
    ShieldCheckIcon,
    StarIcon,
} from '@heroicons/react/24/solid';
import { Link } from '@inertiajs/react';
import '@splidejs/react-splide/css';

export default function AuthLayout({ children }) {
    const beneficios = [
        {
            icono: CheckCircleIcon,
            titulo: 'Reservas Instantáneas',
            descripcion: 'Acceso inmediato a disponibilidad en tiempo real',
        },
        {
            icono: StarIcon,
            titulo: 'Gestión Completa',
            descripcion: 'Panel de control para tus reservas',
        },
        {
            icono: ShieldCheckIcon,
            titulo: 'Seguridad Garantizada',
            descripcion: 'Tus datos protegidos con encriptación',
        },
        {
            icono: BoltIcon,
            titulo: 'Soporte 24/7',
            descripcion: 'Ayuda disponible cuando la necesites',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#E2E0DC] via-[#f5f3f0] to-[#E2E0DC]">
            <div className="filter fixed left-0 top-0 -z-10 h-96 w-96 rounded-full bg-[#7a0202] opacity-5 mix-blend-multiply blur-3xl"></div>
            <div className="filter fixed -bottom-8 right-0 -z-10 h-80 w-80 rounded-full bg-[#920303] opacity-5 mix-blend-multiply blur-3xl"></div>

            <div className="grid min-h-screen lg:grid-cols-2">
                <aside
                    aria-hidden="true"
                    className="relative hidden flex-col items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-12 lg:flex"
                    style={{
                        backgroundImage:
                            'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=1600&fit=crop)',
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/50 to-black/40"></div>
                    <div className="relative z-10 mx-auto w-full max-w-xs">
                        <div className="mb-6">
                            <Link href="/">
                                <ApplicationLogo className="h-12 w-12 fill-current text-white" />
                            </Link>
                            <h1 className="mt-2 text-3xl font-bold text-white">
                                Hotel Gludio
                            </h1>
                            <p className="mt-0.5 text-xs text-gray-200">
                                Donde todo comienza... tu aventura
                            </p>
                        </div>

                        <div className="mb-6 space-y-4">
                            {beneficios.map((benefit, idx) => {
                                const Icon = benefit.icono;
                                return (
                                    <div key={idx} className="flex gap-2.5">
                                        <div className="flex-shrink-0 pt-0.5">
                                            <Icon className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-semibold text-white">
                                                {benefit.titulo}
                                            </h3>
                                            <p className="mt-0.5 text-xs text-gray-200">
                                                {benefit.descripcion}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                <main
                    role="main"
                    aria-label="Contenido principal"
                    className="flex flex-col justify-center bg-[#E2E0DC] px-4 py-8 sm:px-6 lg:py-0"
                >
                    <div className="mb-6 text-center lg:hidden">
                        <Link href="/">
                            <ApplicationLogo className="mx-auto h-12 w-12 fill-current text-[#7a0202]" />
                        </Link>
                        <h1 className="mt-2 text-2xl font-bold text-[#7a0202]">
                            Hotel Gludio
                        </h1>
                    </div>

                    <div className="mx-auto w-full max-w-xs">{children}</div>

                    <p className="mt-4 text-center text-xs text-gray-600">
                        Con protección de privacidad y seguridad de datos
                    </p>
                </main>
            </div>

            <CookieBanner />
        </div>
    );
}
