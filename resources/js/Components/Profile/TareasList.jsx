export default function TareasList({ activeTareas = [], loadingIds = [], confirmComplete, doComplete, cancelTarea, canCancelTarea }) {
  return (
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
  );
}
