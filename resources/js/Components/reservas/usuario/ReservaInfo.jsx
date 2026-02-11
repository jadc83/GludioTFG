import {
    CheckCircleIcon,
    MapPinIcon,
    PhoneIcon,
} from '@heroicons/react/24/outline';

export default function ReservaInfo({
    locationText = 'Hotel Gludio, Avenida del Ejército, Sanlúcar de Barrameda',
    phone = '+34 91 234 5678',
}) {
    return (
        <section className="grid grid-cols-1 gap-8 rounded-2xl border border-gray-200 bg-gris p-8 shadow-sm md:grid-cols-2">
            <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Información de Destino
                </h4>
                <div className="flex gap-3">
                    <MapPinIcon className="h-5 w-5 shrink-0 text-red-900" />
                    <p className="text-sm font-bold text-gray-700">
                        {locationText}
                    </p>
                </div>
                <div className="flex gap-3">
                    <PhoneIcon className="h-5 w-5 shrink-0 text-red-900" />
                    <p className="text-sm font-bold text-gray-700">{phone}</p>
                </div>
            </div>
            <div className="rounded-2xl bg-gris p-6">
                <h4 className="mb-4 text-[10px] font-black uppercase tracking-widest text-black">
                    Servicios Incluidos
                </h4>
                <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-xs font-bold text-gray-600">
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />{' '}
                        Wi-Fi Ultra-Rápido
                    </li>
                    <li className="flex items-center gap-2 text-xs font-bold text-gray-600">
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />{' '}
                        Insonorización Premium
                    </li>
                </ul>
            </div>
        </section>
    );
}
