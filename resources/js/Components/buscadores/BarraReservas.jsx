import BuscadorNavbar from '@/Components/buscadores/BuscadorNavbar';
import ModalPaso from '@/Components/reservas/pasos/ModalPaso';
import Paso2Habitaciones from '@/Components/reservas/pasos/Paso2Habitaciones';
import Paso3Datos from '@/Components/reservas/pasos/Paso3Datos';
import Paso4Confirmacion from '@/Components/reservas/pasos/Paso4Confirmacion';
import useBarraReservas from '@/hooks/reservas/useBarraReservas';
import FechaEntrada from './FechaEntrada';
import FechaSalida from './FechaSalida';
import HuespedesField from './HuespedesField';
import '../../../css/createHabitacion.css';
import '../../../css/estiloCalendario.css';
import '../../../css/estiloMenuLateral.css';

export default function BarraReservas() {
    const {
        formularioReserva,
        esPanelControl,
        calendarioAbierto,
        setCalendarioAbierto,
        calendarioRef,
        preciosPorDia,
        componentesDia,
        esMobile,
        formatearISO,
    } = useBarraReservas();

    return (
        <>
            {/* MODALES */}
            <ModalPaso
                paso={2}
                pasoActual={formularioReserva.pasoActual}
                onClose={() => formularioReserva.retrocederPaso()}
                maxWidth="fit"
            >
                <Paso2Habitaciones {...formularioReserva} />
            </ModalPaso>

            <ModalPaso
                paso={3}
                pasoActual={formularioReserva.pasoActual}
                onClose={() => formularioReserva.retrocederPaso()}
                maxWidth="max-w-2xl"
            >
                <Paso3Datos {...formularioReserva} />
            </ModalPaso>

            <ModalPaso
                paso={4}
                pasoActual={formularioReserva.pasoActual}
                onClose={() => formularioReserva.retrocederPaso()}
                maxWidth="max-w-4xl"
            >
                <Paso4Confirmacion
                    {...formularioReserva}
                    usuarioActual={formularioReserva.usuarioActual}
                    getValues={formularioReserva.getValues}
                    idClienteSeleccionado={
                        formularioReserva.idClienteSeleccionado
                    }
                    tipoClienteSeleccionado={
                        formularioReserva.tipoClienteSeleccionado
                    }
                    habitacionesDisponibles={
                        formularioReserva.habitacionesDisponibles
                    }
                />
            </ModalPaso>

            {/* BARRA STICKY */}
            {!esPanelControl && (
                <div className="sticky top-16 z-40 bg-gris shadow-md">
                    <div className="relative px-4 py-3">
                        <div className="flex items-center justify-center gap-3 md:justify-center">
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <FechaEntrada
                                    formularioReserva={formularioReserva}
                                    calendarioAbierto={calendarioAbierto}
                                    setCalendarioAbierto={setCalendarioAbierto}
                                    calendarioRef={calendarioRef}
                                    preciosPorDia={preciosPorDia}
                                    componentesDia={componentesDia}
                                    esMobile={esMobile}
                                    formatearISO={formatearISO}
                                />

                                <FechaSalida
                                    formularioReserva={formularioReserva}
                                    calendarioAbierto={calendarioAbierto}
                                    setCalendarioAbierto={setCalendarioAbierto}
                                    calendarioRef={calendarioRef}
                                    preciosPorDia={preciosPorDia}
                                    componentesDia={componentesDia}
                                    esMobile={esMobile}
                                    formatearISO={formatearISO}
                                />

                                <HuespedesField formularioReserva={formularioReserva} />
                            </div>

                            <div className="absolute right-4 hidden items-center gap-4 px-2 py-1 lg:flex">
                                <div className="w-80 flex-shrink-0">
                                    <BuscadorNavbar />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
