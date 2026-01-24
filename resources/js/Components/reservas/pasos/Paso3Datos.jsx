import PrimaryButton from '@/Components/UI/PrimaryButton';
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
        <div className="bg-gris rounded-lg">
            {/* Si hay paneles internos con fondo blanco, cámbialos a bg-gris en los componentes hijos también. */}
            <header>
                <h3 className="titulo-rojo titulo-espaciado mb-2 text-center font-bold">Datos del cliente</h3>
                <Migitas />
            </header>

            <main>
                <div>
                    <FormularioDatosCliente form={formData} errores={errors} onChange={(e) => {
                            const { name, value } = e.target;
                            setValue(name, value);
                        }}
                        onNext={(e) => { e.preventDefault(); avanzarPaso(); }} hideDates={true}
                        hideNextButton={true} />
                </div>
            </main>

            <footer>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <PrimaryButton type="button" onClick={retrocederPaso}>
                        Volver a habitaciones
                    </PrimaryButton>
                    <PrimaryButton
                        onClick={avanzarPaso}
                        disabled={
                            !formData.name ||
                            !formData.tipo_documento ||
                            !formData.numero_documento ||
                            !formData.email ||
                            !formData.telefono ||
                            !formData.nacionalidad ||
                            !formData.direccion
                        }
                    >
                        Siguiente
                    </PrimaryButton>
                </div>
            </footer>
        </div>
    );
}
