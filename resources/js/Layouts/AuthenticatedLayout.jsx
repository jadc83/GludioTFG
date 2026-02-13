import BarraReservas from '@/Components/buscadores/BarraReservas';
import CookieBanner from '@/Components/UI/CookieBanner';
import Footer from '@/Components/UI/Footer';
import Nav from '@/Components/UI/Nav';
import Toast from '@/Components/UI/Toast';
import { emitToast } from '@/utils/toast';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export default function AuthenticatedLayout({ children }) {
    const page = usePage();
    const user = page.props.auth.user;
    const { component } = page;

    // Ocultar BarraReservas en el dashboard
    const showBarraReservas = !component.startsWith('Dashboard');

    useEffect(() => {
        const errors = page?.props?.errors || {};
        if (errors && Object.keys(errors).length > 0) {
            const first = Object.keys(errors)[0];
            // Manejar tanto arrays como strings (Inertia algunos drivers devuelven string)
            let msg = null;
            try {
                const val = errors[first];
                if (Array.isArray(val)) {
                    msg = val[0];
                } else if (val && typeof val === 'object') {
                    msg = JSON.stringify(val);
                } else if (val !== undefined && val !== null) {
                    msg = String(val);
                }
            } catch (e) {
                msg = null;
            }

            if (msg) {
                if (typeof msg === 'string' && msg.length <= 1) {
                    console.warn(
                        'Ignored suspicious short error message in page.props.errors:',
                        page.props.errors,
                    );
                } else {
                    emitToast(msg, 'error');
                }
            }
        }

        // Nota: se omiten logs de depuración para mantener consola limpia en desarrollo

        // Mostrar notificación si el backend puso refund_info en flash
        const refund = page?.props?.flash?.refund_info;
        if (refund && refund.amount) {
            const amt = Number(refund.amount || 0).toFixed(2);
            emitToast(
                `Se ha solicitado un reembolso parcial de ${amt}€`,
                'success',
            );
        }

        // Mostrar flash.success como toast (si existe)
        const successMsg = page?.props?.flash?.success;
        if (successMsg) {
            const safeMsg =
                typeof successMsg === 'string'
                    ? successMsg
                    : JSON.stringify(successMsg);
            // Evitar toasts demasiado cortos (p. ej. un solo carácter 'D') que suelen indicar un valor no esperado
            if (typeof safeMsg === 'string' && safeMsg.length === 1) {
                console.warn(
                    'Ignored suspicious short flash.success:',
                    page.props.flash,
                );
            } else {
                emitToast(safeMsg, 'success');
            }
        }
    }, [page.props.errors, page.props.flash]);

    return (
        <div className="flex min-h-screen flex-col bg-gris">
            <Nav user={user} />

            {showBarraReservas && <BarraReservas />}

            <main className="flex flex-grow flex-col pt-16">{children}</main>

            <Footer />

            <CookieBanner />

            <Toast />
        </div>
    );
}
