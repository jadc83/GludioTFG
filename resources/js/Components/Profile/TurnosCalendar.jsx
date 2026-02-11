import React, { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

export default function TurnosCalendar() {
    const calendarRef = useRef(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [titleRange, setTitleRange] = useState('');
    const [selectedTurno, setSelectedTurno] = useState(null);
    const [renderError, setRenderError] = useState(null);
    const formatTurnoRange = (start, end) => {
        try {
            if (!start || !end) return '';
            const s = new Date(start);
            const e = new Date(end);
            const optsDate = { weekday: 'short', day: 'numeric', month: 'short' };
            const dateStr = new Intl.DateTimeFormat('es-ES', optsDate).format(s);
            const timeOpts = { hour: '2-digit', minute: '2-digit', hour12: false };
            const startTime = new Intl.DateTimeFormat('es-ES', timeOpts).format(s);
            const endTime = new Intl.DateTimeFormat('es-ES', timeOpts).format(e);
            return `${dateStr} · ${startTime} — ${endTime}`;
        } catch (e) { return ''; }
    };

    const handleEventClick = (info) => {
        const ev = info.event;
        setSelectedTurno({
            id: ev.id,
            title: ev.title,
            starts_at: ev.start ? ev.start.toISOString() : null,
            ends_at: ev.end ? ev.end.toISOString() : (ev.start ? ev.start.toISOString() : null),
            meta: ev.extendedProps?.meta || null,
        });
    };



    const page = usePage();
    const getCsrf = () => page?.props?.csrf_token || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    const deleteSelectedTurno = async () => {
        if (!selectedTurno || !selectedTurno.id) { setSelectedTurno(null); return; }
        try {
            const csrf = getCsrf();
            if (!csrf) console.warn('CSRF token not found when deleting turno');
            const res = await fetch(`/api/turnos/${selectedTurno.id}`, { method: 'DELETE', credentials: 'same-origin', headers: { 'X-CSRF-TOKEN': csrf, 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
            if (!res.ok) {
                let err = 'No se pudo eliminar el turno';
                try { const j = await res.json(); if (j && j.error) err = j.error; } catch (e) {}
                window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err, type: 'error' } }));
                console.error('delete turno failed', res.status);
                return;
            }
            setSelectedTurno(null);
            await fetchEvents();
            window.dispatchEvent(new Event('tareas:updated'));
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Turno eliminado', type: 'success' } }));
        } catch (e) { console.error(e); window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Error al eliminar turno', type: 'error' } })); }
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/turnos', { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
            if (!res.ok) { setEvents([]); setLoading(false); return; }
            const data = await res.json();
            setEvents((data.turnos || []).map(t => ({ id: t.id, title: t.title, start: t.start, end: t.end, meta: t.meta || null })));
        } catch (e) {
            console.error('fetch turnos failed', e);
            setEvents([]);
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Error al cargar turnos', type: 'error' } }));
        } finally { setLoading(false); }
    };

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
            if (detail?.name === 'undo-clear-turnos' && Array.isArray(detail.payload)) {
                // restore turnos
                for (const t of detail.payload) {
                    try {
                        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                        await fetch('/api/turnos', {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf },
                            body: JSON.stringify({ starts_at: t.starts_at, ends_at: t.ends_at, actividad: t.actividad || t.title || 'Turno' }),
                        });
                    } catch (e) {
                        console.error('restore failed', e);
                    }
                }
                // refresh
                fetchEvents();
                window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Turnos restaurados', type: 'success' } }));
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
        const escHandler = (e) => { if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false); };
        window.addEventListener('keydown', escHandler);

        return () => {
            window.removeEventListener('tareas:updated', handler);
            window.removeEventListener('app-toast-action', actionHandler);
            if (calApi) calApi.off('datesSet', datesHandler);
            window.removeEventListener('keydown', escHandler);
        };
    }, [isFullscreen, events]);

    const [isCreating, setIsCreating] = useState(false);

    const handleSelect = async (selectionInfo) => {
        if (isCreating) return;
        const start = selectionInfo.startStr;
        const end = selectionInfo.endStr;
        // preview selection immediately
        setSelectedTurno({ title: 'Turno', starts_at: start, ends_at: end, id: null });
        try {
            setIsCreating(true);
            const csrf = getCsrf();
            if (!csrf) console.warn('CSRF token not found when creating turno');
            const res = await fetch('/api/turnos', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({ starts_at: start, ends_at: end, actividad: 'Turno' }),
            });
            if (!res.ok) {
                let err = 'Error al crear turno';
                try { const j = await res.json(); if (j && j.error) err = j.error; } catch (e) {}
                window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err, type: 'error' } }));
                console.error('create turno failed', res.status);
                return;
            }
            const data = await res.json();
            if (data && data.turno) {
                setSelectedTurno({ id: data.turno.id, title: data.turno.actividad || data.turno.title || 'Turno', starts_at: data.turno.starts_at, ends_at: data.turno.ends_at, meta: data.turno.meta || null });
            }
            await fetchEvents();
            window.dispatchEvent(new Event('tareas:updated'));
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Turno creado', type: 'success' } }));
        } catch (e) {
            console.error(e);
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Error al crear turno', type: 'error' } }));
        } finally { setIsCreating(false); }
    };

    const handleEventDrop = async (info) => {
        const ev = info.event;
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch(`/api/turnos/${ev.id}`, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({ starts_at: ev.start.toISOString(), ends_at: ev.end ? ev.end.toISOString() : ev.start.toISOString(), actividad: ev.title }),
            });
            if (!res.ok) {
                let msg = 'No se pudo actualizar el turno';
                try { const j = await res.json(); if (j && j.error) msg = j.error; } catch (e) {}
                window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'error' } }));
                // revert visual change by refetching events
                await fetchEvents();
                return;
            }
            await fetchEvents();
            window.dispatchEvent(new Event('tareas:updated'));
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Turno actualizado', type: 'success' } }));
        } catch (e) { console.error(e); window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Error al actualizar turno', type: 'error' } })); await fetchEvents(); }
    };

    const renderEventContent = (arg) => {
        const evt = arg.event;
        const actividad = evt.title || (evt.extendedProps && evt.extendedProps.actividad) || 'Turno';
        // Format start and end times with leading zeros
        const start = evt.start ? new Date(evt.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
        const end = evt.end ? new Date(evt.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
        const horario = start && end ? `${start} — ${end}` : start || end || '';
        const habitacion = (evt.extendedProps && evt.extendedProps.meta && evt.extendedProps.meta.habitacion) ? `Hab. ${evt.extendedProps.meta.habitacion}` : null;
        const extra = (evt.extendedProps && evt.extendedProps.meta && evt.extendedProps.meta.info) ? evt.extendedProps.meta.info : null;

        return (
            <div className="turno-event-content compact">
                <div className="turno-event-row">
                    <div className="turno-event-title truncate">{actividad}</div>
                    <div className="turno-event-time">{horario}</div>
                </div>
                {(habitacion || extra) && (
                    <div className="turno-event-meta">{habitacion}{extra ? (habitacion ? ` · ${extra}` : extra) : ''}</div>
                )}
            </div>
        );
    };

    return (
        <div className="rounded-xl border border-gray-100 p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h6 className="font-semibold text-sm text-gray-700">Calendario de Turnos</h6>
                    {titleRange ? <div className="text-xs text-gray-500">{titleRange}</div> : null}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="rounded-md bg-rose-500 text-white px-3 py-1 text-xs font-black"
                        onClick={async () => {
                            // Clear all turnos for empleado
                            try {
                                const csrf = getCsrf();
                                if (!csrf) console.warn('CSRF token not found when clearing turnos');
                                const existing = events.map(e => ({ actividad: e.title, starts_at: e.start, ends_at: e.end, meta: e.meta || null }));
                                const res = await fetch('/api/turnos/clear', {
                                    method: 'POST',
                                    credentials: 'same-origin',
                                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf },
                                });
                                if (!res.ok) {
                                    let err = 'Error al eliminar turnos';
                                    try { const j = await res.json(); if (j && j.error) err = j.error; } catch (e) {}
                                    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err, type: 'error' } }));
                                    console.error('clear failed', res.status);
                                    return;
                                }
                                const data = await res.json();
                                window.dispatchEvent(new Event('tareas:updated'));
                                // Emit toast with undo action
                                window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Turnos eliminados', type: 'success', action: { name: 'undo-clear-turnos', label: 'Deshacer', payload: data.deleted || existing }, duration: 6000 } }));
                            } catch (e) { console.error(e); window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Error al eliminar turnos', type: 'error' } })); }
                        }}
                    >
                        Limpiar turnos
                    </button>

                    <button
                        className="rounded-md border border-gray-200 text-gray-700 px-3 py-1 text-xs font-black"
                        onClick={() => setIsFullscreen(s => !s)}
                        aria-pressed={isFullscreen}
                        title={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
                    >
                        {isFullscreen ? 'Salir' : 'Ampliar'}
                    </button>
                </div>
            </div>
            {selectedTurno && (
                <div className="mb-3 p-3 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-semibold text-gray-800">{selectedTurno.title || selectedTurno.actividad || 'Turno'}</div>
                        <div className="text-xs text-gray-500">{formatTurnoRange(selectedTurno.starts_at, selectedTurno.ends_at)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="text-xs text-gray-600 px-2 py-1" onClick={() => setSelectedTurno(null)}>Cerrar</button>
                        {selectedTurno.id && <button className="text-xs bg-rose-500 text-white px-2 py-1 rounded" onClick={deleteSelectedTurno}>Eliminar</button>}
                    </div>
                </div>
            )}
            <div className={isFullscreen ? 'fixed inset-0 z-50 bg-white p-6' : ''}>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[ timeGridPlugin, interactionPlugin ]}
                    initialView="timeGridWeek"
                    locale="es"
                    locales={[esLocale]}
                    firstDay={1}
                    // Mostrar día de la semana completo: 'lunes', 'martes', etc.
                    dayHeaderFormat={{ weekday: 'long' }}
                    buttonText={{ today: 'Hoy', week: 'Semana', day: 'Día' }}
                    headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridWeek,timeGridDay' }}
                    selectable={!isCreating}
                    select={handleSelect}
                    events={events}
                    editable={true}
                    eventDrop={handleEventDrop}
                    eventResize={handleEventDrop}
                    eventClick={handleEventClick}
                    eventContent={renderEventContent}
                    eventClassNames={(arg) => ['fc-event-turno']}
                    slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                    eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                    allDaySlot={false}
                    height={isFullscreen ? '100vh' : 'calc(100vh - 240px)'}
                />
            </div>
        </div>
    );
}
