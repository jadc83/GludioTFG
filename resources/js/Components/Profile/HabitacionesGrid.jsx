import HabitacionCarta from './HabitacionCarta';

export default function HabitacionesGrid({ rooms = [], loadingIds = [], assignedIds = [], onAssign, showAssignState = true }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {rooms.map((h) => (
        <HabitacionCarta key={h.id} h={h} assigned={assignedIds.includes(h.id)} loadingIds={loadingIds} onAssign={onAssign} showAssignState={showAssignState} />
      ))}
    </div>
  );
}
