import ApplicationLogo from '@/Components/ApplicationLogo';
import Campo from '@/Components/Campo';
import PrimaryButton from '@/Components/PrimaryButton';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function CreateReservaPaso1({
    form,
    errores,
    onChange,
    onNext,
    hideDates = false,
    hideNextButton = false,
}) {

    return (
        <form onSubmit={onNext} className="space-y-5 p-6">
            <div className="divider text-xs uppercase opacity-50">
                Datos de la Reserva
            </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Campo
                            id="name"
                            label="Nombre Completo"
                            value={form.name}
                            onChange={onChange}
                            error={errores.name}
                            required
                        />
                        <Campo
                            id="email"
                            label="Email"
                            type="email"
                            value={form.email}
                            onChange={onChange}
                            error={errores.email}
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
                    </div>

                    <Campo
                        id="direccion"
                        label="Dirección"
                        value={form.direccion}
                        onChange={onChange}
                    />

                    <div className="mt-6 flex items-start gap-3 text-sm text-gray-700">
                        <ApplicationLogo className="h-6 w-6 flex-shrink-0 text-gray-500" />
                        <div>
                            <span>
                                Por ley, este establecimiento está obligado a
                                conservar los datos de identidad de los
                                huéspedes (nombre, documento, dirección,
                                teléfono y fechas de estancia) y a facilitarlos
                                a las autoridades cuando se requiera. Los datos
                                se tratarán y almacenarán de forma segura y
                                únicamente para fines administrativos y legales.
                            </span>
                            <p className="mt-2 text-sm text-gray-600">
                                Le deseamos una fantástica estancia con nosotros
                                y quedamos a su disposición para cualquier
                                consulta.
                            </p>
                        </div>
                    </div>

                    {!hideDates && (
                        <div className="grid grid-cols-2 gap-4">
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
                                required
                            />
                        </div>
                    )}

                    {errores.fechas && (
                        <div className="text-center text-sm font-medium text-error">
                            {errores.fechas}
                        </div>
                    )}

                    {!hideNextButton && (
                        <div className="flex justify-end pt-4">
                            <PrimaryButton
                                type="submit"
                                disabled={
                                    !form.name ||
                                    !form.numero_documento ||
                                    (!hideDates &&
                                        (!form.check_in || !form.check_out))
                                }
                            >
                                Siguiente Paso{' '}
                                <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </PrimaryButton>
                        </div>
                    )}
        </form>
    );
}
