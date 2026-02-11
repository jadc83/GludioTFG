import Campo from '@/Components/reservas/utilidades/Campo';
import PrimaryButton from '@/Components/UI/PrimaryButton';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function FormularioDatosCliente({
    form,
    errores,
    onChange,
    onNext,
    hideDates = false,
    hideNextButton = false,
    formId = 'form-datos-cliente',
}) {
    return (
        <form
            id={formId}
            onSubmit={onNext}
            role="form"
            aria-label="Datos del cliente"
            className="flex h-full flex-col p-2 text-sm"
        >
            <div className="divider text-xs uppercase opacity-50">
                Datos de la Reserva
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Campo
                        id="name"
                        label="Nombre Completo"
                        value={form.name}
                        onChange={onChange}
                        error={errores.name}
                        required
                    />
                    <Campo
                        id="tipo_documento"
                        label="Tipo Doc"
                        as="select"
                        value={form.tipo_documento}
                        onChange={onChange}
                    >
                        <option value="dni">DNI</option>
                        <option value="pasaporte">Pasaporte</option>
                        <option value="tie">TIE</option>
                    </Campo>
                    <Campo
                        id="numero_documento"
                        label="Num. Documento"
                        value={form.numero_documento}
                        onChange={onChange}
                        error={errores.numero_documento}
                        required
                    />
                    <Campo
                        id="email"
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={onChange}
                        error={errores.email}
                        required
                    />
                    <Campo
                        id="telefono"
                        label="Teléfono"
                        type="tel"
                        value={form.telefono}
                        onChange={onChange}
                        error={errores.telefono}
                    />
                    <Campo
                        id="nacionalidad"
                        label="Nacionalidad"
                        value={form.nacionalidad}
                        onChange={onChange}
                    />
                    <Campo
                        id="direccion"
                        label="Dirección"
                        value={form.direccion}
                        onChange={onChange}
                        clase="md:col-span-3"
                    />
                </div>

                <div
                    className="mt-2 text-xs text-gray-700"
                    role="region"
                    aria-label="Aviso legal sobre datos"
                >
                    <span>
                        Por ley, este establecimiento está obligado a conservar
                        los datos de identidad de los huéspedes (nombre,
                        documento, dirección, teléfono y fechas de estancia) y a
                        facilitarlos a las autoridades cuando se requiera. Los
                        datos se tratarán y almacenarán de forma segura y
                        únicamente para fines administrativos y legales.
                    </span>
                    <p className="mt-1 text-xs text-gray-600">
                        Le deseamos una fantástica estancia con nosotros y
                        quedamos a su disposición para cualquier consulta.
                    </p>
                </div>

                {!hideDates && (
                    <div className="grid grid-cols-2 gap-2">
                        <Campo
                            id="check_in"
                            label="Entrada"
                            type="date"
                            value={form.check_in}
                            onChange={onChange}
                            error={errores.check_in}
                            required
                        />
                        <Campo
                            id="check_out"
                            label="Salida"
                            type="date"
                            value={form.check_out}
                            onChange={onChange}
                            error={errores.check_out}
                        />
                    </div>
                )}

                {errores.fechas && (
                    <div className="text-center text-xs font-medium text-error">
                        {errores.fechas}
                    </div>
                )}
            </div>

            {!hideNextButton && (
                <div className="flex justify-end pt-2">
                    <PrimaryButton
                        aria-label="Siguiente paso - datos cliente"
                        disabled={
                            !form.name ||
                            !form.numero_documento ||
                            (!hideDates && (!form.check_in || !form.check_out))
                        }
                    >
                        Siguiente Paso{' '}
                        <ArrowRightIcon
                            className="ml-2 h-4 w-4"
                            aria-hidden="true"
                        />
                    </PrimaryButton>
                </div>
            )}
        </form>
    );
}
