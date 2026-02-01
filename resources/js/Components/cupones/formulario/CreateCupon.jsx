import Campo from '@/Components/formulario/Campo';
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
        usos_por_usuario: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activo: true,
        descripcion: '',
    };

    const { formulario, cambiar, errores, estaCargando, guardar, limpiar, setData } = useFormGenerico(
        datosIniciales,
        '/cupones',
        '',
        () => {
            setAbierto(false);
            limpiar();
            if (onSuccess) onSuccess();
        }
    );

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
            <button
                onClick={() => setAbierto(true)}
                className={`flex items-center gap-2 bg-[#7a0202] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#5a0101] transition shadow-md ${iconOnly ? 'p-3' : 'px-6 py-3'}`}
                title="Nuevo Cupón"
                aria-label="Nuevo Cupón"
            >
                <TicketIcon className="h-5 w-5" /> {!iconOnly && ' Nuevo Cupón'}
            </button>

            {/* CONTENEDOR RAIZ: Z-index extremo para flotar entre header y footer */}
            <div className={`fixed inset-x-0 top-16 bottom-0 z-[9999] transition-all duration-300 ${abierto ? 'visible' : 'invisible'}`}>

                {/* Backdrop (Oscurecimiento del fondo) */}
                <div
                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
                    onClick={handleCerrar}
                />

                {/* Panel Lateral (Slide-over) */}
                <div className={`absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-500 transform ${abierto ? 'translate-x-0' : 'translate-x-full'} !rounded-l-[2rem] overflow-hidden`}>

                    {/* Header estilo Gludio */}
                    <header className="flex-none p-6 border-b border-gray-100 bg-white flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                Alta de <span className="text-[#7a0202]">Cupón</span>
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Códigos Promocionales</p>
                        </div>
                        <button
                            onClick={handleCerrar}
                            className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-[#7a0202] rounded-2xl transition-all border border-gray-100 shadow-sm"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </header>

                    {/* Formulario con scroll independiente */}
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-white">
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                            <div className="space-y-6 animate-in fade-in duration-300">
                                <Campo
                                    id="codigo"
                                    label="Código del Cupón"
                                    value={formulario.codigo.toUpperCase()}
                                    onChange={(e) => cambiar({ target: { name: 'codigo', value: e.target.value.toUpperCase() } })}
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
                                        <option value="porcentaje">Porcentaje (%)</option>
                                        <option value="monto_fijo">Monto Fijo (€)</option>
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

                                <div className="grid grid-cols-2 gap-4">
                                    <Campo
                                        id="usos_maximos"
                                        label="Usos Totales (vacío = ilimitado)"
                                        type="number"
                                        min="1"
                                        value={formulario.usos_maximos}
                                        onChange={cambiar}
                                        error={errores.usos_maximos}
                                        placeholder="100"
                                    />

                                    <Campo
                                        id="usos_por_usuario"
                                        label="Usos por Usuario (vacío = ilimitado)"
                                        type="number"
                                        min="1"
                                        value={formulario.usos_por_usuario}
                                        onChange={cambiar}
                                        error={errores.usos_por_usuario}
                                        placeholder="Ej: 3"
                                    />
                                </div>

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

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="activo"
                                            checked={formulario.activo}
                                            onChange={(e) => cambiar({ target: { name: 'activo', value: e.target.checked } })}
                                            className="w-4 h-4 rounded border-gray-300 text-[#7a0202] focus:ring-[#7a0202]"
                                        />
                                        <span className="text-sm font-semibold text-gray-700">Cupón activo</span>
                                    </label>
                                </div>
                            </div>

                        </div>

                        {/* Footer con botones */}
                        <footer className="flex-none p-6 border-t border-gray-100 bg-white flex gap-3">
                            <button
                                type="button"
                                onClick={handleCerrar}
                                className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={estaCargando}
                                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-[#7a0202] rounded-xl hover:bg-[#5a0101] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 uppercase tracking-wider shadow-md"
                            >
                                {estaCargando ? 'Guardando...' : 'Crear Cupón'}
                            </button>
                        </footer>
                    </form>
                </div>
            </div>
        </>
    );
}
