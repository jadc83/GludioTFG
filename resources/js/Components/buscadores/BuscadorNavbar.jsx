import Campo from '@/Components/formulario/Campo';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function BuscadorNavbar() {
    const [localizador, setLocalizador] = useState('');
    const [buscando, setBuscando] = useState(false);

    const handleBuscar = async (e) => {
        e.preventDefault();

        if (!localizador.trim()) return;

        setBuscando(true);

        try {
            const service = await import('@/hooks/reservas/service');
            const r = await service.buscarReserva(localizador.trim());
            if (r) {
                router.visit(route('reserva.show', localizador.trim()));
            } else {
                alert('No se encontró la reserva con ese localizador');
            }
        } catch (err) {
            alert('Error al buscar la reserva');
        } finally {
            setBuscando(false);
        }
    };

    return (
        <form onSubmit={handleBuscar} className="hidden items-center md:flex">
            <div className="relative">
                <Campo
                    id="navbar_localizador"
                    name="localizador"
                    value={localizador}
                    onChange={(e) =>
                        setLocalizador(e.target.value.toUpperCase())
                    }
                    placeholder="Busca tu reserva..."
                    className="input-bordered input input-sm w-48 focus:outline-none"
                    disabled={buscando}
                />
            </div>
            <button
                type="submit"
                disabled={buscando}
                className="btn btn-ghost btn-sm p-1"
            >
                <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
        </form>
    );
}
