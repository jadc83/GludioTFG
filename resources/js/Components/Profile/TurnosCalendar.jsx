import esLocale from '@fullcalendar/core/locales/es';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import useTurnos from '@/hooks/useTurnos';
import ControlesTurnos from './ControlesTurnos';
import DetalleTurno from './DetalleTurno';

export default function TurnosCalendar({ empleado = null }) {
    const calendarRef = useRef(null);
    const empleadoId = empleado?.id || null;
    const { events, setEvents, loading, fetchEvents } = useTurnos(empleadoId);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [titleRange, setTitleRange] = useState('');
    const [selectedTurno, setSelectedTurno] = useState(null);
    const formatTurnoRange = (start, end) => {
        try {
            if (!start || !end) return '';
            const s = new Date(start);
            const e = new Date(end);
            const optsDate = {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
            };
            const dateStr = new Intl.DateTimeFormat('es-ES', optsDate).format(
                s,
            );
            const timeOpts = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            };
            const startTime = new Intl.DateTimeFormat('es-ES', timeOpts).format(
                s,
            );
            const endTime = new Intl.DateTimeFormat('es-ES', timeOpts).format(
                e,
            );
            return `${dateStr} · ${startTime} — ${endTime}`;
        } catch (e) {
            return '';
        }
    };

    const handleEventClick = (info) => {
        const ev = info.event;
        setSelectedTurno({
            id: ev.id,
            title: ev.title,
            starts_at: ev.start ? ev.start.toISOString() : null,
            ends_at: ev.end
                ? ev.end.toISOString()
                : ev.start
                  ? ev.start.toISOString()
                  : null,
            meta: ev.extendedProps?.meta || null,
        });
    };

    const page = usePage();
    const getCsrf = () => window.getCsrfToken?.() || '';

    const deleteSelectedTurno = async () => {
        if (!selectedTurno || !selectedTurno.id) {
            setSelectedTurno(null);
            return;
        }
        try {
            const csrf = getCsrf();
            if (!csrf) console.warn('CSRF token not found when deleting turno');
            const res = await fetch(`/api/turnos/${selectedTurno.id}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'X-XSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
            });
            if (!res.ok) {
                let err = 'No se pudo eliminar el turno';
                try {
                    const j = await res.json();
                    if (j && j.error) err = j.error;
                } catch (e) {
                }
                window.dispatchEvent(
                    new CustomEvent('app-toast', {
                        detail: { message: err, type: 'error' },
                    }),
                );
                console.error('delete turno failed', res.status);
                return;
            }
            setSelectedTurno(null);
            await fetchEvents();
            window.dispatchEvent(new Event('tareas:updated'));
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: { message: 'Turno eliminado', type: 'success' },
                }),
            );
        } catch (e) {
            console.error(e);
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: {
                        message: 'Error al eliminar turno',
                        type: 'error',
                    },
                }),
            );
        }
    };

    // La carga de eventos se delega al hook `useTurnos` (fetchEvents)

    const formatRangeTitle = (start, end) => {
        try {
            const opts = { day: 'numeric', month: 'short' };
            const df = new Intl.DateTimeFormat('es-ES', opts);
            const startStr = df.format(new Date(start));
            // end is exclusive; show previous day
            const endDate = new Date(end);
            endDate.setDate(endDate.getDate() - 1);
            const endStr = df.format(endDate);
            const year = new Date(start).getFullYear();
            return `${startStr} – ${endStr} ${year}`;
        } catch (e) {
            return '';
        }
    };

    useEffect(() => {
        fetchEvents();
        const handler = () => fetchEvents();
        const actionHandler = async (e) => {
            const detail = e?.detail || {};
            if (
                detail?.name === 'undo-clear-turnos' &&
                Array.isArray(detail.payload)
            ) {
                // restore turnos
                for (const t of detail.payload) {
                    try {
                        const csrf = window.getCsrfToken?.() || '';
                        const bodyPayload = {
                            starts_at: t.starts_at,
                            ends_at: t.ends_at,
                            actividad: t.actividad || t.title || 'Turno',
                        };
                        if (empleadoId) bodyPayload.empleado_id = empleadoId;

                        await fetch('/api/turnos', {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Requested-With': 'XMLHttpRequest',
                                Accept: 'application/json',
                                'X-XSRF-TOKEN': csrf,
                            },
                            body: JSON.stringify(bodyPayload),
                        });
                    } catch (e) {
                        console.error('restore failed', e);
                    }
                }
                // refresh
                fetchEvents();
                window.dispatchEvent(
                    new CustomEvent('app-toast', {
                        detail: {
                            message: 'Turnos restaurados',
                            type: 'success',
                        },
                    }),
                );
            }
        };
        window.addEventListener('tareas:updated', handler);
        window.addEventListener('app-toast-action', actionHandler);

        // update title range when dates change
        const calApi = calendarRef.current?.getApi?.();
        const datesHandler = () => {
            const api = calendarRef.current?.getApi?.();
            if (!api) return;
            const start = api.view.activeStart;
            const end = api.view.activeEnd;
            setTitleRange(formatRangeTitle(start, end));
        };
        if (calApi) {
            calApi.on('datesSet', datesHandler);
            // initialize
            datesHandler();
        }

        // also close fullscreen on ESC
        const escHandler = (e) => {
            if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
        };
        window.addEventListener('keydown', escHandler);

        return () => {
            window.removeEventListener('tareas:updated', handler);
            window.removeEventListener('app-toast-action', actionHandler);
            if (calApi) calApi.off('datesSet', datesHandler);
            window.removeEventListener('keydown', escHandler);
        };
    }, [isFullscreen]);

    const [isCreating, setIsCreating] = useState(false);

    const handleSelect = async (selectionInfo) => {
        if (isCreating) return;
        const start = selectionInfo.startStr;
        const end = selectionInfo.endStr;
        // preview selection immediately
        setSelectedTurno({
            title: 'Turno',
            starts_at: start,
            ends_at: end,
            id: null,
        });
            try {
            setIsCreating(true);
            const csrf = getCsrf();
            if (!csrf) console.warn('CSRF token not found when creating turno');
            const bodyPayload = { starts_at: start, ends_at: end, actividad: 'Turno' };
            if (empleadoId) bodyPayload.empleado_id = empleadoId;

            const res = await fetch('/api/turnos', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': csrf,
                },
                body: JSON.stringify(bodyPayload),
            });
            if (!res.ok) {
                let err = 'Error al crear turno';
                try {
                    const j = await res.json();
                    if (j && j.error) err = j.error;
                    } catch (e) {

                    }
                window.dispatchEvent(
                    new CustomEvent('app-toast', {
                        detail: { message: err, type: 'error' },
                    }),
                );
                console.error('create turno failed', res.status);
                return;
            }
            const data = await res.json();
            if (data && data.turno) {
                setSelectedTurno({
                    id: data.turno.id,
                    title: data.turno.actividad || data.turno.title || 'Turno',
                    starts_at: data.turno.starts_at,
                    ends_at: data.turno.ends_at,
                    meta: data.turno.meta || null,
                });
            }
            await fetchEvents();
            window.dispatchEvent(new Event('tareas:updated'));
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: { message: 'Turno creado', type: 'success' },
                }),
            );
        } catch (e) {
            console.error(e);
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: { message: 'Error al crear turno', type: 'error' },
                }),
            );
        } finally {
            setIsCreating(false);
        }
    };

    const handleEventDrop = async (info) => {
        const ev = info.event;
        try {
            const csrf = window.getCsrfToken?.() || '';
            const res = await fetch(`/api/turnos/${ev.id}`, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': csrf,
                },
                body: JSON.stringify({
                    starts_at: ev.start.toISOString(),
                    ends_at: ev.end
                        ? ev.end.toISOString()
                        : ev.start.toISOString(),
                    actividad: ev.title,
                }),
            });
            if (!res.ok) {
                let msg = 'No se pudo actualizar el turno';
                try {
                    const j = await res.json();
                    if (j && j.error) msg = j.error;
                } catch (e) {

                }
                window.dispatchEvent(
                    new CustomEvent('app-toast', {
                        detail: { message: msg, type: 'error' },
                    }),
                );
                // revert visual change by refetching events
                await fetchEvents();
                return;
            }
            await fetchEvents();
            window.dispatchEvent(new Event('tareas:updated'));
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: { message: 'Turno actualizado', type: 'success' },
                }),
            );
        } catch (e) {
            console.error(e);
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: {
                        message: 'Error al actualizar turno',
                        type: 'error',
                    },
                }),
            );
            await fetchEvents();
        }
    };

    const renderEventContent = (arg) => {
        const evt = arg.event;
        const actividad =
            evt.title ||
            (evt.extendedProps && evt.extendedProps.actividad) ||
            'Turno';
        // Format start and end times with leading zeros
        const start = evt.start
            ? new Date(evt.start).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
              })
            : '';
        const end = evt.end
            ? new Date(evt.end).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
              })
            : '';
        const horario = start && end ? `${start} — ${end}` : start || end || '';
        const habitacion =
            evt.extendedProps &&
            evt.extendedProps.meta &&
            evt.extendedProps.meta.habitacion
                ? `Hab. ${evt.extendedProps.meta.habitacion}`
                : null;
        const extra =
            evt.extendedProps &&
            evt.extendedProps.meta &&
            evt.extendedProps.meta.info
                ? evt.extendedProps.meta.info
                : null;

        return (
            <div className="turno-event-content compact">
                <div className="turno-event-row">
                    <div className="turno-event-title truncate">
                        {actividad}
                    </div>
                    <div className="turno-event-time">{horario}</div>
                </div>
                {(habitacion || extra) && (
                    <div className="turno-event-meta">
                        {habitacion}
                        {extra ? (habitacion ? ` · ${extra}` : extra) : ''}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
            <ControlesTurnos
                titleRange={titleRange}
                isFullscreen={isFullscreen}
                onLimpiar={async () => {
                    try {
                        const csrf = getCsrf();
                        if (!csrf) console.warn('CSRF token not found when clearing turnos');
                        const existing = events.map((e) => ({
                            actividad: e.title,
                            starts_at: e.start,
                            ends_at: e.end,
                            meta: e.meta || null,
                        }));
                        let url = '/api/turnos/clear';
                        if (empleadoId) url += `?empleado_id=${encodeURIComponent(empleadoId)}`;
                        const res = await fetch(url, {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Requested-With': 'XMLHttpRequest',
                                Accept: 'application/json',
                                'X-XSRF-TOKEN': csrf,
                            },
                        });
                        if (!res.ok) {
                            let err = 'Error al eliminar turnos';
                            try {
                                const j = await res.json();
                                if (j && j.error) err = j.error;
                            } catch (e) {

                            }
                            window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err, type: 'error' } }));
                            console.error('clear failed', res.status);
                            return;
                        }
                        const data = await res.json();
                        window.dispatchEvent(new Event('tareas:updated'));
                        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Turnos eliminados', type: 'success', action: { name: 'undo-clear-turnos', label: 'Deshacer', payload: data.deleted || existing }, duration: 6000 } }));
                    } catch (e) {
                        console.error(e);
                        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Error al eliminar turnos', type: 'error' } }));
                    }
                }}
                onToggleFullscreen={() => setIsFullscreen((s) => !s)}
            />

            <DetalleTurno selectedTurno={selectedTurno} onClose={() => setSelectedTurno(null)} onDelete={deleteSelectedTurno} formatTurnoRange={formatTurnoRange} />
            <div
                className={
                    isFullscreen ? 'fixed inset-0 z-50 bg-white p-6' : ''
                }
            >
                <FullCalendar
                    ref={calendarRef}
                    plugins={[timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    locale="es"
                    locales={[esLocale]}
                    firstDay={1}
                    // Mostrar día de la semana completo: 'lunes', 'martes', etc.
                    dayHeaderFormat={{ weekday: 'long' }}
                    buttonText={{ today: 'Hoy', week: 'Semana', day: 'Día' }}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'timeGridWeek,timeGridDay',
                    }}
                    selectable={!isCreating}
                    select={handleSelect}
                    events={events}
                    editable={true}
                    eventDrop={handleEventDrop}
                    eventResize={handleEventDrop}
                    eventClick={handleEventClick}
                    eventContent={renderEventContent}
                    eventClassNames={() => ['fc-event-turno']}
                    slotLabelFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    }}
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    }}
                    allDaySlot={false}
                    height={isFullscreen ? '100vh' : 'calc(100vh - 240px)'}
                />
            </div>
        </div>
    );
}
