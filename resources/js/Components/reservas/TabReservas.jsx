import IndexReserva from './IndexReserva';

export default function TabReservas({
    reservas = [],
    clientes = [],
    users = [],
    estadisticas = {},
}) {
    return (
        <div className="p-6">
            <IndexReserva
                reservas={reservas}
                clientes={clientes}
                users={users}
                estadisticas={estadisticas}
            />
        </div>
    );
}
