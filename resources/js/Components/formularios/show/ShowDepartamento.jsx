import { XMarkIcon } from '@heroicons/react/24/outline';
import ShowDepartamentoHeader from './ShowDepartamentoHeader';
import ShowDepartamentoEmpleados from './ShowDepartamentoEmpleados';
import useShowDepartamento from '@/hooks/useShowDepartamento';
import Cajon from '@/Components/UI/Cajon';

export default function ShowDepartamento({ departamento, abierto, onCerrar }) {
    const { detalleDepartamento, abrirPerfilEmpleado, encargado, operarios, auxiliares } = useShowDepartamento({ departamento, abierto });

    return (
        <Cajon open={abierto} onClose={onCerrar}>
            <ShowDepartamentoHeader detalleDepartamento={detalleDepartamento} departamento={departamento} encargado={encargado} onCerrar={onCerrar} />

            <div className="flex-1 overflow-y-auto p-6">
                {!detalleDepartamento ? (
                    <div className="p-6 text-sm text-gray-500">Cargando...</div>
                ) : (
                    <div className="space-y-6">
                        <ShowDepartamentoEmpleados title="Operarios" empleados={operarios} onVerPerfil={abrirPerfilEmpleado} />
                        <ShowDepartamentoEmpleados title="Auxiliares" empleados={auxiliares} onVerPerfil={abrirPerfilEmpleado} />
                    </div>
                )}
            </div>
        </Cajon>
    );
}
