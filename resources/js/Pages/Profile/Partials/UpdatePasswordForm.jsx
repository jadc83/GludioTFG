import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/UI/PrimaryButton';
import Campo from '@/Components/reservas/utilidades/Campo';
import { limpiarFormulario } from '@/hooks/useFormHelpers';
import { Transition } from '@headlessui/react';
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
            onError: (errors) => {
                if (errors.password) {
                    limpiarFormulario(
                        reset,
                        clearErrors,
                        'password',
                        'password_confirmation',
                    );
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
        <section
            className={`max-w-xl rounded-lg bg-white p-6 shadow-sm ${className}`}
        >
            <header className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                    Actualizar Contraseña
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    Asegúrate de que tu cuenta sea segura utilizando una
                    contraseña larga y aleatoria que no compartas con otros
                    servicios.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-8 space-y-5">
                {/* Contraseña Actual */}
                <div className="space-y-1">
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
                        className="block w-full transition duration-150 ease-in-out"
                        autoComplete="current-password"
                    />
                    <InputError message={errors.current_password} />
                </div>

                {/* Nueva Contraseña */}
                <div className="space-y-1">
                    <InputLabel htmlFor="password" value="Nueva Contraseña" />
                    <Campo
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="block w-full transition duration-150 ease-in-out"
                        autoComplete="new-password"
                    />
                    <InputError message={errors.password} />
                </div>

                {/* Confirmar Contraseña */}
                <div className="space-y-1">
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
                        className="block w-full transition duration-150 ease-in-out"
                        autoComplete="new-password"
                    />
                    <InputError message={errors.password_confirmation} />
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-4 pt-4">
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Guardando...' : 'Guardar Cambios'}
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-out duration-300"
                        enterFrom="opacity-0 translate-x-2"
                        enterTo="opacity-100 translate-x-0"
                        leave="transition ease-in duration-500"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm font-medium text-green-600">
                            ✓ Actualizado correctamente.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
