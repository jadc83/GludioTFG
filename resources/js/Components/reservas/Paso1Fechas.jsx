import ApplicationLogo from '@/Components/ApplicationLogo';
import { es } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import PrimaryButton from '../PrimaryButton';

export default function Paso1Fechas({ rango, setRango, avanzarPaso, limpiarRango}) {

    const Migitas = () => (
        <nav aria-label="Progreso de reserva" className="mx-auto mb-4 flex max-w-md justify-center space-x-2 rounded bg-gris p-2 text-sm">
            {['Fechas', 'Habitación', 'Datos', 'Confirmar'].map(
                (etiqueta, indice) => ( <span key={indice} className={`rounded-md px-3 py-1 ${indice === 0 ? 'bg-black text-white' : 'bg-gris text-black'}`}>{etiqueta}</span>)
            )}
        </nav>
    );

    return (
        <main className="flex h-full flex-col bg-gris p-4">
            <header>
                <h2 className="mb-4 text-center text-lg font-bold text-red-700">
                    Reservar fechas
                </h2>

                <div className="mb-4 flex w-full justify-center">
                    <div className="banner-navidad w-full max-w-md overflow-hidden rounded-lg">
                        <div className="mr-3 flex items-center">
                            <ApplicationLogo className="banner-logo h-10 w-10" />
                        </div>
                        <div>
                            <h4 className="text-base font-semibold">Oferta de Navidad — 15% dto</h4>
                            <p className="text-xs">
                                Reserva entre 20 dic y 5 ene y obtén un 15% de descuento con el código{' '}<strong>NAVIDAD15</strong>. Plazas limitadas.
                            </p>
                        </div>
                    </div>
                </div>

                <Migitas />
            </header>

            <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-md">
                    <DayPicker mode="range" selected={rango} onSelect={setRango} locale={es} disabled={{ before: new Date() }}/>
                </div>
            </div>

            <footer className="border-t border-gray-300 bg-gris px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <PrimaryButton onClick={limpiarRango}>
                        Limpiar
                    </PrimaryButton>
                    <PrimaryButton onClick={avanzarPaso}>
                        Continuar
                    </PrimaryButton>
                </div>
            </footer>
        </main>
    );
}
