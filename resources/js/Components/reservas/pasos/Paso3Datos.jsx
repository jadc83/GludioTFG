import PrimaryButton from '@/Components/PrimaryButton';
import FormularioDatosCliente from '../formularios/FormularioDatosCliente';

export default function Paso3Datos({
    watch,
    setValue,
    errors,
    avanzarPaso,
    retrocederPaso,
}) {
    const formData = watch();

    const Migitas = () => (
        <nav aria-label="Progreso de reserva" className="mx-auto mb-4 flex max-w-md justify-center space-x-2 rounded bg-gris p-2 text-sm">
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
        <div className="flex h-full flex-col">
            <header className="bg-gris px-4 pb-3 pt-2">
                <h3 className="titulo-rojo titulo-espaciado mb-2 text-center text-xl font-bold">Datos del cliente</h3>
                <Migitas />
            </header>

            <main className="flex-1 overflow-y-auto bg-gris px-3 py-2">
                <div className="mx-auto max-w-2xl">
                    <FormularioDatosCliente form={formData} errores={errors} onChange={(e) => {
                            const { name, value } = e.target;
                            setValue(name, value);
                        }}

                        onNext={(e) => { e.preventDefault(); avanzarPaso(); }} hideDates={true}
                        hideNextButton={true} />
                </div>
            </main>

            <footer className="border-t border-gray-300 bg-gris px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <PrimaryButton type="button" onClick={retrocederPaso}>
                        Volver a habitaciones
                    </PrimaryButton>
                    <PrimaryButton onClick={avanzarPaso}>
                        Siguiente
                    </PrimaryButton>
                </div>
            </footer>
        </div>
    );
}
