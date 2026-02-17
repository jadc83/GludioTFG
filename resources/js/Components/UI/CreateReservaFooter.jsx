import Boton from '@/Components/UI/Boton';

export default function CreateReservaFooter({
    precioCalculado,
    estaCargando,
    esFormularioCompleto,
    handleCerrar,
    formulario,
    estaGuardando = false,
    aceptaTerminos = false,
}) {
    const disabled = estaCargando || estaGuardando || !esFormularioCompleto() || !aceptaTerminos;
    return (
        <footer
            aria-label="Acciones de crear reserva"
            className="flex flex-none items-center justify-between border-t border-gray-100 bg-gray-50 p-6"
        >
            <div className="flex items-center gap-2">
                {precioCalculado > 0 && (
                    <p
                        className="text-sm font-bold text-gray-700"
                        aria-live="polite"
                    >
                        Total:{' '}
                        <span className="text-lg text-[#7a0202]">
                            €{precioCalculado.toFixed(2)}
                        </span>
                    </p>
                )}
            </div>
            <div className="flex items-center gap-4">
                <Boton
                    type="button"
                    variant="outline"
                    onClick={handleCerrar}
                    disabled={disabled}
                >
                    Cancelar
                </Boton>

                <Boton
                    type="submit"
                    variant="primary"
                    color="danger"
                    loading={estaGuardando}
                    disabled={disabled}
                >
                    {formulario.metodo_pago === 'tarjeta' &&
                    !import.meta.env.VITE_STRIPE_PUBLIC_KEY
                        ? 'Crear Reserva (Pago en Recepción)'
                        : 'Crear Reserva'}
                </Boton>
            </div>
        </footer>
    );
}
