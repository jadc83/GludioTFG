import Campo from '@/Components/formulario/Campo';
import PrimaryButton from '@/Components/UI/PrimaryButton';
import SecondaryButton from '@/Components/UI/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { calcularNoches, formatearMoneda } from '@/utils/formatters';
import { usePage } from '@inertiajs/react';
import { ArrowLeftIcon, CalendarIcon, CurrencyEuroIcon, HomeIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ExtenderReserva from '@/Components/reservas/utilidades/ExtenderReserva';
import FormularioPago from '@/Components/pagos/FormularioPago';

export default function EditReserva({ reserva, habitaciones }) {
    const { props } = usePage();
    const tiposHabitacion = props.tiposHabitacion || {};

    const obtenerPrecioBasePorTipo = (tipo) => {
        const key = tipo?.toLowerCase();
        return (tiposHabitacion[key] && tiposHabitacion[key].precio_base) ? tiposHabitacion[key].precio_base : 0;
    };

    const precioMod = (habitacionOPrecio, checkIn, checkOut) => {
        let precioBase;
        let tipo = null;

        if (typeof habitacionOPrecio === 'object' && habitacionOPrecio.tipo) {
            tipo = habitacionOPrecio.tipo;
        }

        precioBase = obtenerPrecioBasePorTipo(tipo);

        if (!precioBase || !checkIn || !checkOut) {
            return precioBase || 0;
        }

        let total = 0;
        let fecha = new Date(checkIn);
        const fechaFin = new Date(checkOut);

        while (fecha < fechaFin) {
            let modificador = 1.0;

            const mes = fecha.getMonth() + 1;
            const dia = fecha.getDate();
            if (mes === 7 || mes === 8 || (mes === 12 && dia >= 20)) {
                modificador *= 1.5;
            } else if ((mes === 3 || mes === 4) && dia >= 15 && dia <= 31) {
                modificador *= 1.2;
            }

            if (fecha.getDay() === 0 || fecha.getDay() === 6) {
                modificador *= 1.25;
            }

            const fechaFormato = `${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const festivos = [
                '01-01',
                '01-06',
                '05-01',
                '08-15',
                '10-12',
                '11-01',
                '12-25',
            ];
            if (festivos.includes(fechaFormato)) {
                modificador *= 1.5;
            }

            total += precioBase * modificador;
            fecha.setDate(fecha.getDate() + 1);
        }

        return Math.round(total);
    };
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
    const [toast, setToast] = useState(null); // { message, type }
    const [refundInfo, setRefundInfo] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4500);
    };

    const manejarExtensionExitosa = (nuevoCheckOut) => {
        if (nuevoCheckOut) {
            setForm((prev) => ({ ...prev, check_out: nuevoCheckOut }));
        }
        setMostrarExtender(false);
    };

    const cambiar = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errores[name]) setErrores((prev) => ({ ...prev, [name]: null }));
    };

    useEffect(() => {
        if (form.check_in && form.check_out && form.check_in < form.check_out) {
            setRecalculando(true);
            router.reload({ only: ['habitaciones'], data: { check_in: form.check_in, check_out: form.check_out }, preserveState: true, preserveScroll: true, onFinish: () => setRecalculando(false) });
        }
    }, [form.check_in, form.check_out]);

    const toggleHabitacion = (habitacionId) => {
        setForm((prev) => ({ ...prev, habitacion_ids: prev.habitacion_ids.includes(habitacionId) ? prev.habitacion_ids.filter((id) => id !== habitacionId) : [...prev.habitacion_ids, habitacionId] }));
    };

    const calcularPrecioTotal = () => {
        if (!form.check_in || !form.check_out || form.habitacion_ids.length === 0) return 0;
        const total = form.habitacion_ids.reduce((sum, habId) => {
            const habitacion = habitaciones.find((h) => h.id === habId);
            if (!habitacion) return sum;
            const precioDinamico = precioMod(habitacion, form.check_in, form.check_out);
            return sum + precioDinamico;
        }, 0);
        return total.toFixed(2);
    };

    const enviar = async (e) => {
        e.preventDefault();
        setGuardando(true);

        // Preparar payload para calcular precio en servidor
        const payload = {
            check_in: form.check_in,
            check_out: form.check_out,
            habitaciones: form.habitacion_ids.map(id => {
                const hab = habitaciones.find(h => h.id === id) || {};
                return { tipo: hab.tipo || 'doble', cantidad: 1 };
            }),
            tarifas: [],
        };

        try {
            // 1) Pedir al servidor el nuevo total para esta selección
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const precioRes = await fetch('/reservas/calcular-precio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify(payload),
            });
            const precioBody = await precioRes.json().catch(() => ({}));
            if (!precioRes.ok || !precioBody) {
                const msg = precioBody?.error || 'Error calculando precio en servidor';
                showToast(msg, 'error');
                setGuardando(false);
                return;
            }

            const nuevoTotal = Number(precioBody.total || precioBody.data?.total || precioBody?.total || 0);

            // 2) Obtener la reserva actual desde el servidor para comparar contra el valor authoritative
            const buscarRes = await fetch(`/reservas/buscar/${encodeURIComponent(reserva.localizador)}`);
            const buscarBody = await buscarRes.json().catch(() => ({}));
            const viejoTotal = buscarBody?.reserva?.precio_total ?? Number(reserva.precio_total || 0);
            const pagoStatus = buscarBody?.reserva?.pago ?? reserva.pago;

            const rawDiff = nuevoTotal - Number(viejoTotal);
            const diferencia = Number(rawDiff.toFixed(2));

            // Si la diferencia es esencialmente 0 en servidor, proceder sin coste
            if (Math.abs(rawDiff) < 0.005) {
                await guardarReserva(form);
                setGuardando(false);
                return;
            }

            // Si la reserva está pagada (según servidor) y el total sube, solicitar pago adicional
            if (String(pagoStatus).toLowerCase() === 'pagado' && diferencia > 0) {
                setMontoAdicional(diferencia);
                setPendienteGuardar(form);
                setMostrarPago(true);
                setGuardando(false);
                return;
            }

            // Si baja el precio y hay dinero pagado, el backend procesará el reembolso al guardar
            await guardarReserva(form);
            setGuardando(false);
        } catch (err) {
            console.error('Error al decidir pago/reembolso:', err);
            showToast('Error al procesar cambios de reserva', 'error');
            setGuardando(false);
        }
    };

    const guardarReserva = async (formData) => {
        setGuardando(true);
        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

        try {
            const res = await fetch(`/reservas/${reserva.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify(formData),
            });

            const body = await res.json().catch(() => ({}));

            if (!res.ok) {
                const msg = body?.message || body?.error || 'Error al guardar reserva';
                setErrores(body?.errors || {});
                showToast(msg, 'error');
                setGuardando(false);
                setMostrarPago(false);
                throw new Error(msg);
            }

            // Éxito: manejar refund o mensaje y recargar solo cuando el usuario cierre el modal o tras un pequeño delay
            if (body?.refund && body.refund.amount) {
                setRefundInfo(body.refund);
                showToast(`Se ha solicitado un reembolso parcial de €${Number(body.refund.amount).toFixed(2)}`, 'success');
                // NO recargamos automáticamente; esperaremos a que el usuario cierre el modal
            } else {
                showToast(body?.message || 'Reserva actualizada', 'success');
                // Pequeño delay para que el usuario vea el toast antes de recargar
                setTimeout(() => { router.reload(); }, 900);
            }

            setGuardando(false);
            setMostrarPago(false);

            return body;
        } catch (err) {
            setGuardando(false);
            setMostrarPago(false);
            throw err;
        }
    };

    const handlePagoExitoso = () => { setMostrarPago(false); if (pendienteGuardar) guardarReserva(pendienteGuardar); };
    const handlePagoError = (err) => { setErrores({ pago: err }); setMostrarPago(false); };
    const cancelar = () => { router.visit('/panel'); };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-gris py-4">
                <div className="mx-auto max-w-7xl px-4">
                    {Object.keys(errores).length > 0 && (<div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded"><h3 className="font-bold text-red-700 mb-2">Error de validación</h3><div className="text-red-600 text-sm space-y-1">{Object.values(errores).map((error, idx) => (<div key={idx}>{Array.isArray(error) ? error[0] : error}</div>))}</div><button onClick={() => setErrores({})} className="text-red-500 hover:text-red-700 text-xs mt-2 underline">Descartar</button></div>)}

                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3"><button onClick={cancelar} className="btn btn-ghost btn-sm btn-circle"><ArrowLeftIcon className="h-5 w-5" /></button><div><h1 className="text-2xl font-bold">Editar Reserva</h1><p className="text-base-content/60 font-mono text-sm font-semibold">{reserva.localizador}</p></div></div>
                        <div className={`badge ${ reserva.status === 'confirmado' ? 'badge-success' : reserva.status === 'checked_in' ? 'badge-info' : reserva.status === 'checked_out' ? 'badge-primary' : reserva.status === 'cancelado' ? 'badge-error' : 'badge-warning' }`}>{reserva.status.replace('_', ' ')}</div>
                    </div>

                    <form onSubmit={enviar} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                            <div className="space-y-4 xl:col-span-2">
                                <div className="card bg-white shadow-md border border-gray-200"><div className="card-body p-6"><div className="mb-4 flex items-center gap-2"><HomeIcon className="h-5 w-5 accent-1366" /><h3 className="font-bold">Habitaciones</h3></div>
                                        {recalculando && (<div className="alert alert-info mb-3"><span className="loading loading-spinner loading-sm"></span><span>Recalculando disponibilidad...</span></div>)}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">{habitaciones.map((habitacion) => { const isSelected = form.habitacion_ids.includes(habitacion.id); const esActual = habitacion.es_actual; return (<div key={habitacion.id} onClick={() => toggleHabitacion(habitacion.id)} className={`card cursor-pointer border-2 transition-all ${ isSelected ? 'border-[#7a0202] bg-red-50' : 'border-transparent bg-gris hover:border-gray-300' }`}><div className="card-body p-2"><div className="mb-1 flex items-center justify-between"><input type="checkbox" checked={isSelected} onChange={() => {}} className="checkbox checkbox-xs accent-checkbox-1366" /><span className="font-mono text-sm font-bold">{ habitacion.numero }</span>{esActual && (<span className="badge badge-info badge-xs">Actual</span>)}</div><div className="space-y-1"><p className="text-[11px] font-semibold capitalize"> { habitacion.tipo } </p>{form.check_in && form.check_out ? (<><div className="flex items-center justify-between"><div className="font-mono text-[11px] font-semibold accent-1366">{ (precioMod(habitacion, form.check_in, form.check_out) / calcularNoches(form.check_in, form.check_out)).toFixed(2) } €/noche</div><div className="text-[11px] text-gray-500 font-medium">Total: {precioMod(habitacion, form.check_in, form.check_out)} €</div></div></>) : (<div className="font-mono text-[11px] font-semibold accent-1366">{ obtenerPrecioBasePorTipo(habitacion.tipo) } €/noche</div>)}</div></div></div>); })}</div>
                                        {form.habitacion_ids.length === 0 && (<div className="alert alert-warning mt-3"><span> Selecciona al menos una habitación </span></div>)}
                                    </div></div>
                            </div>

                            <div className="space-y-4 xl:col-span-1">
                                <div className="card bg-gris shadow-md border border-gray-200"><div className="card-body p-6"><div className="mb-4 flex items-center gap-2"><CurrencyEuroIcon className="h-5 w-5 accent-1366" /><h3 className="font-bold">Resumen</h3></div>
                                        <div className="space-y-3"><div className="grid grid-cols-2 gap-2 mb-2"><Campo id="check_in" label="Entrada" type="date" value={form.check_in} onChange={cambiar} error={errores.check_in} sinEstilosPorDefecto={true} clase="w-full text-sm border-gray-300 rounded-md px-2 py-1" /><Campo id="check_out" label="Salida" type="date" value={form.check_out} onChange={cambiar} error={errores.check_out} sinEstilosPorDefecto={true} clase="w-full text-sm border-gray-300 rounded-md px-2 py-1" /></div>
                                            <div className="mb-2"><div className="font-semibold text-sm">{reserva.cliente.name}</div><div className="text-xs font-mono text-gray-600">{reserva.cliente.email}</div><div className="text-xs font-mono text-gray-600">{reserva.cliente.tipo_documento?.toUpperCase()}{' '}{reserva.cliente.numero_documento}</div></div>
                                            <div className="flex items-center justify-between"><span className="text-base-content/70">Habitaciones:</span><span className="text-lg font-bold">{form.habitacion_ids.length}</span></div>
                                            <div className="flex items-center justify-between"><span className="text-base-content/70">Noches:</span><span className="font-mono text-lg font-bold">{calcularNoches(new Date(form.check_in), new Date(form.check_out))}</span></div>
                                            <div className="divider my-2"></div>
                                            <div className="flex items-center justify-between"><span className="text-lg font-bold">Total:</span><span className="font-mono text-2xl font-bold text-success">€{calcularPrecioTotal()}</span></div>
                                            <button type="button" onClick={() => setMostrarExtender(true)} className="w-full py-3 px-4 rounded-lg font-semibold mt-4 btn-accent-1366">Ampliar reserva</button>
                                            {mostrarExtender && (<div className="mt-4"><ExtenderReserva reserva={reserva} onClose={manejarExtensionExitosa}/></div>)}

                    {/* Refund modal (shown when backend returns refund info) */}
                    {refundInfo && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black opacity-50"></div>
                            <div className="relative max-w-md w-full bg-white rounded-lg p-6 shadow-lg text-center">
                                <h2 className="text-xl font-bold mb-2">Reembolso solicitado</h2>
                                <p className="mb-4">Se ha solicitado un reembolso parcial de <strong>€{Number(refundInfo.amount).toFixed(2)}</strong>. El reembolso se procesará y aparecerá en el estado de pagos.</p>
                                <div className="flex gap-2 justify-center">
                                    <button onClick={() => { setRefundInfo(null); router.reload(); }} className="px-4 py-2 bg-[#7a0202] text-white rounded">Cerrar y ver reserva</button>
                                </div>
                            </div>
                        </div>
                    )}
                                        </div></div></div>

                                <div className="card bg-white shadow-md border border-gray-200"><div className="card-body p-6"><div className="space-y-4"><div><Campo id="status" label="Estado Reserva" as="select" value={form.status} onChange={cambiar} error={errores.status} sinEstilosPorDefecto={true} clase="select-bordered select w-full border-gray-300 focus:border-burgundy"><option value="pendiente">Pendiente</option><option value="confirmado">Confirmado</option><option value="checked_in">Check-in</option><option value="checked_out">Check-out</option><option value="cancelado">Cancelado</option><option value="no_presentado">No Presentado</option></Campo></div>
                                            <div><Campo id="pago" label="Estado Pago" as="select" value={form.pago} onChange={cambiar} error={errores.pago} sinEstilosPorDefecto={true} clase="select-bordered select w-full border-gray-300 focus:border-burgundy"><option value="pendiente">Pendiente</option><option value="parcial">Parcialmente reembolsado</option><option value="pagado">Pagado</option><option value="devuelto">Devuelto</option></Campo></div>
                                            <div><Campo id="notas" label="Notas" as="textarea" rows={3} value={form.notas || ''} onChange={cambiar} error={errores.notas} sinEstilosPorDefecto={true} clase="textarea-bordered textarea w-full border-gray-300 focus:border-burgundy" placeholder="Observaciones..." /></div>
                                        </div></div></div>

                                <div className="card bg-white shadow-md border border-gray-200"><div className="card-body p-6"><div className="flex flex-col gap-3"><PrimaryButton type="submit" disabled={ guardando || form.habitacion_ids.length === 0 } >{guardando ? 'Guardando...' : 'Guardar Cambios'}</PrimaryButton><SecondaryButton type="button" onClick={cancelar}>Cancelar</SecondaryButton></div></div></div>
                            </div>
                        </div>
                    </form>

                    {mostrarPago && montoAdicional > 0 && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8" style={{ minHeight: '520px' }}>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold mb-1">Pago Adicional Requerido</h2>
                                    <button onClick={() => { setMostrarPago(false); setPendienteGuardar(null); }} className="p-1 rounded hover:bg-gray-100"><XMarkIcon className="h-5 w-5 text-gray-600"/></button>
                                </div>

                                <p className="text-gray-600 mb-4">Los cambios en la reserva requieren un pago adicional de:</p>
                                <div className="bg-gris p-4 rounded-lg mb-4">
                                    <div className="text-3xl font-bold text-burgundy text-center">€{montoAdicional.toFixed(2)}</div>
                                </div>

                                <FormularioPago monto={montoAdicional} onPagoExitoso={handlePagoExitoso} onError={handlePagoError} reservaData={{ reserva_id: reserva.id, es_edicion_pago: true}} mostrarAceptacion={true} />

                                <div className="mt-4">
                                    <button type="button" onClick={() => { setMostrarPago(false); setPendienteGuardar(null);}} className="w-full mt-3 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
