import { Link } from '@inertiajs/react';
import { t } from '@/i18n';

export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="mt-auto border-t border-gray-100 bg-gris">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-sm text-black sm:px-6 lg:px-8">
                <p>
                    {t('footer.copyright').replace('{{year}}', String(year))}
                </p>
                <nav className="space-x-4">
                    <Link href="/politica-privacidad" className="hover:underline">
                        {t('footer.privacy')}
                    </Link>
                    <Link href="/terminos-servicio" className="hover:underline">
                        {t('footer.terms')}
                    </Link>
                    <Link href="/contacto" className="hover:underline">
                        {t('footer.contact')}
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
