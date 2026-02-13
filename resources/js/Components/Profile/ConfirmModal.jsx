export default function ConfirmModal({ confirm, onClose, onConfirm }) {
  if (!confirm?.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="z-10 w-11/12 max-w-md rounded bg-white p-6 shadow-lg">
        <h3 className="mb-2 text-lg font-bold">Confirmar</h3>
        <p className="mb-4 text-sm text-gray-700">¿Confirmas completar la tarea: <strong>{confirm.descripcion || confirm.tareaId}</strong>?</p>
        <div className="flex justify-end gap-2">
          <button className="rounded border border-gray-300 px-3 py-1 text-sm" onClick={onClose}>Cancelar</button>
          <button className="rounded bg-rose-500 px-3 py-1 text-sm text-white" onClick={() => onConfirm(confirm.tareaId)}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}
