export default function LeyendaEstados() {
    return (
        <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
                Estado de las Habitaciones
            </h3>
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-success"></div>
                    <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-error"></div>
                    <span>Ocupada</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-warning"></div>
                    <span>Mantenimiento</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-info"></div>
                    <span>Limpieza</span>
                </div>
            </div>
        </div>
    );
}
