import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/UI/PrimaryButton';
import Campo from '@/Components/formulario/Campo';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            tipo_documento: user.tipo_documento || '',
            numero_documento: user.numero_documento || '',
            nacionalidad: user.nacionalidad || '',
            direccion: user.direccion || '',
            ciudad: user.ciudad || '',
            codigo_postal: user.codigo_postal || '',
            telefono: user.telefono || '',
        });

    useEffect(() => {
        // Asegurar que los valores se precarguen correctamente
        setData({
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
    }, []);    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };



    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Información del Perfil
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Actualiza tus datos personales y de contacto.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                {/* Fila 1: Nombre y Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <InputLabel htmlFor="name" value="Nombre Completo" />

                        <Campo
                            id="name"
                            clase="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            isFocused
                            autoComplete="name"
                        />

                        <InputError className="mt-2" message={errors.name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="Correo Electrónico" />

                        <Campo
                            id="email"
                            type="email"
                            clase="mt-1 block w-full"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                        />

                        <InputError className="mt-2" message={errors.email} />
                    </div>
                </div>

                {/* Fila 2: Tipo y Número de Documento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <InputLabel htmlFor="tipo_documento" value="Tipo de Documento" />

                        <select id="tipo_documento" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200" value={data.tipo_documento || ''}
                            onChange={(e) => setData('tipo_documento', e.target.value)}>
                            <option value="">Seleccionar...</option>
                            <option value="dni">DNI</option>
                            <option value="pasaporte">Pasaporte</option>
                            <option value="tie">TIE</option>
                        </select>

                        <InputError className="mt-2" message={errors.tipo_documento} />
                    </div>

                    <div>
                        <InputLabel htmlFor="numero_documento" value="Número de Documento" />

                        <Campo
                            id="numero_documento"
                            clase="mt-1 block w-full"
                            value={data.numero_documento}
                            onChange={(e) => setData('numero_documento', e.target.value)}
                            autoComplete="off"
                        />

                        <InputError className="mt-2" message={errors.numero_documento} />
                    </div>
                </div>

                {/* Fila 3: Nacionalidad y Teléfono */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <InputLabel htmlFor="nacionalidad" value="Nacionalidad" />

                        <Campo
                            id="nacionalidad"
                            clase="mt-1 block w-full"
                            value={data.nacionalidad}
                            onChange={(e) => setData('nacionalidad', e.target.value)}
                            autoComplete="country-name"
                        />

                        <InputError className="mt-2" message={errors.nacionalidad} />
                    </div>

                    <div>
                        <InputLabel htmlFor="telefono" value="Teléfono" />

                        <Campo
                            id="telefono"
                            type="tel"
                            clase="mt-1 block w-full"
                            value={data.telefono}
                            onChange={(e) => setData('telefono', e.target.value)}
                            autoComplete="tel"
                        />

                        <InputError className="mt-2" message={errors.telefono} />
                    </div>
                </div>
                {/* Fila 4: Dirección, Ciudad y Código Postal */}
                <div>
                    <InputLabel htmlFor="direccion" value="Dirección" />

                    <Campo
                        id="direccion"
                        clase="mt-1 block w-full"
                        value={data.direccion}
                        onChange={(e) => setData('direccion', e.target.value)}
                        autoComplete="street-address"
                    />

                    <InputError className="mt-2" message={errors.direccion} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                        <div>
                            <InputLabel htmlFor="ciudad" value="Ciudad" />
                            <Campo
                                id="ciudad"
                                clase="mt-1 block w-full"
                                value={data.ciudad}
                                onChange={(e) => setData('ciudad', e.target.value)}
                                autoComplete="address-level2"
                            />
                            <InputError className="mt-2" message={errors.ciudad} />
                        </div>

                        <div>
                            <InputLabel htmlFor="codigo_postal" value="Código Postal" />
                            <Campo
                                id="codigo_postal"
                                clase="mt-1 block w-full"
                                value={data.codigo_postal}
                                onChange={(e) => setData('codigo_postal', e.target.value)}
                                autoComplete="postal-code"
                            />
                            <InputError className="mt-2" message={errors.codigo_postal} />
                        </div>
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Tu correo electrónico no ha sido verificado.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Haz clic aquí para reenviar el correo de verificación.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                Se ha enviado un nuevo enlace de verificación a tu correo electrónico.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Guardar Cambios</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-green-600 font-medium">Guardado exitosamente.</p>
                    </Transition>
                </div>
            </form>
            {/* Errores mostrados inline bajo cada input */}
        </section>
    );
}
