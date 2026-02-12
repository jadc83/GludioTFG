// ModalPaso.jsx
export default function ModalPaso({ paso, pasoActual, onClose, children }) {
    if (pasoActual !== paso) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex justify-center overflow-y-auto bg-black/60 px-4 pb-10 pt-4 backdrop-blur-sm md:pt-10"
            role="dialog"
            aria-modal="true"
            aria-label={`Paso ${paso}`}
        >
            <button
                type="button"
                aria-label="Cerrar"
                className="absolute inset-0 h-full w-full bg-transparent p-0 z-0"
                onClick={onClose}
            />
            {/* Cambiamos 'md:max-w-2xl' por 'max-w-none'.
          Ahora el contenedor es tan ancho como el hijo (Paso4) le pida.
      */}
            <div
                className="flex h-fit w-full max-w-none justify-center relative z-10 pointer-events-auto"
                role="document"
            >
                {children}
            </div>
        </div>
    );
}
