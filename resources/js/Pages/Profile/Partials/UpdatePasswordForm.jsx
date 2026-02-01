import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/UI/PrimaryButton';
import Campo from '@/Components/formulario/Campo';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { limpiarFormulario } from '@/hooks/useFormHelpers';
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
            onError: (errors) => {
                if (errors.password) {
                    limpiarFormulario(reset, clearErrors, 'password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    limpiarFormulario(reset, clearErrors, 'current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-white">
                    Cambiar Contraseña
                </h2>

                <p className="mt-1 text-sm text-white/60">
                    Asegúrate de usar una contraseña segura y que solo tu conozcas.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-6">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Contraseña Actual"
                    />

                    <Campo
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) =>
                            setData('current_password', e.target.value)
                        }
                        type="password"
                        className="mt-1 block w-full bg-white text-gray-900 border-none rounded-xl py-3 font-bold placeholder-gray-400 focus:ring-2 focus:ring-white/30"
                        autoComplete="current-password"
                    />

                    <InputError
                        message={errors.current_password}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Nueva Contraseña" />

                    <Campo
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full bg-white text-gray-900 border-none rounded-xl py-3 font-bold placeholder-gray-400 focus:ring-2 focus:ring-white/30"
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirmar Contraseña"
                    />

                    <Campo
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        type="password"
                        className="mt-1 block w-full bg-white text-gray-900 border-none rounded-xl py-3 font-bold placeholder-gray-400 focus:ring-2 focus:ring-white/30"
                        autoComplete="new-password"
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        disabled={processing}
                        className="px-10 py-3 bg-black/30 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-black/50 border border-white/20 transition disabled:opacity-50"
                    >
                        Guardar
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-green-400">Guardado.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
