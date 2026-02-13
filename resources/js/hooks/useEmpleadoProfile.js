import { useEffect, useState, useCallback } from 'react';

export default function useEmpleadoProfile({ habitaciones = [], empleado = null, auth = null, showAssignState = true }) {
  const [rooms, setRooms] = useState(Array.isArray(habitaciones) ? habitaciones : []);
  const [roomsMantenimiento, setRoomsMantenimiento] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTareas, setActiveTareas] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [confirm, setConfirm] = useState({ open: false, tareaId: null, descripcion: '' });

  const pageAuth = (typeof window !== 'undefined' && window.page && window.page.props && window.page.props.auth) || null;
  const viewerRoles = (auth && auth.user && auth.user.roles) || (pageAuth && pageAuth.user && pageAuth.user.roles) || [];
  const viewerIsAdmin = Array.isArray(viewerRoles) && viewerRoles.includes('admin');
  const viewerDept = (auth?.user?.empleado_departamento || pageAuth?.user?.empleado_departamento || '').toLowerCase();
  const canCancelTarea = viewerIsAdmin || viewerDept === (empleado?.departamento || '').toLowerCase();

  const getCsrf = () => window.getCsrfToken?.() || '';

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/habitaciones/limpieza?solo_activos=1', { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setRooms((data && data.habitaciones) || []);
      } else setRooms([]);
    } catch (e) {
      setRooms([]);
    }

    try {
      const res = await fetch('/api/habitaciones/mantenimiento?solo_activos=1', { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setRoomsMantenimiento((data && data.habitaciones) || []);
      } else setRoomsMantenimiento([]);
    } catch (e) {
      setRoomsMantenimiento([]);
    }

    setLoading(false);
  }, []);

  const fetchMyTareas = useCallback(async () => {
    try {
      let url = '/api/tareas';
      const page = typeof window !== 'undefined' && window.page ? window.page : null;
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
  }, [empleado, auth]);

  useEffect(() => {
    fetchRooms();
    fetchMyTareas();
    const h = () => { fetchRooms(); fetchMyTareas(); };
    window.addEventListener('tareas:updated', h);
    return () => window.removeEventListener('tareas:updated', h);
  }, [fetchRooms, fetchMyTareas, empleado]);

  const assignRoom = async (habitacionId) => {
    const key = `assign-${habitacionId}`;
    setLoadingIds((s) => [...s, key]);
    try {
      const csrf = getCsrf();
      const payload = { habitacion_id: habitacionId };
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

  return {
    rooms,
    roomsMantenimiento,
    loading,
    activeTareas,
    loadingIds,
    confirm,
    setConfirm,
    fetchRooms,
    fetchMyTareas,
    assignRoom,
    confirmComplete,
    doComplete,
    cancelTarea,
    canCancelTarea,
  };
}
