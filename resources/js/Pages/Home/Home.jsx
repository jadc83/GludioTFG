import Fondo from '@/Components/UI/Fondo';
import Servicios from '@/Components/UI/Servicios';
import Tarjetas from '@/Components/UI/Tarjetas';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Home() {
    return (
        <GuestLayout>
            <div className="flex w-full flex-col gap-0">
                <Fondo />
                <Servicios />
                <Tarjetas />
            </div>
        </GuestLayout>
    );
}
