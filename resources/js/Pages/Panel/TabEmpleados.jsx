import IndexEmpleados from '../../Components/empleados/IndexEmpleados';

export default function TabEmpleados({ empleados = [] }) {
    return (
        <div className="p-3 md:p-6">
            <IndexEmpleados empleados={empleados} />
        </div>
    );
}
