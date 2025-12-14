export default function LeyendaEstados() {
    return (
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Estado de las Habitaciones</h3>
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success rounded-sm"></div>
                    <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-error rounded-sm"></div>
                    <span>Ocupada</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-warning rounded-sm"></div>
                    <span>Mantenimiento</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-info rounded-sm"></div>
                    <span>Limpieza</span>
                </div>
            </div>
        </div>
    );
}
