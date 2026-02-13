import { UserIcon, IdentificationIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function CreateEmpleadoTabs({ tabActiva, setTabActiva, getTabClass }) {
    return (
        <nav className="flex flex-none border-b border-gray-100 bg-white">
            <button type="button" className={getTabClass('personal', ['name','email','numero_documento'])} onClick={() => setTabActiva('personal')}>
                <UserIcon className="h-4 w-4" /> Personal
            </button>
            <button type="button" className={getTabClass('laboral', ['departamento'])} onClick={() => setTabActiva('laboral')}>
                <IdentificationIcon className="h-4 w-4" /> Laboral
            </button>
            <button type="button" className={getTabClass('contacto', ['telefono','direccion','ciudad'])} onClick={() => setTabActiva('contacto')}>
                <MapPinIcon className="h-4 w-4" /> Contacto
            </button>
        </nav>
    );
}
