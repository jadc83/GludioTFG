import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Campo from '@/Components/Campo';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { UserIcon, EnvelopeIcon, LockClosedIcon, PhoneIcon, DocumentIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        tipo_documento: 'dni',
        numero_documento: '',
        nacionalidad: '',
        direccion: '',
        ciudad: '',
        codigo_postal: '',
        telefono: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout>
            <Head title="Registrarse" />

            <div className="px-5 py-8">
                {/* Header */}
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-[#7a0202]">
                        Únete ahora
                    </h2>
                    <p className="text-gray-600 text-xs mt-0.5">
                        Crea tu cuenta en 2 minutos
                    </p>
                </div>

                {/* Benefits Preview */}
                <div className="mb-4 rounded-lg bg-gradient-to-r from-[#7a0202]/5 to-[#920303]/5 p-2.5 border border-[#E2E0DC]">
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <div className="flex items-center gap-1">
                            <span className="text-[#7a0202]">✓</span>
                            <span>Reservas instantáneas</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[#7a0202]">✓</span>
                            <span>100% Gratuito</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[#7a0202]">✓</span>
                            <span>Historial completo</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[#7a0202]">✓</span>
                            <span>Sin compromisos</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-3">
                    {/* Name & Email */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <InputLabel htmlFor="name" value="Nombre" />
                            <div className="relative mt-0.5">
                                <UserIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                                <Campo
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    clase="pl-8 block w-full rounded-lg border border-[#E2E0DC] px-2.5 py-1 text-xs text-gray-900 transition focus:border-[#7a0202] focus:ring-2 focus:ring-[#7a0202] focus:ring-opacity-10"
                                    autoComplete="name"
                                    estaFocalizado={true}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Juan"
                                    required
                                />
                            </div>
                            <InputError message={errors.name} className="mt-0.5 text-xs" />
                        </div>

                        <div>
                            <InputLabel htmlFor="email" value="Email" />
                            <div className="relative mt-0.5">
                                <EnvelopeIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                                <Campo
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    clase="pl-8 block w-full rounded-lg border border-[#E2E0DC] px-2.5 py-1 text-xs text-gray-900 transition focus:border-[#7a0202] focus:ring-2 focus:ring-[#7a0202] focus:ring-opacity-10"
                                    autoComplete="username"
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                            <InputError message={errors.email} className="mt-0.5 text-xs" />
                        </div>
                    </div>

                    {/* Document Type & Number */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <InputLabel htmlFor="tipo_documento" value="Doc" />
                            <select
                                id="tipo_documento"
                                name="tipo_documento"
                                value={data.tipo_documento}
                                className="mt-0.5 block w-full rounded-lg border border-[#E2E0DC] px-2.5 py-1 text-xs text-gray-900 transition focus:border-[#7a0202] focus:ring-2 focus:ring-[#7a0202] focus:ring-opacity-10"
                                onChange={(e) =>
                                    setData('tipo_documento', e.target.value)
                                }
                                required
                            >
                                <option value="dni">DNI</option>
                                <option value="pasaporte">Pasaporte</option>
                                <option value="tie">TIE</option>
                            </select>
                            <InputError message={errors.tipo_documento} className="mt-0.5 text-xs" />
                        </div>

                        <div>
                            <InputLabel htmlFor="numero_documento" value="Nº" />
                            <Campo
                                id="numero_documento"
                                name="numero_documento"
                                value={data.numero_documento}
                                clase="mt-0.5 block w-full rounded-lg border border-[#E2E0DC] px-2.5 py-1 text-xs text-gray-900 font-mono transition focus:border-[#7a0202] focus:ring-2 focus:ring-[#7a0202] focus:ring-opacity-10"
                                onChange={(e) =>
                                    setData('numero_documento', e.target.value)
                                }
                                placeholder="123456"
                                required
                            />
                            <InputError message={errors.numero_documento} className="mt-0.5 text-xs" />
                        </div>
                    </div>

                    {/* Nationality & Phone */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <InputLabel htmlFor="nacionalidad" value="País" />
                            <div className="relative mt-0.5">
                                <GlobeAltIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                                <Campo
                                    id="nacionalidad"
                                    name="nacionalidad"
                                    value={data.nacionalidad}
                                    clase="pl-8 block w-full rounded-lg border border-[#E2E0DC] px-2.5 py-1 text-xs text-gray-900 transition focus:border-[#7a0202] focus:ring-2 focus:ring-[#7a0202] focus:ring-opacity-10"
                                    onChange={(e) =>
                                        setData('nacionalidad', e.target.value)
                                    }
                                    placeholder="España"
                                    required
                                />
                            </div>
                            <InputError message={errors.nacionalidad} className="mt-0.5 text-xs" />
                        </div>

                        <div>
                            <InputLabel htmlFor="telefono" value="Tlf" />
                            <div className="relative mt-0.5">
                                <PhoneIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                                <Campo
                                    id="telefono"
                                    type="tel"
                                    name="telefono"
                                    value={data.telefono}
                                    clase="pl-8 block w-full rounded-lg border border-[#E2E0DC] px-2.5 py-1 text-xs text-gray-900 font-mono transition focus:border-[#7a0202] focus:ring-2 focus:ring-[#7a0202] focus:ring-opacity-10"
                                    onChange={(e) =>
                                        setData('telefono', e.target.value)
                                    }
                                    placeholder="+34600000"
                                    required
                                />
                            </div>
                            <InputError message={errors.telefono} className="mt-0.5 text-xs" />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <InputLabel htmlFor="direccion" value="Dirección" />
                        <textarea
                            id="direccion"
                            name="direccion"
                            value={data.direccion}
                            className="mt-0.5 block w-full rounded-lg border border-[#E2E0DC] px-2.5 py-1 text-xs text-gray-900 transition focus:border-[#7a0202] focus:ring-2 focus:ring-[#7a0202] focus:ring-opacity-10"
                            onChange={(e) => setData('direccion', e.target.value)}
                            placeholder="Calle Principal, 123"
                            rows="2"
                            required
                        />
                        <InputError message={errors.direccion} className="mt-0.5 text-xs" />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <InputLabel htmlFor="ciudad" value="Ciudad" />
                            <Campo
                                id="ciudad"
                                name="ciudad"
                                value={data.ciudad}
                                clase="mt-0.5 block w-full rounded-lg border border-[#E2E0DC] px-2.5 py-1 text-xs text-gray-900 transition focus:border-[#7a0202] focus:ring-2 focus:ring-[#7a0202] focus:ring-opacity-10"
                                onChange={(e) => setData('ciudad', e.target.value)}
                                placeholder="Madrid"
                            />
                            <InputError message={errors.ciudad} className="mt-0.5 text-xs" />
                        </div>

                        <div>
                            <InputLabel htmlFor="codigo_postal" value="Código Postal" />
                            <Campo
                                id="codigo_postal"
                                name="codigo_postal"
                                value={data.codigo_postal}
                                clase="mt-0.5 block w-full rounded-lg border border-[#E2E0DC] px-2.5 py-1 text-xs text-gray-900 transition focus:border-[#7a0202] focus:ring-2 focus:ring-[#7a0202] focus:ring-opacity-10"
                                onChange={(e) => setData('codigo_postal', e.target.value)}
                                placeholder="28001"
                            />
                            <InputError message={errors.codigo_postal} className="mt-0.5 text-xs" />
                        </div>
                    </div>

                    {/* Password & Confirmation */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <InputLabel htmlFor="password" value="Contraseña" />
                            <div className="relative mt-0.5">
                                <LockClosedIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                                <Campo
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    clase="pl-8 block w-full rounded-lg border border-[#E2E0DC] px-2.5 py-1 text-xs text-gray-900 transition focus:border-[#7a0202] focus:ring-2 focus:ring-[#7a0202] focus:ring-opacity-10"
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    placeholder="••••••"
                                    required
                                />
                            </div>
                            <InputError message={errors.password} className="mt-0.5 text-xs" />
                        </div>

                        <div>
                            <InputLabel htmlFor="password_confirmation" value="Confirmar" />
                            <div className="relative mt-0.5">
                                <LockClosedIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                                <Campo
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    clase="pl-8 block w-full rounded-lg border border-[#E2E0DC] px-2.5 py-1 text-xs text-gray-900 transition focus:border-[#7a0202] focus:ring-2 focus:ring-[#7a0202] focus:ring-opacity-10"
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        setData('password_confirmation', e.target.value)
                                    }
                                    placeholder="••••••"
                                    required
                                />
                            </div>
                            <InputError message={errors.password_confirmation} className="mt-0.5 text-xs" />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full mt-3 rounded-lg bg-gradient-to-r from-[#7a0202] to-[#920303] px-3 py-2 font-semibold text-sm text-white transition duration-200 hover:shadow-lg hover:shadow-[#7a0202]/20 focus:outline-none focus:ring-2 focus:ring-[#920303] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-3.5 w-3.5 mr-1" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Creando...
                            </span>
                        ) : (
                            'Registrarse'
                        )}
                    </button>
                </form>

                {/* Login CTA */}
                <div className="mt-3 pt-2.5 border-t border-[#E2E0DC]">
                    <p className="text-center text-gray-700 text-xs mb-1.5">
                        ¿Tienes cuenta?
                    </p>
                    <Link
                        href={route('login')}
                        className="block text-center text-[#7a0202] font-semibold text-xs hover:text-[#920303] transition"
                    >
                        Inicia sesión
                    </Link>
                </div>

                {/* Terms */}
                <p className="text-center text-xs text-gray-600 mt-3">
                    Al registrarte aceptas nuestros{' '}
                    <a href="#" className="text-[#7a0202] hover:underline">
                        términos
                    </a>
                </p>
            </div>
        </AuthLayout>
    );
}
