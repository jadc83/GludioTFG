import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import '../../css/estiloCalendario.css';
import '../../css/createHabitacion.css';
import PrimaryButton from './PrimaryButton';

export default function Reservas() {
    const [paso, setPaso] = useState(1);
    const [rango, setRango] = useState({ from: undefined, to: undefined });
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        telefono: '',
        tipo_documento: 'dni',
        numero_documento: '',
        nacionalidad: '',
        direccion: '',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (!error) return;
        const tiempo = setTimeout(() => setError(''), 5000);
        return () => clearTimeout(tiempo);
    }, [error]);

    const limpiarRango = () => setRango(null);

    const continuar = () => {
        if (paso === 1 && (!rango?.from || !rango?.to))
            return setError('Selecciona un rango de fechas.');
        setError('');
        setPaso(paso + 1);
    };
    const volverAtras = () => setPaso(paso - 1);

    const Cambio = (campo) =>
        setFormData({ ...formData, [campo.target.name]: campo.target.value });

    const Migitas = () => (
        <nav aria-label="Progreso de reserva" className="mx-auto mb-4 flex max-w-md justify-center space-x-2 rounded bg-gris p-2 text-sm">
            {['Fechas', 'Datos', 'Confirmar'].map((etiqueta, indice) => (
                <span key={indice} className={`rounded-md px-3 py-1 ${paso === indice + 1 ? 'bg-black text-white' : 'bg-gris text-black'}`}>
                    {etiqueta}
                </span>
            ))}
        </nav>
    );

    const onConfirmar = () => {
        console.log('Confirmar reserva', { rango, formData });
    };

    return (
        <section className="drawer drawer-end z-50" aria-label="Panel lateral de reserva">
            <input id="drawer-toggle" type="checkbox" className="drawer-toggle" aria-controls="drawer-side" />
            <aside id="drawer-side" className="drawer-side h-screen" aria-label="Menú lateral de reserva">
                <label htmlFor="drawer-toggle" className="drawer-overlay" tabIndex={-1} aria-hidden="true"></label>
                <div className="h-full w-[600px] bg-gris p-6" aria-labelledby="titulo-meses" role="region">
                    <div className="relative flex h-full flex-col mx-auto rounded-xl bg-gris p-6">

                        {error && (
                            <div className="toast toast-center toast-top z-50">
                                <div className="alert alert-error shadow-lg">
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}

                        {paso === 1 && (
                            <main className="flex h-full flex-col">
                                <header>
                                    <h2 className="mb-6 text-center text-lg font-bold text-red-700">Reservar fechas</h2>
                                    <Migitas />
                                </header>
                                <div className="flex flex-1 items-center justify-center">
                                    <DayPicker mode="range" selected={rango} onSelect={setRango} locale={es} disabled={{ before: new Date() }} />
                                </div>
                                <footer className="mt-4 flex justify-between border-t pt-3">
                                    <PrimaryButton onClick={limpiarRango}>Limpiar</PrimaryButton>
                                    <PrimaryButton onClick={continuar}>Continuar</PrimaryButton>
                                </footer>
                            </main>
                        )}

                        {paso === 2 && (
                            <form onSubmit={(e) => { e.preventDefault(); continuar(); }} className="flex h-full flex-col">
                                <header>
                                    <h3 className="mb-3 text-center text-lg font-semibold text-red-700">Datos del cliente</h3>
                                    <Migitas />
                                </header>
                                <main className="flex-1 overflow-y-auto px-2">
                                    <fieldset className="campo">
                                        <label className="campo-label"><span className="campo-label-text">Nombre</span></label>
                                        <input required type="text" className="campo-input" name="name" value={formData.name} onChange={Cambio}/>
                                    </fieldset>

                                    <fieldset className="campo">
                                        <label className="campo-label"><span className="campo-label-text">Email</span></label>
                                        <input required type="email" className="campo-input" name="email" value={formData.email} onChange={Cambio}/>
                                    </fieldset>

                                    <fieldset className="campo">
                                        <label className="campo-label"><span className="campo-label-text">Teléfono</span></label>
                                        <input required type="tel" className="campo-input" name="telefono" value={formData.telefono} onChange={Cambio}/>
                                    </fieldset>

                                    <div className="flex gap-2">
                                        <fieldset className="campo" style={{ width: '40%' }}>
                                            <label className="campo-label"><span className="campo-label-text">Tipo</span></label>
                                            <select required className="campo-select" name="tipo_documento" value={formData.tipo_documento} onChange={Cambio}>
                                                <option value="dni">DNI</option>
                                                <option value="pasaporte">Pasaporte</option>
                                                <option value="tie">TIE</option>
                                            </select>
                                        </fieldset>

                                        <fieldset className="campo" style={{ flex: 1 }}>
                                            <label className="campo-label"><span className="campo-label-text">Número de Documento</span></label>
                                            <input required type="text" className="campo-input" name="numero_documento" value={formData.numero_documento} onChange={Cambio}/>
                                        </fieldset>
                                    </div>

                                    <fieldset className="campo">
                                        <label className="campo-label"><span className="campo-label-text">Nacionalidad</span></label>
                                        <input required type="text" className="campo-input" name="nacionalidad" value={formData.nacionalidad} onChange={Cambio}/>
                                    </fieldset>

                                    <fieldset className="campo">
                                        <label className="campo-label"><span className="campo-label-text">Dirección</span></label>
                                        <textarea required className="campo-textarea" name="direccion" value={formData.direccion} onChange={Cambio} rows="2"/>
                                    </fieldset>
                                </main>
                                <footer className="mt-3 flex justify-between border-t pt-3">
                                    <PrimaryButton type="button" onClick={volverAtras}>Atrás</PrimaryButton>
                                    <PrimaryButton type="submit">Siguiente</PrimaryButton>
                                </footer>
                            </form>
                        )}

                        {paso === 3 && (
                            <main className="flex h-full flex-col">
                                <header>
                                    <h3 className="mb-3 text-center text-lg font-semibold text-red-700">Confirmación de reserva</h3>
                                    <Migitas />
                                </header>
                                <section className="flex-1 overflow-y-auto px-2" aria-labelledby="resumen-reserva">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <tr>
                                                <th className="py-1 pr-4 font-medium text-left w-1/3">Nombre:</th>
                                                <td className="py-1 text-left">{formData.name}</td>
                                            </tr>
                                            <tr>
                                                <th className="py-1 pr-4 font-medium text-left">Email:</th>
                                                <td className="py-1 text-left">{formData.email}</td>
                                            </tr>
                                            <tr>
                                                <th className="py-1 pr-4 font-medium text-left">Teléfono:</th>
                                                <td className="py-1 text-left">{formData.telefono}</td>
                                            </tr>
                                            <tr>
                                                <th className="py-1 pr-4 font-medium text-left">Documento:</th>
                                                <td className="py-1 text-left">{formData.tipo_documento.toUpperCase()} - {formData.numero_documento}</td>
                                            </tr>
                                            <tr>
                                                <th className="py-1 pr-4 font-medium text-left">Nacionalidad:</th>
                                                <td className="py-1 text-left">{formData.nacionalidad}</td>
                                            </tr>
                                            <tr>
                                                <th className="py-1 pr-4 font-medium text-left">Dirección:</th>
                                                <td className="py-1 text-left">{formData.direccion}</td>
                                            </tr>
                                            <tr>
                                                <th className="py-1 pr-4 font-medium text-left">Fechas:</th>
                                                <td className="py-1 text-left">
                                                    {rango?.from?.toLocaleDateString()} - {rango?.to?.toLocaleDateString()}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <p id="resumen-reserva" className="mt-6 text-center font-semibold text-green-600">
                                        Reserva lista para confirmar
                                    </p>
                                </section>
                                <footer className="mt-3 flex justify-between border-t pt-3">
                                    <PrimaryButton onClick={volverAtras}>Atrás</PrimaryButton>
                                    <PrimaryButton onClick={() => onConfirmar()}>Confirmar Reserva</PrimaryButton>
                                </footer>
                            </main>
                        )}
                    </div>
                </div>
            </aside>
        </section>
    );
}
