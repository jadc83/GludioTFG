export default function HabitacionCarta({ h, assigned, loadingIds = [], onAssign, showAssignState = true }) {
  const key = `assign-${h.id}`;
  const disabled = loadingIds.includes(key) || assigned;
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <div className="text-sm font-black uppercase">{h.numero || h.tipo}</div>
      {h.tipo ? <div className="text-xs text-gray-500">Tipo: {h.tipo}</div> : null}
      {h.capacidad ? <div className="text-xs text-gray-500">Capacidad: {h.capacidad}</div> : null}
      <div className="mt-3">
        <button className={`rounded-md bg-[#920303] px-3 py-1 text-xs font-black text-white ${disabled ? 'cursor-not-allowed opacity-50' : ''}`} disabled={disabled} onClick={() => onAssign(h.id)}>
          {loadingIds.includes(key) ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : (showAssignState ? 'Asignarme' : 'Asignarme')}
        </button>
      </div>
    </div>
  );
}
