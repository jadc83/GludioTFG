import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Campo from '@/Components/formulario/Campo';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { limpiarFormulario } from '@/hooks/useFormHelpers';
import {
    PhoneIcon,
    EnvelopeIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful, reset, clearErrors } =
        useForm({
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
        <section className={`max-w-4xl mx-auto ${className}`}>
            {/* --- CONTENEDOR ÚNICO DEL FORMULARIO --- */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <form onSubmit={submit} className="p-8 space-y-10">

                    {/* SECCIÓN 1: IDENTIDAD */}
                    <div className="space-y-6">


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Nombre Completo</label>
                                <Campo
                                    id="name"
                                    clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10 transition"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Correo Electrónico</label>
                                <div className="relative">
                                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Campo
                                        id="email"
                                        type="email"
                                        clase="w-full bg-gray-50 border-none rounded-xl pl-10 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10 transition"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: DOCUMENTACIÓN */}
                    <div className="space-y-6">


                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tipo Doc.</label>
                                <select
                                    className="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10 appearance-none"
                                    value={data.tipo_documento}
                                    onChange={(e) => setData('tipo_documento', e.target.value)}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="dni">DNI</option>
                                    <option value="pasaporte">Pasaporte</option>
                                    <option value="tie">TIE</option>
                                </select>
                                <InputError message={errors.tipo_documento} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Nº Identificación</label>
                                <Campo
                                    id="numero_documento"
                                    clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                                    value={data.numero_documento}
                                    onChange={(e) => setData('numero_documento', e.target.value)}
                                />
                                <InputError message={errors.numero_documento} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Teléfono</label>
                                <div className="relative">
                                    <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Campo
                                        id="telefono"
                                        type="tel"
                                        clase="w-full bg-gray-50 border-none rounded-xl pl-10 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                                        value={data.telefono}
                                        onChange={(e) => setData('telefono', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.telefono} />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: LOCALIZACIÓN */}
                    <div className="space-y-6">


                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-8 space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Dirección Postal</label>
                                <Campo
                                    id="direccion"
                                    clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                                    value={data.direccion}
                                    onChange={(e) => setData('direccion', e.target.value)}
                                />
                                <InputError message={errors.direccion} />
                            </div>

                            <div className="md:col-span-4 space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Nacionalidad</label>
                                <Campo
                                    id="nacionalidad"
                                    clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                                    value={data.nacionalidad}
                                    onChange={(e) => setData('nacionalidad', e.target.value)}
                                />
                                <InputError message={errors.nacionalidad} />
                            </div>

                            <div className="md:col-span-8 space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Ciudad</label>
                                <Campo
                                    id="ciudad"
                                    clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                                    value={data.ciudad}
                                    onChange={(e) => setData('ciudad', e.target.value)}
                                />
                                <InputError message={errors.ciudad} />
                            </div>

                            <div className="md:col-span-4 space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Cód. Postal</label>
                                <Campo
                                    id="codigo_postal"
                                    clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                                    value={data.codigo_postal}
                                    onChange={(e) => setData('codigo_postal', e.target.value)}
                                />
                                <InputError message={errors.codigo_postal} />
                            </div>
                        </div>
                    </div>

                    {/* VERIFICACIÓN (Alerta sutil) */}


                    {/* --- ACCIONES --- */}
                    <div className="pt-6 border-t border-gray-50 flex items-center gap-6">
                        <button
                            disabled={processing}
                            className="px-10 py-4 bg-[#7a0202] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-[#5a0101] shadow-lg shadow-red-100 transition disabled:opacity-50"
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
                                <p className="text-[10px] font-black uppercase tracking-widest">Sincronizado</p>
                            </div>
                        </Transition>
                    </div>
                </form>
            </div>
        </section>
    );
}
