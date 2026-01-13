import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout>
            <Head title="Iniciar sesión" />

            <div className="px-5 py-8">
                {/* Header */}
                <div className="mb-5">
                    <h2 className="text-2xl font-bold text-[#7a0202]">
                        Hotel Gludio
                    </h2>
                    <p className="text-gray-600 text-xs mt-0.5">
                        Accede a tu cuenta
                    </p>
                </div>

                {/* Status Message */}
                {status && (
                    <div className="mb-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200">
                        ✓ {status}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={submit} className="space-y-3.5">
                    {/* Email */}
                    <div>
                        <InputLabel htmlFor="email" value="Correo" />
                        <div className="relative mt-1">
                            <EnvelopeIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="pl-8 block w-full rounded-lg border border-[#E2E0DC] px-3 py-1.5 text-sm text-gray-900 transition focus:border-[#7a0202] focus:ring-2 focus:ring-[#7a0202] focus:ring-opacity-10"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="tu@email.com"
                            />
                        </div>
                        <InputError message={errors.email} className="mt-0.5 text-xs" />
                    </div>

                    {/* Password */}
                    <div>
                        <InputLabel htmlFor="password" value="Contraseña" />
                        <div className="relative mt-1">
                            <LockClosedIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="pl-8 block w-full rounded-lg border border-[#E2E0DC] px-3 py-1.5 text-sm text-gray-900 transition focus:border-[#7a0202] focus:ring-2 focus:ring-[#7a0202] focus:ring-opacity-10"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <InputError message={errors.password} className="mt-0.5 text-xs" />
                    </div>

                    {/* Remember me & Forgot password */}
                    <div className="flex items-center justify-between text-xs">
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-[#7a0202] hover:text-[#920303] font-medium transition"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            )}
                        <label className="flex items-center">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) =>
                                    setData('remember', e.target.checked)
                                }
                                className="rounded border-[#E2E0DC] text-[#7a0202] focus:ring-[#7a0202]"
                            />
                            <span className="ms-1.5">Recuérdame</span>
                        </label>

                    </div>

                    {/* Submit Button */}
                    <button type="submit" disabled={processing} className="w-full mt-3 rounded-lg bg-gradient-to-r from-[#7a0202] to-[#920303] px-3 py-2 font-semibold text-sm text-white transition duration-200 hover:shadow-lg hover:shadow-[#7a0202]/20 focus:outline-none focus:ring-2 focus:ring-[#920303] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {processing ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Iniciando...
                            </span>
                        ) : (
                            'Iniciar sesión'
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#E2E0DC]"></div>
                    </div>
                </div>

                {/* Register CTA */}
                <Link
                    href={route('register')}
                    className="block w-full text-center rounded-lg border-2 border-[#E2E0DC] px-3 py-1.5 font-semibold text-sm text-[#7a0202] transition hover:border-[#7a0202] hover:bg-[#7a0202]/5"
                >
                    Crear cuenta
                </Link>

                {/* Trust badges */}
                <div className="mt-4 pt-3 border-t border-[#E2E0DC]">
                    <div className="flex items-center justify-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-0.5">
                            <span className="text-[#7a0202]">✓</span>
                            Seguro
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="inline-flex items-center gap-0.5">
                            <span className="text-[#7a0202]">✓</span>
                            24/7
                        </span>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
