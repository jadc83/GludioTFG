import HeaderPanel from '@/Components/UI/HeaderPanel';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import Paginacion from '@/Components/UI/Paginacion';
import useIndexReembolsos from '@/hooks/useIndexReembolsos';
import ReembolsosTable from '@/Components/indexes/ReembolsosTable';
import EmptyStateReembolsos from '@/Components/indexes/EmptyStateReembolsos';
import {
    BanknotesIcon,
    CheckIcon,
    InboxIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function IndexReembolsos({
    refunds = [],
    pagination = null,
    loading = false,
    onPageChange = null,
    onApprove = null,
    onReject = null,
    onDelete = null,
}) {
    const { refunds: refundsArray, pagination: paginationObj, loading: isLoading } = useIndexReembolsos({ refunds, pagination, loading });

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <HeaderPanel
                titulo="Reembolsos"
                subtitulo="Panel de aprobación y auditoría financiera"
                icono={BanknotesIcon}
            />

            {/* --- CONTENEDOR PRINCIPAL --- */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <LoadingSpinner />
                        <span className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Sincronizando transacciones...
                        </span>
                    </div>
                ) : refundsArray.length === 0 ? (
                    <EmptyStateReembolsos />
                ) : (
                    <>
                        <ReembolsosTable refunds={refundsArray} onApprove={onApprove} onReject={onReject} onDelete={onDelete} />

                        {/* Paginación */}
                        {paginationObj && (
                            <Paginacion
                                paginaActual={paginationObj.current_page}
                                totalPaginas={paginationObj.last_page}
                                inicio={paginationObj.per_page * (paginationObj.current_page - 1)}
                                fin={paginationObj.per_page * paginationObj.current_page}
                                total={paginationObj.total}
                                onCambiarPagina={(page) => onPageChange && onPageChange(page)}
                                etiqueta="Solicitudes"
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
