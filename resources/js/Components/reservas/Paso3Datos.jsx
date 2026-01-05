import PrimaryButton from '../PrimaryButton';
import CreateReservaPaso1 from './formulario/CreateReservaPaso1';

export default function Paso3Datos({
    rango,
    watch,
    setValue,
    errors,
    continuar,
    volverAtras,
}) {
    const formData = watch();

    const Migitas = () => (
        <nav
            aria-label="Progreso de reserva"
            className="mx-auto mb-4 flex max-w-md justify-center space-x-2 rounded bg-gris p-2 text-sm"
        >
            {['Fechas', 'Habitación', 'Datos', 'Confirmar'].map(
                (etiqueta, indice) => (
                    <span key={indice} className={`rounded-md px-3 py-1 ${indice === 2 ? 'bg-black text-white' : 'bg-gris text-black'}`}>
                        {etiqueta}
                    </span>
                ),
            )}
        </nav>
    );

    return (
        <div className="flex h-full flex-col bg-gris p-4">
            <header className="mb-4">
                <h3 className="titulo-rojo mb-4 text-center text-2xl font-bold">
                    Datos del cliente
                </h3>
                <Migitas />
            </header>

            <main className="flex-1 overflow-y-auto">
                <CreateReservaPaso1 form={formData} errores={errors} onChange={(e) => {
                        const { name, value } = e.target;
                        setValue(name, value);
                    }}

                    onNext={(e) => {
                        e.preventDefault();
                        continuar();
                    }}
                    hideDates={true}
                    hideNextButton={true}
                />
            </main>

            <footer className="border-t border-gray-300 bg-gris py-3">
                <div className="flex items-center justify-between gap-3">
                    <PrimaryButton type="button" onClick={volverAtras}>
                        Atrás
                    </PrimaryButton>
                    <PrimaryButton onClick={continuar}>
                        Siguiente
                    </PrimaryButton>
                </div>
            </footer>
        </div>
    );
}
