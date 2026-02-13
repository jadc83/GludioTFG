import { Link } from '@inertiajs/react';
import useEmpleadoProfile from '@/hooks/useEmpleadoProfile';
import TareasList from './TareasList';
import HabitacionesGrid from './HabitacionesGrid';
import ConfirmModal from './ConfirmModal';

export default function EmpleadoProfile({ habitaciones = [], showAssignState = true, empleado = null, auth = null }) {
  const {
    rooms,
    roomsMantenimiento,
    loading,
    activeTareas,
    loadingIds,
    confirm,
    setConfirm,
    assignRoom,
    confirmComplete,
    doComplete,
    cancelTarea,
    canCancelTarea,
    fetchRooms,
    fetchMyTareas,
  } = useEmpleadoProfile({ habitaciones, empleado, auth, showAssignState });

  if (!Array.isArray(rooms) && !loading) return null;

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
            <TareasList activeTareas={activeTareas} loadingIds={loadingIds} confirmComplete={confirmComplete} doComplete={doComplete} cancelTarea={cancelTarea} canCancelTarea={canCancelTarea} />
          ) : (
            <div className="p-6 text-sm text-gray-500">No tienes tareas activas.</div>
          )}
        </div>

        {(canCancelTarea || false) && (
          <>
            <h5 className="mb-3 mt-8 text-xs font-black uppercase text-gray-700">Habitaciones en Limpieza</h5>
            {loading ? (
              <div className="p-6 text-sm text-gray-500">Cargando habitaciones...</div>
            ) : (
              <HabitacionesGrid rooms={unassignedLimpieza} loadingIds={loadingIds} assignedIds={assignedIds} onAssign={assignRoom} showAssignState={showAssignState} />
            )}
          </>
        )}

        {(canCancelTarea || false) && (
          <>
            <h5 className="mb-3 mt-8 text-xs font-black uppercase text-gray-700">Habitaciones en Mantenimiento</h5>
            {loading ? (
              <div className="p-6 text-sm text-gray-500">Cargando habitaciones...</div>
            ) : (
              <HabitacionesGrid rooms={unassignedMantenimiento} loadingIds={loadingIds} assignedIds={assignedIds} onAssign={assignRoom} showAssignState={showAssignState} />
            )}
          </>
        )}

      </div>

      <ConfirmModal confirm={confirm} onClose={() => setConfirm({ open: false, tareaId: null, descripcion: '' })} onConfirm={doComplete} />
    </section>
  );
}
