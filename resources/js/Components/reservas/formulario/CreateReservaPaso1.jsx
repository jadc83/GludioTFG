import PrimaryButton from '@/Components/PrimaryButton';
import Campo from '@/Components/Campo';
import { ArrowRightIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function CreateReservaPaso1({ form, errores, onChange, onNext, searchProps, hideDates = false, hideNextButton = false }) {

    const { modoNuevo, setModoNuevo, query, setQuery, resultados, cargando, seleccionado, onSeleccionar } = searchProps;

    return (
        <form onSubmit={onNext} className="p-6 space-y-5">

            <div className="flex justify-center mb-4">
                <div className="bg-base-200 p-1 rounded-lg inline-flex w-full sm:w-auto">
                    <button type="button" onClick={() => { setModoNuevo(true); onSeleccionar(null); }}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                            ${modoNuevo ? 'bg-white shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                        style={modoNuevo ? { color: '#920303' } : {}}>
                        Nuevo Cliente
                    </button>
                    <button type="button" onClick={() => setModoNuevo(false)} className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                            ${!modoNuevo ? 'bg-white shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                        style={!modoNuevo ? { color: '#920303' } : {}}>
                        Buscar Existente
                    </button>
                </div>
            </div>


            {!modoNuevo && (
                <div className="relative z-20">

                    <div className="join w-full">
                        <input type="text" className="input input-bordered join-item w-full" placeholder="Buscar por nombre, DNI o email..."
                            value={query} onChange={(e) => setQuery(e.target.value)} autoFocus/>
                    </div>


                    {query.length >= 3 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-md max-h-60 overflow-y-auto z-50">
                            {cargando && (
                                <div className="p-3 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Buscando...
                                </div>
                            )}

                            {!cargando && resultados.length === 0 && (
                                <div className="p-3 text-center text-sm text-gray-500">
                                    No se encontraron clientes o usuarios
                                </div>
                            )}

                            {!cargando && resultados.length > 0 && resultados
                                .filter(p => !(seleccionado && p.id === seleccionado.id && p.tipo_usuario === seleccionado.tipo_usuario))
                                .map(p => (
                                <div key={`${p.tipo_usuario}-${p.id}`} onClick={() => onSeleccionar(p)}
                                    className="p-3 hover:bg-primary/10 cursor-pointer border-b border-gray-100 last:border-0 transition-colors">

                                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                                        {p.tipo_usuario === 'usuario' && <span className="badge badge-warning badge-sm">⭐ Usuario</span>}
                                        {p.tipo_usuario === 'cliente' && <span className="badge badge-ghost badge-sm">👤 Cliente</span>}
                                        {p.nombre || p.name}
                                    </div>
                                    <div className="text-xs text-gray-500 flex gap-2 mt-1">
                                        <span>{p.numero_documento}</span>
                                        {p.email && <span>{p.email}</span>}
                                        {p.telefono && <span>{p.telefono}</span>}
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}

                    {seleccionado && (
                        <div className="mt-3">
                            <div className="card bg-base-100 shadow-sm p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="font-semibold">{seleccionado.nombre || seleccionado.name}</div>
                                        <div className="text-xs text-gray-500">{seleccionado.numero_documento} {seleccionado.email ? `• ${seleccionado.email}` : ''}</div>
                                        <div className="text-xs text-gray-500 mt-1">{seleccionado.tipo_usuario === 'usuario' ? 'Usuario' : 'Cliente'}</div>
                                    </div>
                                    <div>
                                        <button type="button" className="btn btn-sm" onClick={() => onSeleccionar(null)}>Limpiar selección</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {(modoNuevo || !seleccionado) && (
                <>
                    <div className="divider text-xs uppercase opacity-50">Datos de la Reserva</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Campo id="name" label="Nombre Completo" value={form.name} onChange={onChange} error={errores.name} required />
                        <Campo id="email" label="Email" type="email" value={form.email} onChange={onChange} error={errores.email} />

                        <Campo id="tipo_documento" label="Tipo Doc" as="select" value={form.tipo_documento} onChange={onChange}>
                            <option value="dni">DNI</option>
                            <option value="pasaporte">Pasaporte</option>
                            <option value="tie">TIE</option>
                        </Campo>
                        <Campo id="numero_documento" label="Num. Documento" value={form.numero_documento} onChange={onChange} error={errores.numero_documento} required />

                        <Campo id="telefono" label="Teléfono" type="tel" value={form.telefono} onChange={onChange} error={errores.telefono} />
                        <Campo id="nacionalidad" label="Nacionalidad" value={form.nacionalidad} onChange={onChange} />
                    </div>

                    <Campo id="direccion" label="Dirección" value={form.direccion} onChange={onChange} />

                    {!hideDates && (
                        <div className="grid grid-cols-2 gap-4">
                            <Campo id="check_in" label="Entrada" type="date" value={form.check_in} onChange={onChange} error={errores.check_in} required />
                            <Campo id="check_out" label="Salida" type="date" value={form.check_out} onChange={onChange} error={errores.check_out} required />
                        </div>
                    )}

                    {errores.fechas && <div className="text-error text-sm text-center font-medium">{errores.fechas}</div>}

                    {!hideNextButton && (
                        <div className="pt-4 flex justify-end">
                            <PrimaryButton type="submit" disabled={!form.name || !form.numero_documento || (!hideDates && (!form.check_in || !form.check_out))}>
                                Siguiente Paso <ArrowRightIcon className="w-4 h-4 ml-2" />
                            </PrimaryButton>
                        </div>
                    )}
                </>
            )}
        </form>
    );
}
