import PrimaryButton from '@/Components/UI/PrimaryButton';
import FormularioDatosCliente from '../formularios/FormularioDatosCliente';
import { IdentificationIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Paso3Datos({
    watch,
    setValue,
    errors,
    avanzarPaso,
    retrocederPaso,
}) {
    const formData = watch();

    const Migitas = () => (
        <nav aria-label="Progreso" className="flex items-center gap-3">
            {['Fechas', 'Habitación', 'Datos', 'Confirmar'].map((etiqueta, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                        i === 2 ? 'text-[#7a0202]' : i < 2 ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                        {etiqueta}
                    </span>
                    {i < 3 && <ChevronRightIcon className="h-3 w-3 text-gray-300" />}
                </div>
            ))}
        </nav>
    );

    return (
        /* - Eliminado bg-gris. Ahora es bg-white.
           - Ajustado el margen superior (-mt-10) para no ocultar el header.
           - Altura máxima controlada para evitar cortes.
        */
        <div className="relative z-10 mx-auto flex h-full max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-2xl -mt-10">

            {/* HEADER: Limpio y visible */}
            <header className="flex-none border-b border-gray-100 bg-white px-8 py-5 md:px-12">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <h1 className="text-2xl font-black leading-none text-gray-900 uppercase tracking-tighter">
                            DATOS DEL <span className="text-[#7a0202]">TITULAR</span>
                        </h1>
                        <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
                            Registro de Identidad / Step 03
                        </p>
                    </div>
                    <Migitas />
                </div>
            </header>

            {/* CUERPO: Fondo transparente/limpio */}
            <main className="flex-1 overflow-hidden bg-white flex flex-col items-center justify-start pt-6">
                <div className="custom-scrollbar w-full max-w-4xl overflow-y-auto px-6 pb-12">

                    {/* Contenedor del Formulario sin bg-gris y transparente */}
                    <div className="rounded-[2.5rem] bg-transparent p-4 md:p-8">

                        {/* Indicador Industrial */}
                        <div className="mb-10 flex items-center gap-5 border-l-4 border-[#7a0202] pl-6">
                            <IdentificationIcon className="h-6 w-6 text-gray-900 opacity-30" />
                            <div>
                                <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">
                                    Información de Registro
                                </h2>
                                <p className="mt-1 text-[10px] text-gray-400 uppercase tracking-widest">
                                    Los datos se vincularán al activo seleccionado.
                                </p>
                            </div>
                        </div>

                        {/* Inyección del formulario (asegurarse que por dentro no tenga bg-gris tampoco) */}
                        <div className="bg-transparent">
                            <FormularioDatosCliente
                                form={formData}
                                errores={errors}
                                onChange={(e) => {
                                    const { name, value } = e.target;
                                    setValue(name, value);
                                }}
                                onNext={(e) => { e.preventDefault(); avanzarPaso(); }}
                                hideDates={true}
                                hideNextButton={true}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* FOOTER: Fijo y consistente */}
            <footer className="flex-none border-t border-gray-100 bg-white px-10 py-6">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <button
                        onClick={retrocederPaso}
                        className="text-[10px] font-black text-gray-400 transition-colors uppercase tracking-[0.2em] hover:text-gray-900"
                    >
                        ← Volver a Unidades
                    </button>

                    <button
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
                        className="rounded-2xl bg-[#7a0202] px-14 py-5 text-[11px] font-black text-white transition-all uppercase tracking-[0.3em] shadow-xl shadow-red-900/20 active:scale-95 disabled:grayscale disabled:opacity-20 hover:bg-black"
                    >
                        Revisar Reserva →
                    </button>
                </div>
            </footer>
        </div>
    );
}
