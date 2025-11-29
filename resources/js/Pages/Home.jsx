import Fondo from '@/Components/Fondo';
import GuestLayout from '@/Layouts/GuestLayout';
import Servicios from '@/Components/Servicios';
import Tarjetas from '@/Components/Tarjetas';

export default function Home() {
    return (
        <GuestLayout>
            <div className='flex w-full flex-col gap-0'>
                <Fondo />
                <Servicios />
                <Tarjetas />
            </div>
        </GuestLayout>
    );
}
