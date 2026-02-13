import GuestLayout from '@/Layouts/GuestLayout';
import {
    BuildingOfficeIcon,
    ClockIcon,
    EnvelopeIcon,
    MapPinIcon,
    PhoneIcon,
} from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';

export default function Contacto() {
    return (
        <GuestLayout>
            <Head title="Contacto y Atención al Cliente" />

            <div className="mx-auto max-w-4xl px-6 py-16">
                <div className="mb-12 border-b border-gray-200 pb-8">
                    <h1 className="text-3xl font-bold uppercase tracking-tight text-gray-900">
                        Atención al Cliente
                    </h1>
                    <p className="mt-4 text-sm italic text-gray-500">
                        Canales oficiales de comunicación de Hotel Gludio. Para
                        una atención eficiente, por favor contacte con el
                        departamento correspondiente.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-12 text-gray-700 md:grid-cols-2">
                    <div className="space-y-10">
                        <section>
                            <div className="mb-4 flex items-center gap-2">
                                <PhoneIcon className="h-5 w-5 text-[#7a0202]" />
                                <h2 className="text-lg font-bold uppercase tracking-wide text-gray-900">
                                    Líneas Telefónicas
                                </h2>
                            </div>
                            <div className="space-y-3">
                                <p className="text-sm font-medium">
                                    Recepción (24h):{' '}
                                    <span className="text-gray-900">
                                        +34 999 999 000
                                    </span>
                                </p>
                                <p className="text-sm font-medium">
                                    Central de Reservas:{' '}
                                    <span className="text-gray-900">
                                        +34 999 999 999
                                    </span>
                                </p>
                            </div>
                        </section>

                        <section>
                            <div className="mb-4 flex items-center gap-2">
                                <EnvelopeIcon className="h-5 w-5 text-[#7a0202]" />
                                <h2 className="text-lg font-bold uppercase tracking-wide text-gray-900">
                                    Correo Electrónico
                                </h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-black uppercase text-gray-400">
                                        Información General
                                    </p>
                                    <a
                                        href="mailto:info@hotelgludio.es"
                                        className="text-sm font-bold text-gray-900 underline decoration-[#7a0202]"
                                    >
                                        info@hotelgludio.es
                                    </a>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase text-gray-400">
                                        Gestión de Reservas
                                    </p>
                                    <a
                                        href="mailto:reservas@hotelgludio.es"
                                        className="text-sm font-bold text-gray-900 underline decoration-[#7a0202]"
                                    >
                                        reservas@hotelgludio.es
                                    </a>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-10">
                        <section>
                            <div className="mb-4 flex items-center gap-2">
                                <MapPinIcon className="h-5 w-5 text-[#7a0202]" />
                                <h2 className="text-lg font-bold uppercase tracking-wide text-gray-900">
                                    Ubicación Física
                                </h2>
                            </div>
                            <p className="text-sm leading-relaxed">
                                <strong>Hotel Gludio S.A.</strong>
                                <br />
                                Calle de la Hospitalidad, 123
                                <br />
                                28001 Madrid, España
                            </p>
                        </section>

                        <section>
                            <div className="mb-4 flex items-center gap-2">
                                <BuildingOfficeIcon className="h-5 w-5 text-[#7a0202]" />
                                <h2 className="text-lg font-bold uppercase tracking-wide text-gray-900">
                                    Otros Departamentos
                                </h2>
                            </div>
                            <ul className="space-y-2 border-l-2 border-gray-100 pl-4 text-sm italic">
                                <li>
                                    • Eventos y Grupos:{' '}
                                    <span className="font-semibold">
                                        events@hotelgludio.es
                                    </span>
                                </li>
                                <li>
                                    • Recursos Humanos:{' '}
                                    <span className="font-semibold">
                                        rrhh@hotelgludio.es
                                    </span>
                                </li>
                                <li>
                                    • Proveedores:{' '}
                                    <span className="font-semibold">
                                        compras@hotelgludio.es
                                    </span>
                                </li>
                            </ul>
                        </section>

                        <section className="rounded-xl border border-gray-100 bg-gray-50 p-6">
                            <div className="mb-2 flex items-center gap-2">
                                <ClockIcon className="h-4 w-4 text-gray-400" />
                                <h3 className="text-xs font-black uppercase tracking-tighter text-gray-900">
                                    Horario Administrativo
                                </h3>
                            </div>
                            <p className="text-xs font-medium leading-relaxed text-gray-500">
                                Lunes a Viernes: 09:00 - 19:00
                                <br />
                                Sábados: 10:00 - 14:00
                                <br />
                                Recepción: Operativa 24 horas/365 días.
                            </p>
                        </section>
                    </div>
                </div>

                {/* Pie de Página de Contacto */}
                <div className="mt-20 border-t border-gray-100 pt-8 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                        Hotel Gludio | Establecimiento Turístico Oficial
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
