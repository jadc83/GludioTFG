import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import habitacionesService from '@/services/habitacionesService';

export default function EmpleadoProfile({ habitaciones = [], showAssignState = true, empleado = null, auth = null }) {
  const page = usePage();
  const roles = page?.props?.auth?.user?.roles || [];
  const viewerRoles = auth?.user?.roles || page?.props?.auth?.user?.roles || [];
  const viewerIsAdmin = Array.isArray(viewerRoles) && viewerRoles.includes('admin');
  const viewerDept = (auth?.user?.empleado_departamento || page?.props?.auth?.user?.empleado_departamento || '').toLowerCase();
  const canCancelTarea = viewerIsAdmin || viewerDept === (empleado?.departamento || '').toLowerCase();

  const [rooms, setRooms] = useState(Array.isArray(habitaciones) ? habitaciones : []);
  const [roomsMantenimiento, setRoomsMantenimiento] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTareas, setActiveTareas] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [confirm, setConfirm] = useState({ open: false, tareaId: null, descripcion: '' });

  const getCsrf = () => window.getCsrfToken?.() || '';

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const l = await habitacionesService.getHabitacionesLimpieza(true);
      setRooms((l && l.habitaciones) || []);
    } catch (e) {
      setRooms([]);
    }
    try {
      const m = await habitacionesService.getHabitacionesMantenimiento(true);
      setRoomsMantenimiento((m && m.habitaciones) || []);
    } catch (e) {
      setRoomsMantenimiento([]);
    }
    setLoading(false);
  };

  const fetchMyTareas = async () => {
    try {
      let url = '/api/tareas';
      // Prefer explicit `empleado` prop (cuando un admin ve el perfil de otro empleado).
      // Si no existe, intentar usar la relación/ID del usuario autenticado (prop `auth`).
      const targetEmpleadoId = (empleado && empleado.id)
        || (auth && auth.user && auth.user.empleado && auth.user.empleado.id)
        || (auth && auth.user && auth.user.empleado_id)
        || (page && page.props && page.props.auth && page.props.auth.user && page.props.auth.user.empleado && page.props.auth.user.empleado.id)
        || (page && page.props && page.props.auth && page.props.auth.user && page.props.auth.user.empleado_id);

      if (targetEmpleadoId) url += `?empleado_id=${encodeURIComponent(targetEmpleadoId)}`;
      const res = await fetch(url, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
      if (!res.ok) {
        setActiveTareas([]);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setActiveTareas(Array.isArray(data.tareas) ? data.tareas : []);
    } catch (e) {
      setActiveTareas([]);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchMyTareas();
    const h = () => { fetchRooms(); fetchMyTareas(); };
    window.addEventListener('tareas:updated', h);
    return () => window.removeEventListener('tareas:updated', h);
  }, [empleado]);

  const assignRoom = async (habitacionId) => {
    const key = `assign-${habitacionId}`;
    setLoadingIds((s) => [...s, key]);
    try {
      const csrf = getCsrf();
      const payload = { habitacion_id: habitacionId };
      // permitir asignar a empleado objetivo cuando el viewer puede gestionar
      if (empleado && empleado.id && canCancelTarea) payload.empleado_id = empleado.id;
      const res = await fetch('/api/tareas/assign-room', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json', 'X-XSRF-TOKEN': csrf },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.error || 'Error al asignar habitación', type: 'error' } }));
        return;
      }
      window.dispatchEvent(new Event('tareas:updated'));
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Tarea creada', type: 'success' } }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIds((s) => s.filter((id) => id !== key));
    }
  };

  const confirmComplete = (tareaId, descripcion) => setConfirm({ open: true, tareaId, descripcion });
  const doComplete = async (tareaId) => {
    setLoadingIds((s) => [...s, tareaId]);
    try {
      const csrf = getCsrf();
      const res = await fetch(`/api/tareas/${tareaId}/complete`, { method: 'POST', credentials: 'same-origin', headers: { 'X-XSRF-TOKEN': csrf, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
      if (!res.ok) { const err = await res.json().catch(() => ({})); window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.error || 'Error al completar tarea', type: 'error' } })); return; }
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Tarea completada', type: 'success' } }));
      window.dispatchEvent(new Event('tareas:updated'));
    } catch (e) { console.error(e); } finally { setLoadingIds((s) => s.filter((id) => id !== tareaId)); setConfirm({ open: false, tareaId: null, descripcion: '' }); }
  };

  const cancelTarea = async (tareaId) => {
    setLoadingIds((s) => [...s, tareaId]);
    try {
      const csrf = getCsrf();
      const res = await fetch(`/api/tareas/${tareaId}/cancel`, { method: 'POST', credentials: 'same-origin', headers: { 'X-XSRF-TOKEN': csrf, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
      if (!res.ok) { const err = await res.json().catch(() => ({})); window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.error || 'Error al desasignar tarea', type: 'error' } })); return; }
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Tarea desasignada', type: 'success' } }));
      window.dispatchEvent(new Event('tareas:updated'));
    } catch (e) { console.error(e); } finally { setLoadingIds((s) => s.filter((id) => id !== tareaId)); }
  };

  if (!Array.isArray(rooms) && !loading) return null;

  // helper to compute unassigned rooms
  const assignedIds = activeTareas.map((t) => t.habitacion?.id).filter(Boolean);
  const unassignedLimpieza = rooms.filter((r) => !assignedIds.includes(r.id));
  const unassignedMantenimiento = roomsMantenimiento.filter((r) => !assignedIds.includes(r.id));

  return (
    <section aria-labelledby="tareas-heading" className="mt-8 rounded-xl border border-gray-100 bg-white p-6">
      <h4 id="tareas-heading" className="text-sm font-black uppercase text-gray-700">Tareas</h4>

      <div className="mt-3">
        <div className="mb-4 flex items-center gap-4">
          <div className="rounded-md bg-gray-50 px-4 py-2 text-sm font-black uppercase text-gray-700">
            Pendientes: <span className="ml-2 text-base text-gray-900">{rooms.filter(r => !assignedIds.includes(r.id)).length}</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h5 className="text-xs font-black uppercase text-gray-700">Mis tareas activas</h5>
            <Link href="/profile/tareas/completadas" className="text-xs text-gray-500">Ver historial</Link>
          </div>

          {activeTareas && activeTareas.length > 0 ? (
            <div className="space-y-3">
              {activeTareas.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div>
                    <div className="text-sm font-semibold">{t.habitacion ? `Hab. ${t.habitacion.numero}` : t.descripcion}</div>
                    <div className="text-xs text-gray-500">{t.descripcion}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className={`rounded bg-rose-500 px-3 py-1 text-xs text-white ${loadingIds.includes(t.id) ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={() => confirmComplete(t.id, t.descripcion)} disabled={loadingIds.includes(t.id)}>
                      {loadingIds.includes(t.id) ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Completar'}
                    </button>
                    {canCancelTarea && (
                      <button className="rounded border border-gray-200 px-3 py-1 text-xs text-gray-700" onClick={() => cancelTarea(t.id)} disabled={loadingIds.includes(t.id)}>Desasignar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-sm text-gray-500">No tienes tareas activas.</div>
          )}
        </div>

        {(viewerIsAdmin || viewerDept === 'limpieza') && (
          <>
            <h5 className="mb-3 mt-8 text-xs font-black uppercase text-gray-700">Habitaciones en Limpieza</h5>
            {loading ? (
              <div className="p-6 text-sm text-gray-500">Cargando habitaciones...</div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {unassignedLimpieza.length === 0 ? <div className="p-6 text-sm text-gray-500 col-span-full">No hay habitaciones en limpieza.</div> : unassignedLimpieza.map((h) => (
                  <div key={`l-${h.id}`} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div className="text-sm font-black uppercase">{h.numero || h.tipo}</div>
                    {h.tipo ? <div className="text-xs text-gray-500">Tipo: {h.tipo}</div> : null}
                    {h.capacidad ? <div className="text-xs text-gray-500">Capacidad: {h.capacidad}</div> : null}
                    <div className="mt-3">
                      <button className={`rounded-md bg-[#920303] px-3 py-1 text-xs font-black text-white ${(loadingIds.includes(`assign-${h.id}`) || assignedIds.includes(h.id)) ? 'cursor-not-allowed opacity-50' : ''}`} disabled={loadingIds.includes(`assign-${h.id}`) || assignedIds.includes(h.id)} onClick={() => assignRoom(h.id)}>
                        {loadingIds.includes(`assign-${h.id}`) ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : (showAssignState ? 'Asignarme' : 'Asignarme')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {(viewerIsAdmin || viewerDept === 'mantenimiento') && (
          <>
            <h5 className="mb-3 mt-8 text-xs font-black uppercase text-gray-700">Habitaciones en Mantenimiento</h5>
            {loading ? (
              <div className="p-6 text-sm text-gray-500">Cargando habitaciones...</div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {unassignedMantenimiento.length === 0 ? <div className="p-6 text-sm text-gray-500 col-span-full">No hay habitaciones en mantenimiento.</div> : unassignedMantenimiento.map((h) => (
                  <div key={`m-${h.id}`} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div className="text-sm font-black uppercase">{h.numero || h.tipo}</div>
                    {h.tipo ? <div className="text-xs text-gray-500">Tipo: {h.tipo}</div> : null}
                    {h.capacidad ? <div className="text-xs text-gray-500">Capacidad: {h.capacidad}</div> : null}
                    <div className="mt-3">
                      <button className={`rounded-md bg-[#920303] px-3 py-1 text-xs font-black text-white ${(loadingIds.includes(`assign-m-${h.id}`) || assignedIds.includes(h.id)) ? 'cursor-not-allowed opacity-50' : ''}`} disabled={loadingIds.includes(`assign-m-${h.id}`) || assignedIds.includes(h.id)} onClick={() => assignRoom(h.id)}>
                        {loadingIds.includes(`assign-m-${h.id}`) ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : (showAssignState ? 'Asignarme' : 'Asignarme')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setConfirm({ open: false, tareaId: null, descripcion: '' })} />
          <div className="z-10 w-11/12 max-w-md rounded bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-bold">Confirmar</h3>
            <p className="mb-4 text-sm text-gray-700">¿Confirmas completar la tarea: <strong>{confirm.descripcion || confirm.tareaId}</strong>?</p>
            <div className="flex justify-end gap-2">
              <button className="rounded border border-gray-300 px-3 py-1 text-sm" onClick={() => setConfirm({ open: false, tareaId: null, descripcion: '' })}>Cancelar</button>
              <button className="rounded bg-rose-500 px-3 py-1 text-sm text-white" onClick={() => doComplete(confirm.tareaId)}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
