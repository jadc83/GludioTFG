import useReservaForm from '../hooks/useReservaForm';
import Paso1Fechas from './reservas/Paso1Fechas';
import Paso2Habitaciones from './reservas/Paso2Habitaciones';
import Paso3Datos from './reservas/Paso3Datos';
import Paso4Confirmacion from './reservas/Paso4Confirmacion';
import '../../css/createHabitacion.css';
import '../../css/estiloCalendario.css';
import '../../css/estiloMenuLateral.css';

export default function MenuLateral() {
    const hook = useReservaForm();

    const ErrorToast = ({ message }) => (
        <div className="toast toast-center toast-top z-50">
            <div className="alert alert-error shadow-lg">
                <span>{message}</span>
            </div>
        </div>
    );

    const WarningToast = ({ message }) => (
        <div className="toast toast-center toast-top z-50">
            <div className="alert alert-warning shadow-lg">
                <span>{message}</span>
            </div>
        </div>
    );

    return (
        <section className="drawer drawer-end z-50" aria-label="Panel lateral de reserva">
            <input id="drawer-toggle" type="checkbox" className="drawer-toggle" aria-controls="drawer-side"/>
            <aside id="drawer-side" className="drawer-side h-screen" aria-label="Menú lateral de reserva">
                <label htmlFor="drawer-toggle" className="drawer-overlay" tabIndex={-1} aria-hidden="true"></label>
                <div className="h-full w-[600px] bg-gris" aria-labelledby="titulo-reserva" role="region">
                    <div className="relative flex h-full flex-col bg-gris">
                        {hook.mensajeError && <ErrorToast message={hook.mensajeError} />}
                        {hook.pasoActual === 1 && <Paso1Fechas {...hook} />}
                        {hook.pasoActual === 2 && <Paso2Habitaciones {...hook} />}
                        {hook.pasoActual === 3 && <Paso3Datos {...hook} />}
                        {hook.pasoActual === 4 && (
                            <Paso4Confirmacion
                                {...hook}
                                usuarioActual={hook.usuarioActual}
                                getValues={hook.getValues}
                                idClienteSeleccionado={hook.idClienteSeleccionado}
                                tipoClienteSeleccionado={hook.tipoClienteSeleccionado}
                            />
                        )}
                    </div>
                </div>
            </aside>
        </section>
    );
}
