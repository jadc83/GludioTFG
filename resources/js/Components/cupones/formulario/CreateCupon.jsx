import Campo from '@/Components/formulario/Campo';
import Boton from '@/Components/UI/Boton';
import { useFormGenerico } from '@/hooks/useFormGenerico';
import { TicketIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function CreateCupon({ iconOnly = false, onSuccess = null }) {
    const [abierto, setAbierto] = useState(false);

    const datosIniciales = {
        codigo: '',
        tipo: 'porcentaje',
        valor: '',
        usos_maximos: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        activo: true,
        descripcion: '',
    };

    const { formulario, cambiar, errores, estaCargando, guardar, limpiar } =
        useFormGenerico(datosIniciales, '/cupones', '', () => {
            setAbierto(false);
            limpiar();
            if (onSuccess) onSuccess();
        });

    const handleCerrar = () => {
        setAbierto(false);
        limpiar();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        guardar(e);
    };

    return (
        <>
            <Boton
                onClick={() => setAbierto(true)}
                icon={TicketIcon}
                size={iconOnly ? 'sm' : 'md'}
                className={iconOnly ? '!px-3 !py-3' : ''}
                title="Nuevo Cupón"
                aria-label="Nuevo Cupón"
            >
                {!iconOnly && 'Nuevo Cupón'}
            </Boton>

            {/* CONTENEDOR RAIZ: Z-index extremo para flotar entre header y footer */}
            <div
                className={`fixed inset-0 z-[9999] overflow-hidden transition-all duration-300 md:top-16 ${abierto ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
            >
                {/* Backdrop (Oscurecimiento del fondo) */}
                <div
                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
                    onClick={handleCerrar}
                />

                {/* Panel Lateral (Slide-over) */}
                <div
                    className={`absolute inset-0 flex w-full max-w-full transform flex-col bg-white shadow-2xl transition-transform duration-500 md:bottom-0 md:left-auto md:right-0 md:top-0 md:max-w-md ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden rounded-none md:!rounded-l-[2rem]`}
                >
                    {/* Header estilo Gludio */}
                    <header className="flex flex-none items-center justify-between border-b border-gray-100 bg-white p-6">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                                Alta de{' '}
                                <span className="text-[#7a0202]">Cupón</span>
                            </h3>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Códigos Promocionales
                            </p>
                        </div>
                        <button
                            onClick={handleCerrar}
                            className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-[#7a0202]"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </header>

                    {/* Formulario con scroll independiente */}
                    <form
                        onSubmit={handleSubmit}
                        className="flex min-h-0 flex-1 flex-col bg-white"
                    >
                        <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-8">
                            <div className="animate-in fade-in space-y-6 duration-300">
                                <Campo
                                    id="codigo"
                                    label="Código del Cupón"
                                    value={formulario.codigo.toUpperCase()}
                                    onChange={(e) =>
                                        cambiar({
                                            target: {
                                                name: 'codigo',
                                                value: e.target.value.toUpperCase(),
                                            },
                                        })
                                    }
                                    error={errores.codigo}
                                    placeholder="BIENVENIDA10"
                                    required
                                    claseExtra="font-mono text-lg uppercase"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Campo
                                        id="tipo"
                                        label="Tipo de Descuento"
                                        as="select"
                                        value={formulario.tipo}
                                        onChange={cambiar}
                                        error={errores.tipo}
                                        required
                                    >
                                        <option value="porcentaje">
                                            Porcentaje (%)
                                        </option>
                                        <option value="monto_fijo">
                                            Monto Fijo (€)
                                        </option>
                                    </Campo>

                                    <Campo
                                        id="valor"
                                        label={`Valor ${formulario.tipo === 'porcentaje' ? '(%)' : '(€)'}`}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formulario.valor}
                                        onChange={cambiar}
                                        error={errores.valor}
                                        required
                                        placeholder="10"
                                    />
                                </div>

                                <Campo
                                    id="usos_maximos"
                                    label="Usos Máximos (vacío = ilimitado)"
                                    type="number"
                                    min="1"
                                    value={formulario.usos_maximos}
                                    onChange={cambiar}
                                    error={errores.usos_maximos}
                                    placeholder="100"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Campo
                                        id="fecha_inicio"
                                        label="Fecha Inicio"
                                        type="date"
                                        value={formulario.fecha_inicio}
                                        onChange={cambiar}
                                        error={errores.fecha_inicio}
                                        required
                                    />

                                    <Campo
                                        id="fecha_fin"
                                        label="Fecha Fin"
                                        type="date"
                                        value={formulario.fecha_fin}
                                        onChange={cambiar}
                                        error={errores.fecha_fin}
                                        required
                                    />
                                </div>

                                <Campo
                                    id="descripcion"
                                    label="Descripción Pública"
                                    as="textarea"
                                    rows={3}
                                    value={formulario.descripcion}
                                    onChange={cambiar}
                                    error={errores.descripcion}
                                    placeholder="Visible para usuarios. Ej: 'Descuento de bienvenida para nuevos clientes'"
                                />

                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                    <label className="flex cursor-pointer items-center gap-3">
                                        <input
                                            type="checkbox"
                                            name="activo"
                                            checked={formulario.activo}
                                            onChange={(e) =>
                                                cambiar({
                                                    target: {
                                                        name: 'activo',
                                                        value: e.target.checked,
                                                    },
                                                })
                                            }
                                            className="h-4 w-4 rounded border-gray-300 text-[#7a0202] focus:ring-[#7a0202]"
                                        />
                                        <span className="text-sm font-semibold text-gray-700">
                                            Cupón activo
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Footer con botones */}
                        <footer className="flex flex-none gap-3 border-t border-gray-100 bg-white p-6">
                            <button
                                type="button"
                                onClick={handleCerrar}
                                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-gray-700 transition-all duration-200 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <Boton
                                type="submit"
                                disabled={estaCargando}
                                loading={estaCargando}
                                className="flex-1"
                            >
                                Crear Cupón
                            </Boton>
                        </footer>
                    </form>
                </div>
            </div>
        </>
    );
}
