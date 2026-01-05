import PrimaryButton from '../PrimaryButton';

export default function Paso4Confirmacion({ rango, watch, habitacionesSeleccionadas, getIcono, getTotalHabitaciones, volverAtras, onConfirmar }) {
    const formData = watch();
    const Migitas = () => (
        <nav aria-label="Progreso de reserva" className="mx-auto mb-4 flex max-w-md justify-center space-x-2 rounded bg-gris p-2 text-sm">
            {['Fechas', 'Habitación', 'Datos', 'Confirmar'].map((etiqueta, i) => (
                <span key={i} className={`rounded-md px-3 py-1 ${i === 3 ? 'bg-black text-white' : 'bg-gris text-black'}`}>{etiqueta}</span>
            ))}
        </nav>
    );

    const renderRow = (label, value) => (
        <tr className="border-b">
            <th className="w-2/5 py-3 pr-4 text-left font-semibold text-gray-700">{label}</th>
            <td className="py-3 text-left">{value}</td>
        </tr>
    );

    return (
        <main className="flex h-full flex-col bg-gris p-4">
            <header className="mb-4">
                <h3 className="titulo-rojo mb-4 text-center text-2xl font-bold">Confirmación de reserva</h3>
                <Migitas />
            </header>

            <section className="flex-1 overflow-y-auto bg-gris">
                <div className="card bg-white p-6 shadow-md">
                    <table className="w-full text-sm">
                        <tbody>
                            {renderRow('Nombre:', formData.name)}
                            {renderRow('Email:', formData.email)}
                            {renderRow('Teléfono:', formData.telefono)}
                            {renderRow('Documento:', `${formData.tipo_documento.toUpperCase()} - ${formData.numero_documento}`)}
                            {renderRow('Nacionalidad:', formData.nacionalidad)}
                            {renderRow('Dirección:', formData.direccion)}
                            {renderRow('Fechas:', `${rango?.from?.toLocaleDateString()} - ${rango?.to?.toLocaleDateString()}`)}
                            <tr>
                                <th className="py-3 pr-4 text-left align-top font-semibold text-gray-700">Habitaciones:</th>
                                <td className="py-3 text-left">
                                    {Object.entries(habitacionesSeleccionadas).filter(([, r]) => r.cantidad > 0).map(([tipo, r]) => (
                                        <div key={tipo} className="mb-1.5">
                                            {getIcono(tipo)} <strong>{r.cantidad}x {tipo}</strong> ({r.personas || 1} {(r.personas || 1) === 1 ? 'huésped' : 'huéspedes'})
                                            <div className="mt-0.5 text-xs text-gray-500">Se asignarán automáticamente al confirmar</div>
                                        </div>
                                    ))}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {Object.keys(habitacionesSeleccionadas).length > 0 && (
                    <div className="card mt-4 bg-white p-6 shadow-md">
                        <h4 className="titulo-rojo mb-3 text-base font-bold">Habitaciones seleccionadas</h4>
                        <div className="space-y-2">
                            {Object.entries(habitacionesSeleccionadas).filter(([, data]) => (data.cantidad || 0) > 0).map(([tipo, data]) => (
                                <div key={tipo} className="flex items-center justify-between rounded bg-gray-50 p-3">
                                    <div>
                                        <span className="font-semibold">{tipo}</span>
                                        <span className="ml-2 text-sm text-gray-600">({data.cantidad} hab. × {data.personas || 1} pers.)</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Total: {data.cantidad * (data.personas || 1)} personas</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6 rounded-lg border-2 border-blue-300 bg-blue-50 p-5">
                    <div className="text-center">
                        <p className="mb-2 text-base font-bold text-blue-800">ℹ️ Asignación automática de habitaciones</p>
                        <p className="text-sm text-blue-700">Al confirmar, el sistema asignará automáticamente los números de habitación según disponibilidad.{getTotalHabitaciones() > 1 && ' Intentaremos asignar habitaciones contiguas cuando sea posible.'}</p>
                    </div>
                </div>
            </section>

            <footer className="border-t border-gray-300 bg-gris py-3">
                <div className="flex items-center justify-between gap-3">
                    <PrimaryButton onClick={volverAtras}>Atrás</PrimaryButton>
                    <PrimaryButton onClick={onConfirmar}>Confirmar Reserva</PrimaryButton>
                </div>
            </footer>
        </main>
    );
}
