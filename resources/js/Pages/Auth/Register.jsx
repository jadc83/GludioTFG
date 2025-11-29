import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        tipo_documento: 'dni',
        numero_documento: '',
        nacionalidad: '',
        dirección: '',
        teléfono: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout>
            <Head title="Register" />

            <form onSubmit={submit}>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <InputLabel htmlFor="name" value="Name" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full"
                            autoComplete="name"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    <div className="flex-1">
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError message={errors.email} className="mt-1" />
                    </div>
                </div>

                <div className="flex gap-4 mt-4">
                    <div className="flex-1">
                        <InputLabel htmlFor="tipo_documento" value="Tipo de Documento" />
                        <select
                            id="tipo_documento"
                            name="tipo_documento"
                            value={data.tipo_documento}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            onChange={(e) => setData('tipo_documento', e.target.value)}
                            required
                        >
                            <option value="dni">DNI</option>
                            <option value="pasaporte">Pasaporte</option>
                            <option value="tie">TIE</option>
                        </select>
                        <InputError message={errors.tipo_documento} className="mt-1" />
                    </div>

                    <div className="flex-1">
                        <InputLabel htmlFor="numero_documento" value="Número de Documento" />
                        <TextInput
                            id="numero_documento"
                            name="numero_documento"
                            value={data.numero_documento}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('numero_documento', e.target.value)}
                            required
                        />
                        <InputError message={errors.numero_documento} className="mt-1" />
                    </div>
                </div>

                <div className="flex gap-4 mt-4">
                    <div className="flex-1">
                        <InputLabel htmlFor="nacionalidad" value="Nacionalidad" />
                        <TextInput
                            id="nacionalidad"
                            name="nacionalidad"
                            value={data.nacionalidad}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('nacionalidad', e.target.value)}
                            required
                        />
                        <InputError message={errors.nacionalidad} className="mt-1" />
                    </div>

                    <div className="flex-1">
                        <InputLabel htmlFor="teléfono" value="Teléfono" />
                        <TextInput
                            id="teléfono"
                            type="tel"
                            name="teléfono"
                            value={data.teléfono}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('teléfono', e.target.value)}
                            required
                        />
                        <InputError message={errors.teléfono} className="mt-1" />
                    </div>
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="dirección" value="Dirección" />
                    <textarea
                        id="dirección"
                        name="dirección"
                        value={data.dirección}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        onChange={(e) => setData('dirección', e.target.value)}
                        rows="2"
                        required
                    />
                    <InputError message={errors.dirección} className="mt-1" />
                </div>

                <div className="flex gap-4 mt-4">
                    <div className="flex-1">
                        <InputLabel htmlFor="password" value="Password" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    <div className="flex-1">
                        <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                        <InputError message={errors.password_confirmation} className="mt-1" />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-4">
                    <Link href={route('login')} className="text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        Ya dispones de cuenta?
                    </Link>

                    <PrimaryButton disabled={processing}>Registrate</PrimaryButton>
                </div>
            </form>
        </AuthLayout>
    );
}
