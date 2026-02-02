import ReservaBreadcrumbs from '@/Components/reservas/ReservaBreadcrumbs';
import { IdentificationIcon } from '@heroicons/react/24/outline';
import FormularioDatosCliente from '../formularios/FormularioDatosCliente';

export default function Paso3Datos({
    watch,
    setValue,
    errors,
    avanzarPaso,
    retrocederPaso,
}) {
    const formData = watch();

    return (
        /* - Eliminado -mt-10 para evitar que se pegue o oculte bajo el header.
           - Redondeo ajustado de 2.5rem a xl para un look más industrial/limpio.
           - Altura ajustada para asegurar visibilidad total.
        */
        <div className="relative z-10 mx-auto flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            {/* HEADER: Sin margen negativo, alineación corregida */}
            <header className="flex-none border-b border-gray-100 bg-white px-8 py-6 md:px-12">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
                    <div className="text-center md:text-left">
                        <h1 className="text-2xl font-black uppercase leading-none tracking-tighter text-gray-900">
                            DATOS DEL{' '}
                            <span className="text-[#7a0202]">TITULAR</span>
                        </h1>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                            Registro de Identidad / Step 03
                        </p>
                    </div>
                    <ReservaBreadcrumbs
                        activeIndex={2}
                        separator="chevron"
                        className="flex items-center gap-3"
                        textClass="text-[10px]"
                    />
                </div>
            </header>

            {/* CUERPO: Scroll optimizado y padding superior corregido */}
            <main className="flex flex-1 flex-col items-center justify-start overflow-hidden bg-white">
                <div className="custom-scrollbar w-full max-w-4xl overflow-y-auto px-6 py-8">
                    {/* Contenedor del Formulario con redondeo reducido */}
                    <div className="rounded-lg bg-transparent p-2 md:p-4">
                        {/* Indicador Industrial: Más sobrio */}
                        <div className="mb-8 flex items-center gap-5 border-l-4 border-[#7a0202] pl-6">
                            <IdentificationIcon className="h-6 w-6 text-gray-900 opacity-20" />
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">
                                    Información de Registro
                                </h2>
                                <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-400">
                                    Los datos se vincularán al activo
                                    seleccionado.
                                </p>
                            </div>
                        </div>

                        {/* Inyección del formulario */}
                        <div className="bg-transparent">
                            <FormularioDatosCliente
                                form={formData}
                                errores={errors}
                                onChange={(e) => {
                                    const { name, value } = e.target;
                                    setValue(name, value);
                                }}
                                onNext={(e) => {
                                    e.preventDefault();
                                    avanzarPaso();
                                }}
                                hideDates={true}
                                hideNextButton={true}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* FOOTER: Botones con radio industrial corregido */}
            <footer className="flex-none border-t border-gray-100 bg-white px-10 py-6">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <button
                        onClick={retrocederPaso}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-[#7a0202]"
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
                        className="rounded-lg bg-[#7a0202] px-12 py-4 text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-lg transition-all hover:bg-black active:scale-95 disabled:opacity-20"
                    >
                        Revisar Reserva →
                    </button>
                </div>
            </footer>
        </div>
    );
}
