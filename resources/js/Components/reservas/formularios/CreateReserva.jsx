import Boton from '@/Components/UI/Boton';
import useCreateReserva from '@/hooks/reservas/useCreateReserva';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

import { CalendarIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';

import FechasPanel from '@/Components/buscadores/FechasPanel';
import ClientePanel from '@/Components/formularios/create/ClientePanel';
import HabitacionesSelector from '@/Components/reservas/formularios/HabitacionesSelector';
import PagoPanel from '@/Components/reservas/formularios/PagoPanel.jsx';
import ModalConfirmacionReserva from '@/Components/reservas/modales/ModalConfirmacionReserva';
import CreateReservaTabs from '@/Components/tabs/CreateReservaTabs';
import CreateReservaFooter from '@/Components/UI/CreateReservaFooter';
import CreateReservaHeader from '@/Components/UI/CreateReservaHeader';

import TarifasSelector from '@/Components/reservas/formularios/TarifasSelector';

export default function CreateReserva({ iconOnly = false }) {
    const {
        abierto,
        setAbierto,
        tabActiva,
        setTabActiva,
        cargandoHabitaciones,
        clienteSeleccionado,
        habitacionesPorTipo,
        precioCalculado,
        tarifas,
        tarifasSeleccionadas,
        aceptaTerminos,
        setAceptaTerminos,
        mostrarModalConfirmacion,
        setMostrarModalConfirmacion,
        datosReservaConfirmada,
        setDatosReservaConfirmada,
        formulario,
        cambiar,
        errores,
        estaCargando,
        actualizarCampo,
        handleCerrar,
        cambiarCantidadHabitaciones,
        seleccionObj,
        onTarifasSeleccionChange,
        handleSeleccionarCliente,
        esFormularioCompleto,
        guardarReserva,
        onPagoExitoso,
        estaGuardando,
    } = useCreateReserva();

    const page = usePage();

    useEffect(() => {
        const errors = page?.props?.errors || {};
        if (errors && errors.habitaciones) {
            setTabActiva('fechas');
        }
    }, [page?.props?.errors, setTabActiva]);

    return (
        <>
            <Boton
                onClick={() => setAbierto(true)}
                icon={CalendarIcon}
                variant="primary"
                size={iconOnly ? 'sm' : 'md'}
                className={iconOnly ? '!px-3 !py-3' : ''}
                title="Nueva Reserva"
                aria-label="Nueva Reserva"
            >
                {!iconOnly && 'Nueva Reserva'}
            </Boton>

            <div
                className={`fixed inset-0 z-[9999] overflow-hidden transition-all duration-300 md:top-16 ${abierto ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
                    role="button"
                    tabIndex={0}
                    onClick={handleCerrar}
                    onKeyDown={(e) => {
                        if (
                            e.key === 'Escape' ||
                            e.key === 'Enter' ||
                            e.key === ' '
                        )
                            handleCerrar();
                    }}
                />
                <div
                    className={`absolute inset-0 flex w-full max-w-full transform flex-col bg-white shadow-2xl transition-transform duration-500 md:bottom-0 md:left-auto md:right-0 md:top-0 md:max-w-2xl ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden rounded-none md:!rounded-l-[2rem]`}
                >
                    {/* Header estilo Gludio */}
                    <CreateReservaHeader onCerrar={handleCerrar} />

                    {/* Navegación por Pestañas */}
                    <CreateReservaTabs
                        tabActiva={tabActiva}
                        setTabActiva={setTabActiva}
                        errores={errores}
                    />

                    {/* Formulario con scroll independiente */}
                    <form
                        onSubmit={guardarReserva}
                        className="flex min-h-0 flex-1 flex-col bg-white"
                        aria-label="Formulario nueva reserva"
                    >
                        <div className="flex-1 space-y-8 overflow-y-auto p-8">
                            {/* Pestaña: Fechas */}
                            {tabActiva === 'fechas' && (
                                <div className="animate-in fade-in space-y-6 duration-300">
                                    <FechasPanel
                                        formulario={formulario}
                                        cambiar={cambiar}
                                        errores={errores}
                                    />

                                    <HabitacionesSelector
                                        formulario={formulario}
                                        cargando={cargandoHabitaciones}
                                        habitacionesPorTipo={
                                            habitacionesPorTipo
                                        }
                                        cambiarCantidadHabitaciones={
                                            cambiarCantidadHabitaciones
                                        }
                                    />
                                </div>
                            )}

                            {/* Pestaña: Cliente */}
                            {tabActiva === 'cliente' && (
                                <div className="animate-in fade-in space-y-6 duration-300">
                                    <ClientePanel
                                        formulario={formulario}
                                        cambiar={cambiar}
                                        errores={errores}
                                        clienteSeleccionado={
                                            clienteSeleccionado
                                        }
                                        onSeleccionarCliente={
                                            handleSeleccionarCliente
                                        }
                                    />
                                </div>
                            )}

                            {/* Pestaña: Tarifas */}
                            {tabActiva === 'tarifas' && (
                                <div className="animate-in fade-in space-y-6 duration-300">
                                    <TarifasSelector
                                        tarifas={tarifas}
                                        seleccion={seleccionObj}
                                        onChange={onTarifasSeleccionChange}
                                    />
                                </div>
                            )}

                            {/* Pestaña: Pago */}
                            {tabActiva === 'pago' && (
                                <div className="animate-in fade-in space-y-6 duration-300">
                                    <PagoPanel
                                        formulario={formulario}
                                        cambiar={(eOrId, value) => {
                                            if (typeof eOrId === 'string')
                                                actualizarCampo(eOrId, value);
                                            else cambiar(eOrId);
                                        }}
                                        errores={errores}
                                        precioCalculado={precioCalculado}
                                        habitacionesPorTipo={
                                            habitacionesPorTipo
                                        }
                                        tarifasSeleccionadas={
                                            tarifasSeleccionadas
                                        }
                                        aceptaTerminos={aceptaTerminos}
                                        setAceptaTerminos={setAceptaTerminos}
                                        onPagoExitoso={onPagoExitoso}
                                    />
                                </div>
                            )}
                        </div>

                        {!(
                            formulario.metodo_pago === 'tarjeta' &&
                            import.meta.env.VITE_STRIPE_PUBLIC_KEY
                        ) && (
                            <CreateReservaFooter
                                precioCalculado={precioCalculado}
                                estaCargando={estaCargando}
                                esFormularioCompleto={esFormularioCompleto}
                                handleCerrar={handleCerrar}
                                formulario={formulario}
                                estaGuardando={estaGuardando}
                            />
                        )}
                    </form>
                </div>
            </div>

            {/* Modal de Confirmación tras pago */}
            <ModalConfirmacionReserva
                reserva={datosReservaConfirmada}
                isOpen={mostrarModalConfirmacion}
                onClose={() => {
                    setMostrarModalConfirmacion(false);
                    setDatosReservaConfirmada(null);
                    // Recargar lista de reservas para reflejar la nueva reserva
                    try {
                        router.reload({ only: ['reservas'] });
                    } catch (e) {
                        window.location.reload();
                    }
                }}
            />
        </>
    );
}
