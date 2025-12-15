import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Campo from '@/Components/Campo';
import { ArrowLeftIcon, UserIcon, CalendarIcon, HomeIcon, CurrencyEuroIcon } from '@heroicons/react/24/outline';

export default function EditReserva({ reserva, habitaciones }) {
    const [form, setForm] = useState({
        check_in: reserva.check_in,
        check_out: reserva.check_out,
        status: reserva.status,
        pago: reserva.pago,
        notas: reserva.notas,
        habitacion_ids: reserva.habitaciones.map(h => h.id),
    });

    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [recalculando, setRecalculando] = useState(false);

    const cambiar = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errores[name]) {
            setErrores(prev => ({ ...prev, [name]: null }));
        }
    };

    useEffect(() => {
        if (form.check_in && form.check_out && form.check_in < form.check_out) {
            setRecalculando(true);

            router.reload({
                only: ['habitaciones'],
                data: {
                    check_in: form.check_in,
                    check_out: form.check_out
                },
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setRecalculando(false)
            });
        }
    }, [form.check_in, form.check_out]);

    const toggleHabitacion = (habitacionId) => {
        setForm(prev => ({
            ...prev,
            habitacion_ids: prev.habitacion_ids.includes(habitacionId)
                ? prev.habitacion_ids.filter(id => id !== habitacionId)
                : [...prev.habitacion_ids, habitacionId]
        }));
    };

    const calcularPrecioTotal = () => {
        if (!form.check_in || !form.check_out || form.habitacion_ids.length === 0) return 0;

        const dias = Math.ceil(
            (new Date(form.check_out) - new Date(form.check_in)) / (1000 * 60 * 60 * 24)
        );

        const total = form.habitacion_ids.reduce((sum, habId) => {
            const habitacion = habitaciones.find(h => h.id === habId);
            if (!habitacion) {
                return sum;
            }
            return sum + (parseFloat(habitacion.precio_noche) * dias);
        }, 0);

        return total.toFixed(2);
    };

    const enviar = (e) => {
        e.preventDefault();
        setGuardando(true);

        router.put(`/reservas/${reserva.id}`, form, {
            preserveScroll: true,
            onSuccess: () => {
                router.visit('/panel');
            },
            onError: (errors) => {
                setErrores(errors);
                setGuardando(false);
            },
            onFinish: () => setGuardando(false)
        });
    };

    const cancelar = () => {
        router.visit('/panel');
    };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-base-200 py-4">
                <div className="max-w-7xl mx-auto px-4">
                    {Object.keys(errores).length > 0 && (
                        <div className="toast toast-top toast-end z-50">
                            <div className="alert alert-error shadow-lg">
                                <div>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <h3 className="font-bold">Error de validación</h3>
                                        <div className="text-xs">
                                            {Object.values(errores).map((error, idx) => (
                                                <div key={idx}>{Array.isArray(error) ? error[0] : error}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setErrores({})} className="btn btn-sm btn-ghost">✕</button>
                            </div>
                        </div>
                    )}


                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button onClick={cancelar} className="btn btn-sm btn-circle btn-ghost">
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold">Editar Reserva</h1>
                                <p className="text-sm text-base-content/60 font-mono font-semibold">
                                    {reserva.localizador}
                                </p>
                            </div>
                        </div>

                        <div className={`badge ${
                            reserva.status === 'confirmado' ? 'badge-success' :
                            reserva.status === 'checked_in' ? 'badge-info' :
                            reserva.status === 'checked_out' ? 'badge-primary' :
                            reserva.status === 'cancelado' ? 'badge-error' :
                            'badge-warning'
                        }`}>
                            {reserva.status.replace('_', ' ')}
                        </div>
                    </div>

                    <form onSubmit={enviar} className="space-y-4">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                            <div className="xl:col-span-2 space-y-4">
                                <div className="card bg-base-100 shadow">
                                    <div className="card-body p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <UserIcon className="w-5 h-5" style={{ color: '#920303' }} />
                                            <h3 className="font-bold">Cliente</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="font-semibold text-lg">{reserva.cliente.name}</div>
                                            <div className="text-sm font-mono">{reserva.cliente.email}</div>
                                            <div className="text-sm font-mono">
                                                {reserva.cliente.tipo_documento?.toUpperCase()} {reserva.cliente.numero_documento}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card bg-base-100 shadow">
                                    <div className="card-body p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <CalendarIcon className="w-5 h-5" style={{ color: '#920303' }} />
                                            <h3 className="font-bold">Fechas de Reserva</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Campo id="check_in" label="Check-in" type="date" value={form.check_in} onChange={cambiar} error={errores.check_in}
                                                classNameExtra="font-mono" required/>
                                            <Campo id="check_out" label="Check-out" type="date" value={form.check_out} onChange={cambiar} error={errores.check_out}
                                                classNameExtra="font-mono" required/>
                                        </div>
                                    </div>
                                </div>

                                <div className="card bg-base-100 shadow">
                                    <div className="card-body p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <HomeIcon className="w-5 h-5" style={{ color: '#920303' }} />
                                            <h3 className="font-bold">Habitaciones</h3>
                                        </div>

                                        {recalculando && (
                                            <div className="alert alert-info mb-3">
                                                <span className="loading loading-spinner loading-sm"></span>
                                                <span>Recalculando disponibilidad...</span>
                                            </div>)}

                                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                                            {habitaciones.map(habitacion => {
                                                const isSelected = form.habitacion_ids.includes(habitacion.id);
                                                const esActual = habitacion.es_actual;
                                                return (
                                                    <div
                                                        key={habitacion.id}
                                                        onClick={() => toggleHabitacion(habitacion.id)}
                                                        className={`card cursor-pointer transition-all border-2 ${
                                                            isSelected ? 'bg-red-50 border-[#920303]'
                                                                       : 'bg-base-200 border-transparent hover:border-base-300'}`}>
                                                        <div className="card-body p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <input type="checkbox" checked={isSelected} onChange={() => {}} className="checkbox checkbox-sm"
                                                                    style={{ accentColor: '#920303' }}/>
                                                                <span className="font-bold font-mono">{habitacion.numero}</span>
                                                                {esActual && (
                                                                    <span className="badge badge-xs badge-info">Actual</span>
                                                                )}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs capitalize font-semibold">{habitacion.tipo}</p>
                                                                <div className="text-xs">Cap: <span className="font-mono font-semibold">{habitacion.capacidad}</span></div>
                                                                <div className="font-bold text-sm font-mono" style={{ color: '#920303' }}>
                                                                    €{habitacion.precio_noche}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {form.habitacion_ids.length === 0 && (
                                            <div className="alert alert-warning mt-3">
                                                <span>Selecciona al menos una habitación</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="xl:col-span-1 space-y-4">
                                <div className="card bg-base-100 shadow">
                                    <div className="card-body p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <CurrencyEuroIcon className="w-5 h-5" style={{ color: '#920303' }} />
                                            <h3 className="font-bold">Resumen</h3>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-base-content/70">Habitaciones:</span>
                                                <span className="font-bold text-lg">{form.habitacion_ids.length}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-base-content/70">Noches:</span>
                                                <span className="font-bold text-lg font-mono">
                                                    {Math.ceil((new Date(form.check_out) - new Date(form.check_in)) / (1000 * 60 * 60 * 24))}
                                                </span>
                                            </div>
                                            <div className="divider my-2"></div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-lg">Total:</span>
                                                <span className="text-2xl font-bold text-success font-mono">
                                                    €{calcularPrecioTotal()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card bg-base-100 shadow">
                                    <div className="card-body p-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="label">
                                                    <span className="label-text font-semibold">Estado Reserva</span>
                                                </label>
                                                <select id="status" name="status" value={form.status} onChange={cambiar} className="select select-bordered w-full">
                                                    <option value="pendiente">Pendiente</option>
                                                    <option value="confirmado">Confirmado</option>
                                                    <option value="checked_in">Check-in</option>
                                                    <option value="checked_out">Check-out</option>
                                                    <option value="cancelado">Cancelado</option>
                                                    <option value="no_presentado">No Presentado</option>
                                                </select>
                                                {errores.status && (
                                                    <label className="label">
                                                        <span className="label-text-alt text-error">{errores.status}</span>
                                                    </label>
                                                )}
                                            </div>

                                            <div>
                                                <label className="label">
                                                    <span className="label-text font-semibold">Estado Pago</span>
                                                </label>
                                                <select id="pago" name="pago" value={form.pago} onChange={cambiar} className="select select-bordered w-full">
                                                    <option value="pendiente">Pendiente</option>
                                                    <option value="parcial">Parcial</option>
                                                    <option value="pagado">Pagado</option>
                                                    <option value="devuelto">Devuelto</option>
                                                </select>
                                                {errores.pago && (
                                                    <label className="label">
                                                        <span className="label-text-alt text-error">{errores.pago}</span>
                                                    </label>
                                                )}
                                            </div>

                                            <div>
                                                <label className="label">
                                                    <span className="label-text font-semibold">Notas</span>
                                                </label>
                                                <textarea id="notas" name="notas" value={form.notas || ''} onChange={cambiar} placeholder="Observaciones..." rows={3}
                                                    className="textarea textarea-bordered w-full"/>
                                                {errores.notas && (
                                                    <label className="label">
                                                        <span className="label-text-alt text-error">{errores.notas}</span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card bg-base-100 shadow">
                                    <div className="card-body p-6">
                                        <div className="flex flex-col gap-3">
                                            <PrimaryButton type="submit" disabled={guardando || form.habitacion_ids.length === 0}>
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
