import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';

export default function BuscadorNavbar() {
    const [localizador, setLocalizador] = useState('');
    const [buscando, setBuscando] = useState(false);

    const handleBuscar = async (e) => {
        e.preventDefault();

        if (!localizador.trim()) return;

        setBuscando(true);

        try {
            // Verificar que la reserva existe
            const response = await fetch(`/reservas/buscar/${localizador.trim()}`);

            if (response.ok) {
                // Redirigir a la página de detalle
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
        <form onSubmit={handleBuscar} className="hidden md:flex items-center">
            <div className="relative">
                <input
                    type="text"
                    value={localizador}
                    onChange={(e) => setLocalizador(e.target.value.toUpperCase())}
                    placeholder="Busca tu reserva..."
                    className="input input-sm input-bordered w-48 focus:outline-none"
                    disabled={buscando}
                />
            </div>
            <button
                type="submit"
                disabled={buscando}
                className="btn btn-sm btn-ghost p-1"
            >
                <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
        </form>
    );
}
