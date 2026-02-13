import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';

export default function SeccionSeguridad({ mustVerifyEmail, status }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 p-8 duration-500 md:p-12">
            <div className="max-w-2xl space-y-6">
                <div className="mt-0 rounded-xl bg-transparent p-0">
                    <h3 className="text-sm font-semibold text-gray-700">Editar información</h3>
                    <div className="mt-3">
                        <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} className="max-w-none" />
                    </div>
                </div>

                <UpdatePasswordForm className="w-full" />
            </div>
        </div>
    );
}
