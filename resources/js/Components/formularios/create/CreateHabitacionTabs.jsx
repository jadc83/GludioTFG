import { HomeIcon, PhotoIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function CreateHabitacionTabs({ tabActiva, setTabActiva, getTabClass }) {
    return (
        <nav className="flex flex-none border-b border-gray-100 bg-white">
            <button type="button" className={getTabClass('info', ['numero','tipo','capacidad'])} onClick={() => setTabActiva('info')}>
                <HomeIcon className="h-4 w-4" /> Info
            </button>
            <button type="button" className={getTabClass('multimedia', ['fotos','descripcion'])} onClick={() => setTabActiva('multimedia')}>
                <PhotoIcon className="h-4 w-4" /> Multimedia
            </button>
            <button type="button" className={getTabClass('admin', ['estado','notas'])} onClick={() => setTabActiva('admin')}>
                <DocumentTextIcon className="h-4 w-4" /> Admin
            </button>
        </nav>
    );
}
