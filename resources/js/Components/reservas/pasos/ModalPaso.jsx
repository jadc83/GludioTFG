// ModalPaso.jsx
export default function ModalPaso({ paso, pasoActual, onClose, children }) {
  if (pasoActual !== paso) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-center bg-black/60 backdrop-blur-sm overflow-y-auto pt-4 md:pt-10 pb-10 px-4"
      onClick={onClose}
    >
      {/* Cambiamos 'md:max-w-2xl' por 'max-w-none'.
          Ahora el contenedor es tan ancho como el hijo (Paso4) le pida.
      */}
      <div
        className="w-full max-w-none flex justify-center h-fit"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
