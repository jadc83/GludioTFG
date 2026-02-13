import Campo from '@/Components/reservas/utilidades/Campo';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function BuscadorForm({
    localizador,
    setLocalizador,
    buscando,
    handleBuscar,
}) {
    return (
        <form onSubmit={handleBuscar} className="mb-6">
            <div className="flex gap-2">
                <Campo
                    id="localizador_buscar"
                    name="localizador"
                    value={localizador}
                    onChange={(e) => setLocalizador(e.target.value.toUpperCase())}
                    placeholder="Ej: GZ02JMV"
                    className="input-bordered input flex-1"
                    disabled={buscando}
                />
                <button type="submit" disabled={buscando} className="btn btn-primary gap-2">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    {buscando ? 'Buscando...' : 'Buscar'}
                </button>
            </div>
        </form>
    );
}
