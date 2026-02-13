import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import ApplicationLogo from '@/Components/UI/ApplicationLogo';
import NavLink from '@/Components/UI/NavLink';
import { getLocale, setLocale } from '@/i18n';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Navbar() {
    const { user } = usePage().props.auth;
    const [AbrirDesplegable, setAbrir] = useState(false);
    const [openUserMenu, setOpenUserMenu] = useState(false);
    const inicial = user
        ? (user.name || '')
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : '';
    const firstName = user ? (user.name || '').split(' ')[0] : '';

    return (
        <nav
            aria-label="Main navigation"
            className="fixed top-0 z-50 w-full border-b border-gray-100 bg-gris"
        >
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex flex-1 items-center space-x-4">
                        <Link href="/">
                            <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                        </Link>
                        <p className="font-semibold text-black">HOTEL GLUDIO</p>
                    </div>

                    <div className="hidden lg:absolute lg:left-1/2 lg:flex lg:-translate-x-1/2 lg:transform lg:items-center">
                        <div className="flex w-full max-w-7xl justify-center px-4 sm:px-6 lg:space-x-8 lg:px-8">
                            {usePage().props?.auth?.user?.can_view_panel ? (
                                <NavLink
                                    href={route('panel')}
                                    active={route().current('panel')}
                                >
                                    Panel de Control
                                </NavLink>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex flex-1 items-center justify-center gap-4"></div>

                    <div className="flex flex-1 items-center justify-end space-x-4">
                        {user ? (
                            <div className="relative hidden lg:block">
                                <button
                                    onClick={() =>
                                        setOpenUserMenu(!openUserMenu)
                                    }
                                    aria-haspopup="true"
                                    aria-expanded={openUserMenu}
                                    className="inline-flex items-center gap-3 rounded-md border border-gray-200 bg-gris px-3 py-1 text-sm font-medium hover:shadow-sm"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-gray-900">
                                        {inicial}
                                    </div>
                                    <span className="max-w-[10rem] truncate text-gray-900">
                                        {firstName}
                                    </span>
                                    <svg
                                        className="h-4 w-4 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>
                                {openUserMenu && (
                                    <div
                                        className="absolute right-0 z-50 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                                        role="menu"
                                        aria-label="User menu"
                                    >
                                        <div className="py-1">
                                            <Link
                                                href={route('profile.edit')}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                role="menuitem"
                                            >
                                                Perfil
                                            </Link>
                                            <Link
                                                method="post"
                                                href={route('logout')}
                                                as="button"
                                                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                role="menuitem"
                                            >
                                                Cerrar sesión
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden lg:block">
                                <Link
                                    href={route('login')}
                                    className="inline-flex min-w-[5.5rem] items-center justify-center whitespace-nowrap rounded-md border border-gray-200 bg-white px-4 py-1 text-sm font-medium text-black hover:shadow-sm"
                                >
                                    Log in
                                </Link>
                            </div>
                        )}

                        <div className="hidden items-center gap-2 sm:flex">
                            <button
                                onClick={() => {
                                    if (getLocale() !== 'es') {
                                        setLocale('es', { persist: true });
                                        if (typeof window !== 'undefined')
                                            window.location.reload();
                                    }
                                }}
                                className={`rounded px-2 py-1 text-sm ${getLocale() === 'es' ? 'bg-zinc-100 font-semibold' : 'hover:bg-zinc-50'}`}
                            >
                                ES
                            </button>
                            <button
                                onClick={() => {
                                    if (getLocale() !== 'en') {
                                        setLocale('en', { persist: true });
                                        if (typeof window !== 'undefined')
                                            window.location.reload();
                                    }
                                }}
                                className={`rounded px-2 py-1 text-sm ${getLocale() === 'en' ? 'bg-zinc-100 font-semibold' : 'hover:bg-zinc-50'}`}
                            >
                                EN
                            </button>
                        </div>

                        <div className="flex lg:hidden">
                            <button
                                onClick={() => setAbrir(!AbrirDesplegable)}
                                aria-controls="mobile-menu"
                                aria-expanded={AbrirDesplegable}
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none"
                                aria-label="Toggle navigation menu"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    {AbrirDesplegable ? (
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    ) : (
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div
                id="mobile-menu"
                className={`${AbrirDesplegable ? 'block' : 'hidden'} border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur lg:hidden`}
                role="navigation"
                aria-label="Mobile navigation"
            >
                <div className="flex flex-col space-y-1 px-4 py-3">
                    {usePage().props?.auth?.user?.can_view_panel && (
                        <ResponsiveNavLink
                            href={route('panel')}
                            active={route().current('panel')}
                            className="block rounded-lg px-3 py-2 text-gray-900 hover:bg-gray-100"
                        >
                            Panel de Control
                        </ResponsiveNavLink>
                    )}
                </div>
                <div className="border-t border-gray-200 px-4 py-4">
                    {user ? (
                        <>
                            <div className="text-base font-semibold text-gray-900">
                                {user.name}
                            </div>
                            <div className="mb-3 text-sm font-medium text-gray-500">
                                {user.email}
                            </div>
                            <ResponsiveNavLink
                                href={route('profile.edit')}
                                className="block rounded-lg px-3 py-2 text-gray-900 hover:bg-gray-100"
                            >
                                Perfil
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                                className="block rounded-lg px-3 py-2 text-gray-900 hover:bg-gray-100"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </>
                    ) : (
                        <>
                            <ResponsiveNavLink
                                href={route('login')}
                                className="block rounded-lg px-3 py-2 text-gray-900 hover:bg-gray-100"
                            >
                                Log in
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                href={route('register')}
                                className="block rounded-lg px-3 py-2 text-gray-900 hover:bg-gray-100"
                            >
                                Registrarse
                            </ResponsiveNavLink>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
