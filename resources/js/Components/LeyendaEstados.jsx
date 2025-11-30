export default function LeyendaEstados() {
    return (
        <div className="mb-4">
            <h3 className="font-medium text-sm mb-3">Leyenda de Estados</h3>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-success rounded-full ring-1 ring-white/10 shadow-sm"></div>
                    <span className="text-xs">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-error rounded-full ring-1 ring-white/10 shadow-sm"></div>
                    <span className="text-xs">Ocupada</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-warning rounded-full ring-1 ring-white/10 shadow-sm"></div>
                    <span className="text-xs">Mantenimiento</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-info rounded-full ring-1 ring-white/10 shadow-sm"></div>
                    <span className="text-xs">Limpieza</span>
                </div>
            </div>
        </div>
    );
}
