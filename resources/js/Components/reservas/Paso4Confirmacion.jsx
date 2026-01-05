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
    localizador
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
        try {
            document.getElementById('drawer-toggle').checked = false;
        } catch (e) {
            void e;
        }
    };
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
                {mostrarFormularioPago && (
                    <div className="card bg-white p-6 shadow-md mb-4">
                        <h4 className="titulo-rojo mb-4 text-center font-bold">Datos de pago</h4>
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
                                setMostrarFormularioPago(false);
                                // NO cerrar el drawer - el usuario debe ver el modal y cerrarlo manualmente
                            }}
                            onError={(mensaje) => {
                                setErrorPago(mensaje);
                            }}
                        />
                    </div>
                )}

                <div className="card bg-white p-6 shadow-md">
                    <table className="w-full text-sm">
                        <tbody>
                            {localizador && renderRow('Identificador de Reserva:', <span className="font-mono font-bold text-blue-600">{localizador}</span>)}
                            {renderRow('Nombre del Huésped:', formData.name)}
                            {renderRow('Fechas:', `${rango?.from?.toLocaleDateString('es-ES')} - ${rango?.to?.toLocaleDateString('es-ES')}`)}
                            <tr>
                                <th className="py-3 pr-4 text-left align-top font-semibold text-gray-700">Habitaciones:</th>
                                <td className="py-3 text-left">
                                    {Object.entries(habitacionesSeleccionadas).filter(([, r]) => r.cantidad > 0).map(([tipo, r]) => (
                                        <div key={tipo} className="mb-1.5">
                                            {getIcono(tipo)} <strong>{r.cantidad}x {tipo}</strong> ({r.personas || 1} {(r.personas || 1) === 1 ? 'huésped' : 'huéspedes'})
                                        </div>
                                    ))}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 rounded-lg border-2 border-green-300 bg-green-50 p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-800">Monto a pagar:</span>
                        <span className="text-2xl font-bold text-green-600">{monto.toFixed(2)} €</span>
                    </div>
                </div>
            </section>

            <footer className="border-t border-gray-300 bg-gris py-3">
                <div className="flex items-center justify-between gap-3">
                    <PrimaryButton onClick={volverAtras} disabled={mostrarFormularioPago}>Atrás</PrimaryButton>
                    {!mostrarFormularioPago && (
                        <PrimaryButton onClick={() => setMostrarFormularioPago(true)}>
                            Confirmar y Pagar
                        </PrimaryButton>
                    )}
                </div>
                {errorPago && (
                    <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                        {errorPago}
                    </div>
                )}
            </footer>

            {/* Modal de confirmación */}
            <ModalConfirmacionReserva
                reserva={datosReservaConfirmada}
                isOpen={mostrarModalConfirmacion}
                onClose={() => {
                    setMostrarModalConfirmacion(false);
                    handleCerrarDrawer();
                }}
            />
        </main>
    );
}
