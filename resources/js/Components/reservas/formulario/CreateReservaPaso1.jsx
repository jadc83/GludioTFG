import ApplicationLogo from '@/Components/ApplicationLogo';
import Campo from '@/Components/Campo';
import PrimaryButton from '@/Components/PrimaryButton';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function CreateReservaPaso1({
    form,
    errores,
    onChange,
    onNext,
    searchProps,
    hideDates = false,
    hideNextButton = false,
}) {
    const {
        modoNuevo,
        setModoNuevo,
        query,
        setQuery,
        resultados,
        cargando,
        seleccionado,
        onSeleccionar,
    } = searchProps;

    return (
        <form onSubmit={onNext} className="space-y-5 p-6">
            <div className="mb-4 flex justify-center">
                <div className="inline-flex w-full rounded-lg bg-base-200 p-1 sm:w-auto">
                    <button
                        type="button"
                        onClick={() => {
                            setModoNuevo(true);
                            onSeleccionar(null);
                        }}
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 sm:flex-none ${modoNuevo ? 'bg-white shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700'}`}
                        style={modoNuevo ? { color: '#920303' } : {}}
                    >
                        Nuevo Cliente
                    </button>
                    <button
                        type="button"
                        onClick={() => setModoNuevo(false)}
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 sm:flex-none ${!modoNuevo ? 'bg-white shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700'}`}
                        style={!modoNuevo ? { color: '#920303' } : {}}
                    >
                        Buscar Existente
                    </button>
                </div>
            </div>

            {!modoNuevo && (
                <div className="relative z-20">
                    <div className="w-full join">
                        <input
                            type="text"
                            className="input-bordered input w-full join-item"
                            placeholder="Buscar por nombre, DNI o email..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {query.length >= 3 && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl">
                            {cargando && (
                                <div className="flex items-center justify-center gap-2 p-3 text-center text-sm text-gray-500">
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Buscando...
                                </div>
                            )}

                            {!cargando && resultados.length === 0 && (
                                <div className="p-3 text-center text-sm text-gray-500">
                                    No se encontraron clientes o usuarios
                                </div>
                            )}

                            {!cargando &&
                                resultados.length > 0 &&
                                resultados
                                    .filter(
                                        (p) =>
                                            !(
                                                seleccionado &&
                                                p.id === seleccionado.id &&
                                                p.tipo_usuario ===
                                                    seleccionado.tipo_usuario
                                            ),
                                    )
                                    .map((p) => (
                                        <div
                                            key={`${p.tipo_usuario}-${p.id}`}
                                            onClick={() => onSeleccionar(p)}
                                            className="hover:bg-primary/10 cursor-pointer border-b border-gray-100 p-3 transition-colors last:border-0"
                                        >
                                            <div className="flex items-center gap-2 font-semibold text-gray-800">
                                                {p.tipo_usuario ===
                                                    'usuario' && (
                                                    <span className="badge badge-warning badge-sm">
                                                        Usuario
                                                    </span>
                                                )}
                                                {p.tipo_usuario ===
                                                    'cliente' && (
                                                    <span className="badge badge-ghost badge-sm">
                                                        Cliente
                                                    </span>
                                                )}
                                                {p.nombre || p.name}
                                            </div>
                                            <div className="mt-1 flex gap-2 text-xs text-gray-500">
                                                <span>
                                                    {p.numero_documento}
                                                </span>
                                                {p.email && (
                                                    <span>{p.email}</span>
                                                )}
                                                {p.telefono && (
                                                    <span>{p.telefono}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                        </div>
                    )}

                    {seleccionado && (
                        <div className="mt-3">
                            <div className="card bg-base-100 p-3 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="font-semibold">
                                            {seleccionado.nombre ||
                                                seleccionado.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {seleccionado.numero_documento}{' '}
                                            {seleccionado.email
                                                ? `• ${seleccionado.email}`
                                                : ''}
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">
                                            {seleccionado.tipo_usuario ===
                                            'usuario'
                                                ? 'Usuario'
                                                : 'Cliente'}
                                        </div>
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            className="btn btn-sm"
                                            onClick={() => onSeleccionar(null)}
                                        >
                                            Limpiar selección
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {(modoNuevo || !seleccionado) && (
                <>
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
                </>
            )}
        </form>
    );
}
