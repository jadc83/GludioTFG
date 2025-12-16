import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import PrimaryButton from './PrimaryButton';
import ApplicationLogo from '@/Components/ApplicationLogo';
import CreateReservaPaso1 from './reservas/formulario/CreateReservaPaso1';
import '../../css/estiloCalendario.css';
import '../../css/createHabitacion.css';
import '../../css/estiloMenuLateral.css';
import useFormularioMenuLateral from '../hooks/useMenuLateralForm';

export default function Reservas() {
    const {
        paso,
        setPaso,
        rango,
        setRango,
        form,
        formData,
        modoNuevo,
        setModoNuevo,
        query,
        setQuery,
        resultados,
        cargando,
        seleccionado,
        seleccionarCliente,
        reservableId,
        reservableTipo,
        availableRooms,
        loadingRooms,
        selectedRooms,
        actualizarSeleccionHabitacion,
        eliminarTipoHabitacion,
        getTotalRoomsSelected,
        resetSeleccion,
        error,
        limpiarRango,
        continuar,
        volverAtras,
        cambioCampo,
        handleNext,
        onConfirmar,
        formatDate,
        getRoomTypes,
        getRoomTypeImage,
        getRoomTypeIcon,
        reservaNoEsParaMi,
        setReservaNoEsParaMi,
        currentUser,
    } = useFormularioMenuLateral();

    const Migitas = () => (
        <nav aria-label="Progreso de reserva" className="mx-auto mb-4 flex max-w-md justify-center space-x-2 rounded bg-gris p-2 text-sm">
            {['Fechas', 'Datos', 'Habitación', 'Confirmar'].map((etiqueta, indice) => (
                <span key={indice} className={`rounded-md px-3 py-1 ${paso === indice + 1 ? 'bg-black text-white' : 'bg-gris text-black'}`}>
                    {etiqueta}
                </span>
            ))}
        </nav>
    );

    const [mostrarErrorFormulario, setMostrarErrorFormulario] = useState(false);
    const [mensajeErrorFormulario, setMensajeErrorFormulario] = useState('');

    useEffect(() => {
        if (!form) return;
        const errores = form.errors || {};
        const keys = Object.keys(errores);
        if (keys.length > 0) {
            const first = errores[keys[0]];
            setMensajeErrorFormulario(first);
            setMostrarErrorFormulario(true);
            const id = setTimeout(() => {
                try { form.clearErrors(); } catch (e) {}
                setMostrarErrorFormulario(false);
                setMensajeErrorFormulario('');
            }, 5000);
            return () => clearTimeout(id);
        }
    }, [form]);

    return (
        <section className="drawer drawer-end z-50" aria-label="Panel lateral de reserva">
            <input id="drawer-toggle" type="checkbox" className="drawer-toggle" aria-controls="drawer-side" />
            <aside id="drawer-side" className="drawer-side h-screen" aria-label="Menú lateral de reserva">
                <label htmlFor="drawer-toggle" className="drawer-overlay" tabIndex={-1} aria-hidden="true"></label>
                <div className="h-full w-[600px] bg-gris" aria-labelledby="titulo-meses" role="region">
                    <div className="relative flex h-full flex-col bg-gris">

                        {error && (
                            <div className="toast toast-center toast-top z-50">
                                <div className="alert alert-error shadow-lg">
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}

                        {mostrarErrorFormulario && (
                            <div className="toast toast-center toast-top z-50">
                                <div className="alert alert-warning shadow-lg">
                                    <span>{mensajeErrorFormulario}</span>
                                </div>
                            </div>
                        )}

                        {paso === 1 && (
                            <main className="flex h-full flex-col bg-gris p-4">
                                <header>
                                    <h2 className="mb-4 text-center text-lg font-bold text-red-700">Reservar fechas</h2>

                                    <div className="w-full flex justify-center mb-4">
                                        <div className="w-full max-w-md overflow-hidden rounded-lg banner-navidad">
                                            <div className="flex items-center mr-3">
                                                <ApplicationLogo className="banner-logo h-10 w-10" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-semibold">Oferta de Navidad — 15% dto</h4>
                                                <p className="text-xs">Reserva entre 20 dic y 5 ene y obtén un 15% de descuento con el código <strong>NAVIDAD15</strong>. Plazas limitadas.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Migitas />
                                </header>

                                <div className="flex flex-1 items-center justify-center">
                                    <div className="w-full max-w-md">
                                        <DayPicker mode="range" selected={rango} onSelect={setRango} locale={es} disabled={{ before: new Date() }} />
                                    </div>
                                </div>
                                {currentUser && (
                                    <div className="px-4 pt-2">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={reservaNoEsParaMi} onChange={(e) => setReservaNoEsParaMi(e.target.checked)} className="checkbox" />
                                            Esta reserva no es para mí
                                        </label>
                                    </div>
                                )}
                                <footer className="px-4 py-3 bg-gris border-t border-gray-300">
                                    <div className="flex justify-between items-center gap-3">
                                        <PrimaryButton onClick={limpiarRango}>Limpiar</PrimaryButton>
                                        <PrimaryButton onClick={continuar}>Continuar</PrimaryButton>
                                    </div>
                                </footer>
                            </main>
                        )}

                        {paso === 2 && (
                            <div className="flex h-full flex-col bg-gris p-4">
                                <header className="mb-4">
                                    <h3 className="mb-4 text-center text-2xl font-bold titulo-rojo">Datos del cliente</h3>
                                    <Migitas />
                                </header>
                                <main className="flex-1 overflow-y-auto">
                                    <CreateReservaPaso1
                                        form={{ ...formData, check_in: rango?.from ? formatDate(rango.from) : '', check_out: rango?.to ? formatDate(rango.to) : '' }}
                                        errores={form.errors}
                                        onChange={cambioCampo}
                                        onNext={(e) => { e.preventDefault(); handleNext(); }}
                                        searchProps={{ modoNuevo, setModoNuevo, query, setQuery, resultados, cargando, seleccionado, onSeleccionar: seleccionarCliente }}
                                        hideDates={true}
                                        hideNextButton={true}
                                    />
                                </main>
                                <footer className="py-3 bg-gris border-t border-gray-300">
                                    <div className="flex justify-between items-center gap-3">
                                        <PrimaryButton type="button" onClick={volverAtras}>Atrás</PrimaryButton>
                                        <PrimaryButton onClick={handleNext}>Siguiente</PrimaryButton>
                                    </div>
                                </footer>
                            </div>
                        )}

                            {paso === 3 && (
                                <div className="flex h-full flex-col bg-gris">
                                    <header className="px-4 pt-4 pb-3 bg-gris">
                                        <h3 className="text-xl font-bold text-center mb-2 titulo-rojo titulo-espaciado">
                                            Selecciona tus habitaciones
                                        </h3>
                                        <Migitas />
                                    </header>

                                    <main className="flex-1 overflow-y-auto px-3 py-2 bg-gris">
                                        {loadingRooms ? (
                                            <div className="flex flex-col items-center justify-center py-20">
                                                <span className="loading loading-spinner loading-lg spinner-rojo"></span>
                                                <p className="mt-4 text-sm text-gray-500">Buscando disponibilidad...</p>
                                            </div>
                                        ) : Object.keys(getRoomTypes()).length === 0 ? (
                                            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                                <div className="text-6xl mb-4">😔</div>
                                                <p className="text-lg text-gray-600">No hay habitaciones disponibles</p>
                                                <p className="text-sm text-gray-400 mt-2">Intenta con otras fechas</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {Object.entries(getRoomTypes()).map(([tipo, info]) => {

                                                    const isSelected = selectedRooms[tipo]?.cantidad > 0;
                                                    return (
                                                        <div key={tipo} className={`group relative bg-white rounded-lg overflow-hidden transition-all duration-200 ${isSelected ? 'shadow-lg ring-2 ring-opacity-50 tarjeta-seleccionada' : 'shadow hover:shadow-md'}`}>
                                                            {isSelected && (
                                                                <div className="absolute top-0 left-0 right-0 h-0.5 barra-acento"></div>
                                                            )}

                                                            <div className="relative h-28 overflow-hidden">
                                                                <img src={getRoomTypeImage(tipo)} alt={`Habitación ${tipo}`}
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                                                                <div className="absolute bottom-0 left-0 right-0 p-2">
                                                                    <h4 className="text-base font-bold text-white mb-0 drop-shadow-lg">{tipo}</h4>
                                                                    <div className="flex items-center gap-1 text-[10px] text-white/90">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                        </svg>
                                                                        <span>{info.maxCap} {info.maxCap === 1 ? 'persona' : 'personas'}</span>
                                                                    </div>
                                                                </div>
                                                                {info.minPrice && (
                                                                    <div className="absolute top-1.5 right-1.5 bg-white rounded shadow px-1.5 py-0.5">
                                                                        <div className="flex items-baseline gap-0.5">
                                                                            <span className="text-sm font-black precio-min">{info.minPrice}</span>
                                                                            <span className="text-[10px] font-bold text-gray-400">€</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="p-3">

                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div className="flex flex-col items-center">
                                                                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 text-center">
                                                                                Habitaciones
                                                                            </label>
                                                                            <div className="join">
                                                                                <button type="button" onClick={() => actualizarSeleccionHabitacion(tipo, 'cantidad', Math.max(0, (selectedRooms[tipo]?.cantidad || 0) - 1))}
                                                                                    disabled={(selectedRooms[tipo]?.cantidad || 0) === 0}
                                                                                    className={`btn join-item btn-sm font-bold text-lg min-w-[3rem] ${ (selectedRooms[tipo]?.cantidad || 0) === 0 ? 'boton-deshabilitado' : 'boton-activo' }`}>
                                                                                    −
                                                                                </button>
                                                                                <span className="join-item flex items-center justify-center bg-white border-y border-gray-300 px-4 text-lg font-black numero-unidad">
                                                                                    {selectedRooms[tipo]?.cantidad || 0}
                                                                                </span>
                                                                                <button type="button" onClick={() => actualizarSeleccionHabitacion(tipo, 'cantidad', Math.min(Math.min(info.count, 5), (selectedRooms[tipo]?.cantidad || 0) + 1))}
                                                                                    disabled={(selectedRooms[tipo]?.cantidad || 0) >= Math.min(info.count, 5)}
                                                                                    className={`btn join-item btn-sm font-bold text-lg min-w-[3rem] ${ (selectedRooms[tipo]?.cantidad || 0) >= Math.min(info.count, 5) ? 'boton-deshabilitado' : 'boton-activo' }`}>
                                                                                    +
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-center">
                                                                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 text-center">
                                                                                Huéspedes
                                                                            </label>
                                                                            <div className="join">
                                                                                <button type="button" onClick={() => actualizarSeleccionHabitacion(tipo, 'personas', Math.max(1, (selectedRooms[tipo]?.personas || 1) - 1))}
                                                                                    disabled={!isSelected || (selectedRooms[tipo]?.personas || 1) === 1}
                                                                                    className={`btn join-item btn-sm font-bold text-lg min-w-[3rem] ${ !isSelected || (selectedRooms[tipo]?.personas || 1) === 1 ? 'boton-deshabilitado' : 'boton-activo' }`}>
                                                                                    −
                                                                                </button>
                                                                                <span className="join-item flex items-center justify-center bg-white border-y border-gray-300 px-4 text-lg font-black numero-unidad">
                                                                                    {selectedRooms[tipo]?.personas || 1}
                                                                                </span>
                                                                                <button type="button" onClick={() => actualizarSeleccionHabitacion(tipo, 'personas', Math.min(info.maxCap, (selectedRooms[tipo]?.personas || 1) + 1))}
                                                                                    disabled={!isSelected || (selectedRooms[tipo]?.personas || 1) >= info.maxCap}
                                                                                    className={`btn join-item btn-sm font-bold text-lg min-w-[3rem] ${ !isSelected || (selectedRooms[tipo]?.personas || 1) >= info.maxCap ? 'boton-deshabilitado' : 'boton-activo' }`}>
                                                                                    +
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </main>

                                    <footer className="px-4 py-3 bg-gris border-t border-gray-300">
                                        <div className="flex justify-between items-center gap-3">
                                            <PrimaryButton onClick={volverAtras} className="px-6">
                                                ← Atrás
                                            </PrimaryButton>
                                            <PrimaryButton onClick={continuar} disabled={getTotalRoomsSelected() === 0} className="px-8">
                                                Continuar →
                                            </PrimaryButton>
                                        </div>
                                    </footer>
                                </div>
                            )}

                            {paso === 4 && (
                            <main className="flex h-full flex-col bg-gris p-4">
                                <header className="mb-4">
                                    <h3 className="mb-4 text-center text-2xl font-bold titulo-rojo">Confirmación de reserva</h3>
                                    <Migitas />
                                </header>
                                <section className="flex-1 overflow-y-auto bg-gris" aria-labelledby="resumen-reserva">
                                    <div className="card bg-white shadow-md p-6">
                                        <table className="w-full text-sm">
                                            <tbody>
                                                <tr className="border-b">
                                                    <th className="py-3 pr-4 font-semibold text-left w-2/5 text-gray-700">Nombre:</th>
                                                    <td className="py-3 text-left">{formData.name}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <th className="py-3 pr-4 font-semibold text-left text-gray-700">Email:</th>
                                                    <td className="py-3 text-left">{formData.email}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <th className="py-3 pr-4 font-semibold text-left text-gray-700">Teléfono:</th>
                                                    <td className="py-3 text-left">{formData.telefono}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <th className="py-3 pr-4 font-semibold text-left text-gray-700">Documento:</th>
                                                    <td className="py-3 text-left">{formData.tipo_documento.toUpperCase()} - {formData.numero_documento}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <th className="py-3 pr-4 font-semibold text-left text-gray-700">Nacionalidad:</th>
                                                    <td className="py-3 text-left">{formData.nacionalidad}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <th className="py-3 pr-4 font-semibold text-left text-gray-700">Dirección:</th>
                                                    <td className="py-3 text-left">{formData.direccion}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <th className="py-3 pr-4 font-semibold text-left text-gray-700">Fechas:</th>
                                                    <td className="py-3 text-left font-medium">
                                                        {rango?.from?.toLocaleDateString()} - {rango?.to?.toLocaleDateString()}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th className="py-3 pr-4 font-semibold text-left text-gray-700 align-top">Habitaciones solicitadas:</th>
                                                    <td className="py-3 text-left">
                                                        {Object.entries(selectedRooms).filter(([_, r]) => r.cantidad > 0).map(([tipo, r]) => (
                                                            <div key={tipo} className="mb-1.5">
                                                                {getRoomTypeIcon(tipo)} <strong>{r.cantidad}x {tipo}</strong> ({(r.personas || 1)} {(r.personas || 1) === 1 ? 'huésped' : 'huéspedes'})
                                                                <div className="text-xs text-gray-500 mt-0.5">Se asignarán automáticamente al confirmar</div>
                                                            </div>
                                                        ))}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {Object.keys(selectedRooms).length > 0 && (
                                        <div className="card bg-white shadow-md p-6 mt-4">
                                            <h4 className="font-bold text-base mb-3 titulo-rojo">Habitaciones seleccionadas</h4>
                                            <div className="space-y-2">
                                                {Object.entries(selectedRooms).filter(([_, data]) => (data.cantidad || 0) > 0).map(([tipo, data]) => (
                                                    <div key={tipo} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                                            <div>
                                                            <span className="font-semibold">{tipo}</span>
                                                            <span className="text-sm text-gray-600 ml-2">({data.cantidad} hab. × {(data.personas || 1)} pers.)</span>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">Total: {data.cantidad * (data.personas || 1)} personas</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6 p-5 bg-blue-50 border-2 border-blue-300 rounded-lg">
                                        <div className="text-center">
                                            <p className="font-bold text-blue-800 text-base mb-2">
                                                ℹ️ Asignación automática de habitaciones
                                            </p>
                                            <p className="text-sm text-blue-700">
                                                Al confirmar, el sistema asignará automáticamente los números de habitación según disponibilidad.
                                                {getTotalRoomsSelected() > 1 && ' Intentaremos asignar habitaciones contiguas cuando sea posible.'}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                                <footer className="py-3 bg-gris border-t border-gray-300">
                                    <div className="flex justify-between items-center gap-3">
                                        <PrimaryButton onClick={volverAtras}>Atrás</PrimaryButton>
                                        <PrimaryButton onClick={() => onConfirmar()}>Confirmar Reserva</PrimaryButton>
                                    </div>
                                </footer>
                            </main>
                        )}
                    </div>
                </div>
            </aside>
        </section>
    );
}
