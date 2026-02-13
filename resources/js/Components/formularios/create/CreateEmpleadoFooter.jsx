export default function CreateEmpleadoFooter({ estaCargando }) {
    return (
        <div className="flex-none border-t border-gray-100 bg-gray-50 p-6">
            <button type="submit" disabled={estaCargando} className="w-full rounded-2xl bg-gray-900 py-5 text-[11px] font-black uppercase tracking-[0.25em] text-white shadow-xl transition-all hover:bg-[#7a0202] disabled:opacity-50">
                {estaCargando ? 'Procesando...' : 'Finalizar Alta de Empleado'}
            </button>
        </div>
    );
}
