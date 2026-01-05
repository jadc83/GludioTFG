import { useState, useEffect } from 'react';
import PrimaryButton from '../PrimaryButton';
import FormularioPago from '../pagos/FormularioPago';
import ModalConfirmacionReserva from './ModalConfirmacionReserva';

export default function Paso4Confirmacion({
    rango,
    watch,
    habitacionesSeleccionadas,
    getIcono,
    getTotalHabitaciones,
    volverAtras,
    onConfirmar,
    calcularMontoTotal,
    currentUser,
    getValues,
    reservableId,
    tipo_usuario,
    localizador,
    setPaso,
    limpiarRango,
    setValue,
    actualizarSeleccionHabitacion,
}) {
    const formData = watch();
    const [mostrarFormularioPago, setMostrarFormularioPago] = useState(false);
    const [errorPago, setErrorPago] = useState(null);
    const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
    const [datosReservaConfirmada, setDatosReservaConfirmada] = useState(null);
    const monto = calcularMontoTotal?.() || 0;

    // Debug: log del localizador cuando cambia
    useEffect(() => {
        console.log('🔍 Paso4Confirmacion - localizador recibido:', localizador);
    }, [localizador]);

    // Preparar datos de la reserva para el formulario de pago
    const prepararDatosReserva = () => {
        const values = getValues();
        const habitaciones = Object.entries(habitacionesSeleccionadas)
            .filter(([, r]) => r.cantidad > 0)
            .map(([tipo, r]) => ({
                tipo,
                cantidad: r.cantidad,
                personas_por_habitacion: Number(r.personas) > 0 ? Number(r.personas) : 1,
            }));

        return {
            name: values.name,
            email: values.email,
            telefono: values.telefono,
            tipo_documento: values.tipo_documento,
            numero_documento: values.numero_documento,
            nacionalidad: values.nacionalidad,
            direccion: values.direccion,
            check_in: rango?.from,
            check_out: rango?.to,
            habitaciones,
            reservable_id: reservableId,
            tipo_usuario: tipo_usuario || 'cliente',
            booked_by_user_id: currentUser?.id || null,
        };
    };

    const handleCerrarDrawer = () => {
        const checkbox = document.getElementById('drawer-toggle');
        if (checkbox) {
            checkbox.checked = false;
        }
    };

    const handleResetearReserva = () => {
        console.log('🔄 Reseteando reserva...');
        // Cerrar el modal
        setMostrarModalConfirmacion(false);
        setDatosReservaConfirmada(null);

        // Resetear formulario
        setValue('name', '');
        setValue('email', '');
        setValue('telefono', '');
        setValue('tipo_documento', 'dni');
        setValue('numero_documento', '');
        setValue('nacionalidad', '');
        setValue('direccion', '');

        // Resetear fechas
        limpiarRango();

        // Resetear selección de habitaciones (iterar y limpiar)
        Object.keys(habitacionesSeleccionadas).forEach(tipo => {
            if (actualizarSeleccionHabitacion) {
                actualizarSeleccionHabitacion(tipo, 0, 0);
            }
        });

        // Resetear formulario de pago
        setMostrarFormularioPago(false);
        setErrorPago(null);

        // Volver al paso 1
        setPaso(1);

        // Cerrar el drawer
        console.log('🔄 Cerrando drawer...');
        handleCerrarDrawer();
        console.log('🔄 Reserva reseteada correctamente');

        // Recargar la tabla de reservas
        console.log('🔄 Recargando página para actualizar tabla de reservas...');
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };
    const Migitas = () => (
        <nav aria-label="Progreso de reserva" className="mx-auto mb-6 flex max-w-md justify-center space-x-2 text-xs">
            {['Fechas', 'Habitación', 'Datos', 'Confirmar'].map((etiqueta, i) => (
                <div key={i} className="flex items-center">
                    <span className={`font-semibold uppercase tracking-wider ${i === 3 ? 'text-red-600' : 'text-gray-400'}`}>{etiqueta}</span>
                    {i < 3 && <span className="ml-2 text-gray-300">→</span>}
                </div>
            ))}
        </nav>
    );

    const renderRow = (label, value) => (
        <tr className="border-b border-gray-200">
            <th className="w-2/5 py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">{label}</th>
            <td className="py-2 text-left text-sm font-medium text-gray-900">{value}</td>
        </tr>
    );

    return (
        <main className="flex h-full flex-col bg-white p-6">
            <header className="mb-6 border-b border-gray-200 pb-6">
                <h3 className="mb-4 text-center text-2xl font-bold text-gray-900">Confirmación de Reserva</h3>
                <Migitas />
            </header>

            <section className="flex-1 overflow-y-auto">
                <div className="space-y-6">
                    {/* Resumen */}
                    <div className="border-l-4 border-red-600 bg-gray-50 p-6 rounded-r">
                        <table className="w-full">
                            <tbody>
                                {localizador && renderRow('Número de Reserva:', <span className="font-mono font-bold text-red-600">{localizador}</span>)}
                                {renderRow('Huésped:', formData.name)}
                                {renderRow('Fechas:', `${rango?.from?.toLocaleDateString('es-ES')} - ${rango?.to?.toLocaleDateString('es-ES')}`)}
                                <tr className="border-b border-gray-200">
                                    <th className="w-2/5 py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Habitaciones:</th>
                                    <td className="py-2 text-left text-sm font-medium text-gray-900">
                                        {Object.entries(habitacionesSeleccionadas).filter(([, r]) => r.cantidad > 0).map(([tipo, r]) => (
                                            <div key={tipo} className="mb-1">
                                                {r.cantidad}x {tipo} ({r.personas || 1} {(r.personas || 1) === 1 ? 'huésped' : 'huéspedes'})
                                            </div>
                                        ))}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Formulario de Pago */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <h4 className="mb-6 text-center text-lg font-bold text-gray-900">Formulario de Pago</h4>
                        <FormularioPago
                            reservaData={prepararDatosReserva()}
                            monto={monto}
                            onPagoExitoso={(data) => {
                                const localizadorDelPago = data?.localizador || localizador;
                                console.log('💳 Pago exitoso. Localizador recibido:', localizadorDelPago);
                                console.log('💳 Pago exitoso. Datos a pasar al modal:', {
                                    localizador: localizadorDelPago,
                                    nombre: formData.name,
                                    check_in: rango?.from,
                                    check_out: rango?.to,
                                    cantidad_habitaciones: getTotalHabitaciones(),
                                    precio_total: monto,
                                });
                                // Mostrar modal con datos de la reserva
                                setDatosReservaConfirmada({
                                    localizador: localizadorDelPago,
                                    nombre: formData.name,
                                    check_in: rango?.from,
                                    check_out: rango?.to,
                                    cantidad_habitaciones: getTotalHabitaciones(),
                                    precio_total: monto,
                                });
                                setMostrarModalConfirmacion(true);
                                // NO cerrar el drawer - el usuario debe ver el modal y cerrarlo manualmente
                            }}
                            onError={(mensaje) => {
                                setErrorPago(mensaje);
                            }}
                        />
                    </div>
                </div>
            </section>

            <footer className="border-t border-gray-200 mt-6 pt-4">
                <div className="flex items-center justify-between gap-3">
                    <button onClick={volverAtras} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition">
                        Atrás
                    </button>
                </div>
                {errorPago && (
                    <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {errorPago}
                    </div>
                )}
            </footer>

            {/* Modal de confirmación */}
            <ModalConfirmacionReserva
                reserva={datosReservaConfirmada}
                isOpen={mostrarModalConfirmacion}
                onClose={handleResetearReserva}
            />
        </main>
    );
}
