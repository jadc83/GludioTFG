import Campo from '@/Components/reservas/utilidades/Campo';
import InputError from '@/Components/InputError';
import { limpiarFormulario } from '@/hooks/useFormHelpers';
import { Transition } from '@headlessui/react';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        clearErrors,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => limpiarFormulario(reset, clearErrors),
            onError: (errs) => {
                if (errs?.password) {
                    limpiarFormulario(reset, clearErrors, 'password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errs?.current_password) {
                    limpiarFormulario(reset, clearErrors, 'current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={`mx-auto max-w-4xl ${className}`}>
            <div className="overflow-hidden rounded-3xl bg-white">
                <form onSubmit={updatePassword} className="space-y-8 p-6 md:p-8">
                    <header className="mb-2 pb-4">
                        <h2 className="text-lg font-extrabold text-gray-800">Actualizar Contraseña</h2>
                        <p className="mt-1 text-sm text-gray-500">Mantén tu cuenta segura. Usa una contraseña robusta y única.</p>
                    </header>

                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label
                                htmlFor="current_password"
                                className="ml-1 text-[10px] font-black uppercase text-gray-400"
                            >
                                Contraseña Actual
                            </label>
                            <Campo
                                id="current_password"
                                ref={currentPasswordInput}
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                type="password"
                                clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10 transition"
                                autoComplete="current-password"
                            />
                            <InputError message={errors.current_password} />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="password"
                                className="ml-1 text-[10px] font-black uppercase text-gray-400"
                            >
                                Nueva Contraseña
                            </label>
                            <Campo
                                id="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                type="password"
                                clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10 transition"
                                autoComplete="new-password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="password_confirmation"
                                className="ml-1 text-[10px] font-black uppercase text-gray-400"
                            >
                                Confirmar Contraseña
                            </label>
                            <Campo
                                id="password_confirmation"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                type="password"
                                clase="w-full bg-gray-50 border-none rounded-xl py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10 transition"
                                autoComplete="new-password"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>
                    </div>

                    <div className="perfil-form-actions flex items-center gap-4 pt-6">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-2xl bg-[#920303] px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow hover:bg-[#7a0202] disabled:opacity-50 transition"
                        >
                            {processing ? 'Procesando...' : 'Actualizar Contraseña'}
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
