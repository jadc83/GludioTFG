// ModalPaso.jsx
export default function ModalPaso({ paso, pasoActual, onClose, children }) {
    if (pasoActual !== paso) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex justify-center overflow-y-auto bg-black/60 px-4 pb-10 pt-4 backdrop-blur-sm md:pt-10"
            onClick={onClose}
        >
            {/* Cambiamos 'md:max-w-2xl' por 'max-w-none'.
          Ahora el contenedor es tan ancho como el hijo (Paso4) le pida.
      */}
            <div
                className="flex h-fit w-full max-w-none justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}
