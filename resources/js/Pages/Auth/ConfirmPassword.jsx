import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/UI/PrimaryButton';
import Campo from '@/Components/formulario/Campo';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, useForm } from '@inertiajs/react';
import { limpiarFormulario } from '@/hooks/useFormHelpers';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => limpiarFormulario(reset, clearErrors, 'password'),
        });
    };

    return (
        <AuthLayout>
            <Head title="Confirm Password" />

            <div className="mb-4 text-sm text-gray-600">
                This is a secure area of the application. Please confirm your
                password before continuing.
            </div>

            <form onSubmit={submit}>
                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <Campo
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        clase="mt-1 block w-full"
                        estaFocalizado={true}
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        Confirm
                    </PrimaryButton>
                </div>
            </form>
        </AuthLayout>
    );
}
