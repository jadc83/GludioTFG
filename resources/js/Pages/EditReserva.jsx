import Campo from '@/Components/Campo';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { calcularNoches, formatearMoneda } from '@/utils/formatters';
import { calcularPrecioDinamico, obtenerPrecioBasePorTipo } from '@/utils/precios';
import { ArrowLeftIcon, CalendarIcon, CurrencyEuroIcon, HomeIcon, UserIcon} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ExtenderReserva from '@/Components/reservas/utilidades/ExtenderReserva';
import FormularioPago from '@/Components/pagos/FormularioPago';

export default function EditReserva({ reserva, habitaciones }) {
    const [form, setForm] = useState({
        check_in: reserva.check_in,
        check_out: reserva.check_out,
        status: reserva.status,
        pago: reserva.pago,
        notas: reserva.notas,
        habitacion_ids: reserva.habitaciones.map((h) => h.id),
    });

    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [recalculando, setRecalculando] = useState(false);
    const [mostrarExtender, setMostrarExtender] = useState(false);
    const [mostrarPago, setMostrarPago] = useState(false);
    const [montoAdicional, setMontoAdicional] = useState(0);
    const [pendienteGuardar, setPendienteGuardar] = useState(null);

    const manejarExtensionExitosa = (nuevoCheckOut) => {
        if (nuevoCheckOut) {
            setForm((prev) => ({
                ...prev,
                check_out: nuevoCheckOut,
            }));
        }
        setMostrarExtender(false);
    };

    const cambiar = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errores[name]) {
            setErrores((prev) => ({ ...prev, [name]: null }));
        }
    };

    useEffect(() => {
        if (form.check_in && form.check_out && form.check_in < form.check_out) {
            setRecalculando(true);

            router.reload({
                only: ['habitaciones'],
                data: {
                    check_in: form.check_in,
                    check_out: form.check_out,
                },
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setRecalculando(false),
            });
        }
    }, [form.check_in, form.check_out]);

    const toggleHabitacion = (habitacionId) => {
        setForm((prev) => ({
            ...prev,
            habitacion_ids: prev.habitacion_ids.includes(habitacionId)
                ? prev.habitacion_ids.filter((id) => id !== habitacionId)
                : [...prev.habitacion_ids, habitacionId],
        }));
    };

    const calcularPrecioTotal = () => {
        if (
            !form.check_in ||
            !form.check_out ||
            form.habitacion_ids.length === 0
        )
            return 0;

        const total = form.habitacion_ids.reduce((sum, habId) => {
            const habitacion = habitaciones.find((h) => h.id === habId);
            if (!habitacion) {
                return sum;
            }
            // Usar calcularPrecioDinamico del frontend para garantizar consistencia
            const precioDinamico = calcularPrecioDinamico(
                habitacion,
                form.check_in,
                form.check_out
            );
            return sum + precioDinamico;
        }, 0);

        return total.toFixed(2);
    };

    const enviar = (e) => {
        e.preventDefault();

        const nuevoTotal = parseFloat(calcularPrecioTotal());
        const diferencia = nuevoTotal - parseFloat(reserva.precio_total);

        // Si la reserva está pagada y hay incremento de precio, mostrar pago primero
        if (reserva.pago === 'pagado' && diferencia > 0) {
            setMontoAdicional(diferencia);
            setPendienteGuardar(form);
            setMostrarPago(true);
            return;
        }

        // Si no hay pago requerido, guardar directamente
        guardarReserva(form);
    };

    const guardarReserva = (formData) => {
        setGuardando(true);

        router.put(`/reservas/${reserva.id}`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                router.visit('/panel');
            },
            onError: (errors) => {
                setErrores(errors);
                setGuardando(false);
                setMostrarPago(false);
            },
            onFinish: () => setGuardando(false),
        });
    };

    const handlePagoExitoso = () => {
        setMostrarPago(false);
        if (pendienteGuardar) {
            guardarReserva(pendienteGuardar);
        }
    };

    const handlePagoError = (err) => {
        setErrores({ pago: err });
        setMostrarPago(false);
    };

    const cancelar = () => {
        router.visit('/panel');
    };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-gris py-4">
                <div className="mx-auto max-w-7xl px-4">
                    {Object.keys(errores).length > 0 && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                            <h3 className="font-bold text-red-700 mb-2">Error de validación</h3>
                            <div className="text-red-600 text-sm space-y-1">
                                {Object.values(errores).map(
                                    (error, idx) => (
                                        <div key={idx}>
                                            {Array.isArray(error)
                                                ? error[0]
                                                : error}
                                        </div>
                                    ),
                                )}
                            </div>
                            <button onClick={() => setErrores({})}
                                className="text-red-500 hover:text-red-700 text-xs mt-2 underline" >
                                Descartar
                            </button>
                        </div>
                    )}

                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={cancelar} className="btn btn-ghost btn-sm btn-circle">
                                <ArrowLeftIcon className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    Editar Reserva
                                </h1>
                                <p className="text-base-content/60 font-mono text-sm font-semibold">
                                    {reserva.localizador}
                                </p>
                            </div>
                        </div>

                        <div className={`badge ${ reserva.status === 'confirmado' ? 'badge-success' : reserva.status === 'checked_in'
                                        ? 'badge-info' : reserva.status === 'checked_out'
                                        ? 'badge-primary' : reserva.status === 'cancelado'
                                        ? 'badge-error' : 'badge-warning'  }`} >
                            {reserva.status.replace('_', ' ')}
                        </div>
                    </div>

                    <form onSubmit={enviar} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                            <div className="space-y-4 xl:col-span-2">
                                <div className="card bg-white shadow-md border border-gray-200">
                                    <div className="card-body p-6">
                                        <div className="mb-4 flex items-center gap-2">
                                            <UserIcon className="h-5 w-5 accent-1366" />
                                            <h3 className="font-bold">Cliente</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-lg font-semibold">
                                                {reserva.cliente.name}
                                            </div>
                                            <div className="font-mono text-sm">
                                                {reserva.cliente.email}
                                            </div>
                                            <div className="font-mono text-sm">
                                                {reserva.cliente.tipo_documento?.toUpperCase()}{' '}
                                                {reserva.cliente.numero_documento}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card bg-white shadow-md border border-gray-200">
                                    <div className="card-body p-6">
                                        <div className="mb-4 flex items-center gap-2">
                                            <CalendarIcon className="h-5 w-5 accent-1366" />
                                            <h3 className="font-bold">Fechas de Reserva</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <Campo id="check_in" label="Check-in" type="date" value={form.check_in} onChange={cambiar} error={errores.check_in}
                                                classNameExtra="font-mono" required/>
                                            <Campo id="check_out" label="Check-out" type="date" value={form.check_out} onChange={cambiar} error={errores.check_out}
                                                classNameExtra="font-mono" required/>
                                        </div>
                                    </div>
                                </div>

                                <div className="card bg-white shadow-md border border-gray-200">
                                    <div className="card-body p-6">
                                        <div className="mb-4 flex items-center gap-2">
                                            <HomeIcon className="h-5 w-5 accent-1366" />
                                            <h3 className="font-bold">Habitaciones</h3>
                                        </div>

                                        {recalculando && (
                                            <div className="alert alert-info mb-3">
                                                <span className="loading loading-spinner loading-sm"></span>
                                                <span>Recalculando disponibilidad...</span>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                                            {habitaciones.map((habitacion) => {
                                                const isSelected = form.habitacion_ids.includes(habitacion.id);
                                                const esActual = habitacion.es_actual;
                                                return (
                                                    <div key={habitacion.id} onClick={() => toggleHabitacion( habitacion.id)
                                                        }
                                                        className={`card cursor-pointer border-2 transition-all ${
                                                            isSelected ? 'border-[#7a0202] bg-red-50' : 'border-transparent bg-gris hover:border-gray-300'
                                                        }`}>
                                                        <div className="card-body p-3">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <input type="checkbox" checked={isSelected} onChange={() => {}} className="checkbox checkbox-sm accent-checkbox-1366" />
                                                                <span className="font-mono font-bold">
                                                                    { habitacion.numero }
                                                                </span>
                                                                {esActual && (
                                                                    <span className="badge badge-info badge-xs">
                                                                        Actual
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-semibold capitalize"> { habitacion.tipo } </p>
                                                                <div className="text-xs"> Capacidad:{' '}
                                                                    <span className="font-mono font-semibold">{ habitacion.capacidad}</span>
                                                                </div>
                                                                {form.check_in && form.check_out ? (
                                                                    <>
                                                                        <div className="font-mono text-sm font-bold accent-1366">
                                                                            { (calcularPrecioDinamico(habitacion, form.check_in, form.check_out) / calcularNoches(form.check_in, form.check_out)).toFixed(2) } €/noche
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            Total: {calcularPrecioDinamico(habitacion, form.check_in, form.check_out)} €
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="font-mono text-sm font-bold accent-1366">
                                                                        { obtenerPrecioBasePorTipo(habitacion.tipo) } €/noche
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {form.habitacion_ids.length === 0 && (
                                            <div className="alert alert-warning mt-3">
                                                <span> Selecciona al menos una habitación </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 xl:col-span-1">
                                <div className="card bg-white shadow-md border border-gray-200">
                                    <div className="card-body p-6">
                                        <div className="mb-4 flex items-center gap-2">
                                            <CurrencyEuroIcon className="h-5 w-5 accent-1366" />
                                            <h3 className="font-bold">Resumen</h3>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-base-content/70">
                                                    Habitaciones:
                                                </span>
                                                <span className="text-lg font-bold">
                                                    {form.habitacion_ids.length}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-base-content/70">
                                                    Noches:
                                                </span>
                                                <span className="font-mono text-lg font-bold">
                                                    {calcularNoches(new Date(form.check_in), new Date(form.check_out))}
                                                </span>
                                            </div>
                                            <div className="divider my-2"></div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold">Total:</span>
                                                <span className="font-mono text-2xl font-bold text-success">
                                                    €{calcularPrecioTotal()}
                                                </span>
                                            </div>
                                            <button type="button" onClick={() => setMostrarExtender(true)} className="w-full py-3 px-4 rounded-lg font-semibold mt-4 btn-accent-1366">
                                                Ampliar reserva
                                            </button>

                                            {mostrarExtender && (
                                                <div className="mt-4">
                                                     <ExtenderReserva reserva={reserva} onClose={manejarExtensionExitosa}/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="card bg-white shadow-md border border-gray-200">
                                    <div className="card-body p-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="label">
                                                    <span className="label-text font-semibold">
                                                        Estado Reserva
                                                    </span>
                                                </label>
                                                <select id="status" name="status" value={form.status} onChange={cambiar}
                                                    className="select-bordered select w-full border-gray-300 focus:border-burgundy">
                                                    <option value="pendiente">Pendiente</option>
                                                    <option value="confirmado">Confirmado</option>
                                                    <option value="checked_in">Check-in</option>
                                                    <option value="checked_out">Check-out</option>
                                                    <option value="cancelado">Cancelado</option>
                                                    <option value="no_presentado">No Presentado</option>
                                                </select>
                                                {errores.status && (
                                                    <label className="label">
                                                        <span className="label-text-alt text-error">
                                                            {errores.status}
                                                        </span>
                                                    </label>
                                                )}
                                            </div>

                                            <div>
                                                <label className="label">
                                                    <span className="label-text font-semibold">
                                                        Estado Pago
                                                    </span>
                                                </label>
                                                <select id="pago" name="pago" value={form.pago} onChange={cambiar}
                                                    className="select-bordered select w-full border-gray-300 focus:border-burgundy">
                                                    <option value="pendiente">
                                                        Pendiente
                                                    </option>
                                                    <option value="parcial">
                                                        Parcial
                                                    </option>
                                                    <option value="pagado">
                                                        Pagado
                                                    </option>
                                                    <option value="devuelto">
                                                        Devuelto
                                                    </option>
                                                </select>
                                                {errores.pago && (
                                                    <label className="label">
                                                        <span className="label-text-alt text-error">
                                                            {errores.pago}
                                                        </span>
                                                    </label>
                                                )}
                                            </div>

                                            <div>
                                                <label className="label">
                                                    <span className="label-text font-semibold">
                                                        Notas
                                                    </span>
                                                </label>
                                                <textarea id="notas" name="notas" value={form.notas || ''} onChange={cambiar}
                                                    placeholder="Observaciones..." rows={3} className="textarea-bordered textarea w-full border-gray-300 focus:border-burgundy"/>
                                                {errores.notas && (
                                                    <label className="label">
                                                        <span className="label-text-alt text-error">
                                                            {errores.notas}
                                                        </span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card bg-white shadow-md border border-gray-200">
                                    <div className="card-body p-6">
                                        <div className="flex flex-col gap-3">
                                            <PrimaryButton type="submit" disabled={ guardando || form.habitacion_ids.length === 0 } >
                                                {guardando ? 'Guardando...' : 'Guardar Cambios'}
                                            </PrimaryButton>
                                            <SecondaryButton type="button" onClick={cancelar}>
                                                Cancelar
                                            </SecondaryButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>

                    {mostrarPago && montoAdicional > 0 && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                                <h2 className="text-2xl font-bold mb-4">Pago Adicional Requerido</h2>
                                <p className="text-gray-600 mb-4">
                                    Los cambios en la reserva requieren un pago adicional de:
                                </p>
                                <div className="bg-gris p-4 rounded-lg mb-4">
                                    <div className="text-3xl font-bold text-burgundy text-center">
                                        €{montoAdicional.toFixed(2)}
                                    </div>
                                </div>
                                <FormularioPago monto={montoAdicional} onPagoExitoso={handlePagoExitoso} onError={handlePagoError}
                                    reservaData={{ reserva_id: reserva.id, es_edicion_pago: true}} />
                                <button type="button" onClick={() => { setMostrarPago(false); setPendienteGuardar(null);}}
                                    className="w-full mt-3 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
