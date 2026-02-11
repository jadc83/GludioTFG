import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import EmpleadoProfile from './EmpleadoProfile';

export default function ProfileDashboard({ empleado = null, habitaciones = [], canViewTareas = false }) {
    const [upcoming, setUpcoming] = useState([]);
    const [completed, setCompleted] = useState([]);
    const [activeCount, setActiveCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const roles = usePage().props?.auth?.user?.roles || [];
    const allowedProfileContainer = empleado || ['admin','encargado','operario','auxiliar'].some(r => roles.includes(r));
    const middleCols = allowedProfileContainer ? 'col-span-1 lg:col-span-2' : 'col-span-1 lg:col-span-3';

    const fetchSummary = async () => {
        if (!canViewTareas) {
            setLoading(false);
            setUpcoming([]);
            setCompleted([]);
            setActiveCount(0);
            return;
        }

        setLoading(true);
        try {
            // upcoming turnos
            const tRes = await fetch('/api/turnos', { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
            let turnos = [];
            if (tRes.ok) {
                const data = await tRes.json();
                const now = new Date();
                const normalize = (s) => {
                    if (!s) return null;
                    let d = new Date(s);
                    if (!isNaN(d)) return d;
                    // try ISO-like
                    try {
                        d = new Date(s.replace(' ', 'T'));
                        if (!isNaN(d)) return d;
                        d = new Date(s.replace(' ', 'T') + 'Z');
                        if (!isNaN(d)) return d;
                    } catch (e) { /* ignore */ }
                    return null;
                };

                // determine current week (Monday..Sunday) as default upcoming range
                const weekStart = (() => {
                    const d = new Date(now);
                    const day = d.getDay(); // 0 Sun .. 6 Sat
                    const diff = (day + 6) % 7; // days since Monday
                    d.setDate(d.getDate() - diff);
                    d.setHours(0,0,0,0);
                    return d;
                })();
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);

                const enriched = (data.turnos || []).map(t => ({ ...t, parsedStart: normalize(t.start), parsedEnd: normalize(t.end) }));

                // Prefer turnos in current week; fallback to future from now
                const inWeek = enriched.filter(t => {
                    const s = t.parsedStart || null;
                    const e = t.parsedEnd || t.parsedStart || null;
                    if (!s || !e) return false;
                    return (s < weekEnd && e >= weekStart);
                }).sort((a,b) => (a.parsedStart ? a.parsedStart.getTime() : 0) - (b.parsedStart ? b.parsedStart.getTime() : 0));

                if (inWeek.length > 0) {
                    turnos = inWeek; // show all in-week turnos
                } else {
                    // fallback to future events
                    turnos = enriched.filter(t => (t.parsedEnd && t.parsedEnd >= now) || (t.parsedStart && t.parsedStart >= now))
                        .sort((a, b) => (a.parsedStart ? a.parsedStart.getTime() : new Date(a.start).getTime()) - (b.parsedStart ? b.parsedStart.getTime() : new Date(b.start).getTime()));
                }

                // group by day for nicer presentation
                const groupByDay = (arr) => {
                    const map = {};
                    (arr || []).forEach(t => {
                        const d = t.parsedStart || t.parsedEnd || (t.start ? new Date(t.start) : null);
                        if (!d) return;
                        const key = d.toISOString().slice(0,10);
                        if (!map[key]) map[key] = { date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), items: [] };
                        map[key].items.push(t);
                    });
                    const days = Object.values(map).sort((a,b) => a.date - b.date);
                    days.forEach(day => day.items.sort((a,b) => (a.parsedStart ? a.parsedStart.getTime() : 0) - (b.parsedStart ? b.parsedStart.getTime() : 0)));
                    return days;
                };

                const upcomingDays = groupByDay(turnos);
                setUpcoming(upcomingDays);

                console.debug('ProfileDashboard turnos fetched', { total: data.turnos?.length || 0, inWeek: inWeek.length, upcomingDays: upcomingDays.length });
            }

            // completed tareas
            const cRes = await fetch('/api/tareas/completed', { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
            let completedData = [];
            if (cRes.ok) {
                const d = await cRes.json();
                completedData = (d.tareas || []).slice(0,5);
            }

            // active tareas count
            const aRes = await fetch('/api/tareas', { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
            let active = 0;
            if (aRes.ok) {
                const ad = await aRes.json();
                active = Array.isArray(ad.tareas) ? ad.tareas.length : 0;
            }

            // We already set grouped upcomingDays above; avoid overwriting with raw turnos
            setCompleted(completedData);
            setActiveCount(active);
        } catch (e) {
            console.error('ProfileDashboard fetch failed', e);
            setUpcoming([]);
            setCompleted([]);
            setActiveCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        const handler = () => fetchSummary();
        window.addEventListener('tareas:updated', handler);
        return () => window.removeEventListener('tareas:updated', handler);
    }, []);



    return (
        <div>
            {/* existing grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: empleado summary + rooms */}
                <div className="col-span-1">
                    {allowedProfileContainer ? (
                        <div className="rounded-xl border border-gray-100 p-4 bg-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold text-gray-800">{empleado?.nombre || empleado?.name || 'Mi perfil'}</div>
                                    {empleado?.departamento ? <div className="text-xs text-gray-500">{empleado.departamento}</div> : null}
                                    {empleado ? (
                                        <div className="mt-2 text-xs text-gray-600">Rol: <span className="font-semibold">{empleado?.role || (empleado?.roles && empleado.roles[0])}</span></div>
                                    ) : null}
                                </div>
                                <div>
                                    {/* Mostrar 'Editar' solo si el usuario es admin o tiene empleado asociado */}
                                    {((empleado) || (roles.includes('admin'))) && (
                                        <Link href="/profile?tab=seguridad" className="text-xs border border-gray-200 px-3 py-1 rounded">Editar</Link>
                                    )}
                                </div>
                            </div>

                            {empleado ? (
                                canViewTareas ? (
                                    <>
                                        <div className="mt-4 text-sm text-gray-700">
                                            <div><span className="font-bold">Tareas activas:</span> {activeCount}</div>
                                            <div className="mt-2"><span className="font-bold">Próximos turnos:</span> {upcoming.length}</div>
                                        </div>

                                        {/* Reuse EmpleadoProfile compacted */}
                                        <div className="mt-4">
                                            <EmpleadoProfile habitaciones={habitaciones} showAssignState={false} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-4 text-sm text-gray-500">No tienes acceso a tareas o turnos.</div>
                                )
                            ) : null}
                        </div>
                    ) : null}
                </div>

                {/* Middle: upcoming turnos */}
                {canViewTareas ? (
                    <div className={middleCols}>
                        <div className="rounded-xl border border-gray-100 p-4 bg-white mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="font-bold text-sm text-gray-700">Próximos turnos</div>
                                <Link href="#" className="text-xs text-gray-500">Ver calendario</Link>
                            </div>
                            {loading ? (
                                <div className="p-4 text-sm text-gray-500">Cargando...</div>
                            ) : upcoming.length === 0 ? (
                                <div className="p-4 text-sm text-gray-500">No hay turnos próximos.</div>
                            ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {upcoming.map(day => (
                                        <div key={day.date.toISOString()} className="mb-2">
                                            <div className="text-xs font-semibold text-gray-600 mb-2">{new Date(day.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                                            <div className="space-y-2">
                                                {day.items.map(t => {
                                                    const displayTitle = (t.title && t.title !== 'Turno') ? t.title : (t.actividad && t.actividad !== 'Turno' ? t.actividad : null);
                                                    const start = (t.parsedStart || new Date(t.start));
                                                    const end = (t.parsedEnd || new Date(t.end));
                                                    return (
                                                        <div key={t.id || (t.start + t.title)} className="p-2 rounded border border-gray-100 bg-gray-50 flex items-center justify-between">
                                                            <div>
                                                                {displayTitle && <div className="text-sm font-semibold">{displayTitle}</div>}
                                                                <div className="text-xs text-gray-500">{start.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})} — {end.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}{t.meta && t.meta.habitacion ? ` · Hab. ${t.meta.habitacion}` : ''}</div>
                                                            </div>
                                                            <div>
                                                                {t.id && <button onClick={async () => {
                                                                    try {
                                                                        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                                                                        const res = await fetch(`/api/turnos/${t.id}`, { method: 'DELETE', credentials: 'same-origin', headers: { 'X-CSRF-TOKEN': csrf, 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
                                                                        if (!res.ok) { console.error('delete failed'); return; }
                                                                        fetchSummary();
                                                                        window.dispatchEvent(new Event('tareas:updated'));
                                                                        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Turno eliminado', type: 'success' } }));
                                                                    } catch (e) { console.error(e); }
                                                                }} className="text-xs bg-rose-500 text-white px-3 py-1 rounded">Eliminar</button>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl border border-gray-100 p-4 bg-white">
                            <div className="flex items-center justify-between mb-3">
                                <div className="font-bold text-sm text-gray-700">Últimas tareas completadas</div>
                                <Link href="/profile/tareas/completadas" className="text-xs text-gray-500">Ver historial</Link>
                            </div>
                            {loading ? (
                                <div className="p-4 text-sm text-gray-500">Cargando...</div>
                            ) : completed.length === 0 ? (
                                <div className="p-4 text-sm text-gray-500">Aún no has completado tareas.</div>
                            ) : (
                                <div className="space-y-2">
                                    {completed.map(c => (
                                        <div key={c.id} className="p-3 rounded border border-gray-100 bg-gray-50">
                                            <div className="text-sm font-semibold">{c.descripcion}</div>
                                            <div className="text-xs text-gray-500">{c.habitacion ? `Hab. ${c.habitacion.numero}` : ''} — {new Date(c.completed_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null }
            </div>
        </div>
    );
}
