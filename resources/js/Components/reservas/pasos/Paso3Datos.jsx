import ReservaBreadcrumbs from '@/Components/reservas/utilidades/ReservaBreadcrumbs';
import Boton from '@/Components/UI/Boton';
import { IdentificationIcon } from '@heroicons/react/24/outline';
import '../../../../css/paso3Datos.css';
import FormularioDatosCliente from '@/Components/formularios/create/FormularioDatosCliente';

export default function Paso3Datos({
    watch,
    setValue,
    errors,
    avanzarPaso,
    retrocederPaso,
}) {
    const formData = watch();

    return (
        <div className="paso3-datos relative flex flex-col min-h-screen md:min-h-0 mx-auto w-full max-w-5xl bg-white md:rounded-xl md:border md:border-gray-200 md:shadow-lg overflow-hidden">
            <header className="px-4 py-3 sm:px-6 sm:py-5 border-b bg-white sticky top-0 z-30">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-gray-900">
                            DATOS DEL <span className="text-[#7a0202]">TITULAR</span>
                        </h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Registro de Identidad</p>
                    </div>
                    <div className="hidden md:block">
                        <ReservaBreadcrumbs activeIndex={2} separator="chevron" textClass="text-sm" />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white custom-scrollbar">
                <div className="w-full max-w-5xl mx-auto px-2 md:px-4 py-6">
                    <div className="rounded-lg bg-transparent p-2 md:p-4">
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

                        <div className="bg-transparent">
                            <FormularioDatosCliente
                                form={formData}
                                errores={errors}
                                onChange={(e) => {
                                    const { name, value } = e.target;
                                    setValue(name, value);
                                }}
                                formId="paso3-form"
                                onNext={(e) => {
                                    e.preventDefault();
                                    const formEl = e.target;
                                    if (typeof formEl.checkValidity === 'function' && !formEl.checkValidity()) {
                                        if (typeof formEl.reportValidity === 'function') formEl.reportValidity();
                                        return;
                                    }
                                    avanzarPaso();
                                }}
                                hideDates={true}
                                hideNextButton={true}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <footer className="flex-none border-t border-gray-100 bg-white px-4 py-4 sm:px-6 sm:py-5">
                <div className="mx-auto max-w-5xl flex items-center justify-between">
                    <Boton variant="ghost" size="sm" onClick={retrocederPaso}>
                        ← Volver a Unidades
                    </Boton>

                    <Boton
                        variant="primary"
                        color="danger"
                        size="md"
                        onClick={() => {
                            const formEl = document.getElementById('paso3-form');
                            if (formEl) {
                                if (typeof formEl.checkValidity === 'function' && !formEl.checkValidity()) {
                                    if (typeof formEl.reportValidity === 'function') formEl.reportValidity();
                                    return;
                                }
                            }
                            avanzarPaso();
                        }}
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
                        Revisar Reserva →
                    </Boton>
                </div>
            </footer>
        </div>
    );
}
