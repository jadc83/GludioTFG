import Campo from '@/Components/reservas/utilidades/Campo';
import { limpiarFormulario } from '@/hooks/useFormHelpers';
import { Transition } from '@headlessui/react';
import {
    CheckBadgeIcon,
    EnvelopeIcon,
    PhoneIcon,
} from '@heroicons/react/24/outline';
import { useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({ className = '' }) {
    const user = usePage().props.auth.user;

    const {
        data,
        setData,
        patch,
        processing,
        recentlySuccessful,
        reset,
        clearErrors,
    } = useForm({
        name: user.name || '',
        email: user.email || '',
        tipo_documento: user.tipo_documento || '',
        numero_documento: user.numero_documento || '',
        nacionalidad: user.nacionalidad || '',
        direccion: user.direccion || '',
        ciudad: user.ciudad || '',
        codigo_postal: user.codigo_postal || '',
        telefono: user.telefono || '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => limpiarFormulario(reset, clearErrors),
        });
    };

    return (
        <section className={`mx-auto max-w-4xl ${className}`}>
            {/* --- CONTENEDOR ÚNICO DEL FORMULARIO --- */}
            <div className="overflow-hidden rounded-3xl bg-white">
                <form onSubmit={submit} className="space-y-8 p-6 md:p-8">
                    <header className="mb-2 pb-4">
                        <h2 className="text-lg font-extrabold text-gray-800">
                            Editar información
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Actualiza tus datos personales. Estos datos son usados en reservas y comunicaciones.
                        </p>
                    </header>
                    {/* SECCIÓN 1: IDENTIDAD */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label
                                    htmlFor="name"
                                    className="ml-1 text-[10px] font-black uppercase text-gray-400"
                                >
                                    Nombre Completo
                                </label>
                                <Campo
                                    id="name"
                                    clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10 transition"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label
                                    htmlFor="email"
                                    className="ml-1 text-[10px] font-black uppercase text-gray-400"
                                >
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <EnvelopeIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Campo
                                        id="email"
                                        type="email"
                                        clase="w-full bg-gray-50 border-none rounded-xl pl-10 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10 transition"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: DOCUMENTACIÓN */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="space-y-1">
                                <label
                                    htmlFor="tipo_documento"
                                    className="ml-1 text-[10px] font-black uppercase text-gray-400"
                                >
                                    Tipo Doc.
                                </label>
                                <Campo
                                    id="tipo_documento"
                                    as="select"
                                    clase="w-full appearance-none rounded-xl border-none bg-gray-50 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                                    value={data.tipo_documento}
                                    onChange={(e) =>
                                        setData(
                                            'tipo_documento',
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="dni">DNI</option>
                                    <option value="pasaporte">Pasaporte</option>
                                    <option value="tie">TIE</option>
                                </Campo>
                            </div>

                            <div className="space-y-1">
                                <label
                                    htmlFor="numero_documento"
                                    className="ml-1 text-[10px] font-black uppercase text-gray-400"
                                >
                                    Nº Identificación
                                </label>
                                <Campo
                                    id="numero_documento"
                                    clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                                    value={data.numero_documento}
                                    onChange={(e) =>
                                        setData(
                                            'numero_documento',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div className="space-y-1">
                                <label
                                    htmlFor="telefono"
                                    className="ml-1 text-[10px] font-black uppercase text-gray-400"
                                >
                                    Teléfono
                                </label>
                                <div className="relative">
                                    <PhoneIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Campo
                                        id="telefono"
                                        type="tel"
                                        clase="w-full bg-gray-50 border-none rounded-xl pl-10 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                                        value={data.telefono}
                                        onChange={(e) =>
                                            setData('telefono', e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: LOCALIZACIÓN */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                            <div className="space-y-1 md:col-span-8">
                                <label
                                    htmlFor="direccion"
                                    className="ml-1 text-[10px] font-black uppercase text-gray-400"
                                >
                                    Dirección Postal
                                </label>
                                <Campo
                                    id="direccion"
                                    clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                                    value={data.direccion}
                                    onChange={(e) =>
                                        setData('direccion', e.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-1 md:col-span-4">
                                <label
                                    htmlFor="nacionalidad"
                                    className="ml-1 text-[10px] font-black uppercase text-gray-400"
                                >
                                    Nacionalidad
                                </label>
                                <Campo
                                    id="nacionalidad"
                                    clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                                    value={data.nacionalidad}
                                    onChange={(e) =>
                                        setData('nacionalidad', e.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-1 md:col-span-8">
                                <label
                                    htmlFor="ciudad"
                                    className="ml-1 text-[10px] font-black uppercase text-gray-400"
                                >
                                    Ciudad
                                </label>
                                <Campo
                                    id="ciudad"
                                    clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                                    value={data.ciudad}
                                    onChange={(e) =>
                                        setData('ciudad', e.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-1 md:col-span-4">
                                <label
                                    htmlFor="codigo_postal"
                                    className="ml-1 text-[10px] font-black uppercase text-gray-400"
                                >
                                    Cód. Postal
                                </label>
                                <Campo
                                    id="codigo_postal"
                                    clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                                    value={data.codigo_postal}
                                    onChange={(e) =>
                                        setData('codigo_postal', e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* VERIFICACIÓN (Alerta sutil) */}

                    {/* --- ACCIONES --- */}
                    <div className="perfil-form-actions flex items-center gap-4 pt-6">
                        <button
                            disabled={processing}
                            className="rounded-2xl bg-[#920303] px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow hover:bg-[#7a0202] disabled:opacity-50 transition"
                        >
                            {processing ? 'Procesando...' : 'Actualizar Perfil'}
                        </button>

                        <Transition
                            show={recentlySuccessful}
                            enter="transition ease-in-out duration-500"
                            enterFrom="opacity-0 translate-x-2"
                            enterTo="opacity-100 translate-x-0"
                            leave="transition ease-in-out duration-500"
                            leaveTo="opacity-0"
                        >
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckBadgeIcon className="h-5 w-5" />
                                <p className="text-[10px] font-black uppercase tracking-widest">
                                    Sincronizado
                                </p>
                            </div>
                        </Transition>
                    </div>
                </form>
            </div>
        </section>
    );
}
