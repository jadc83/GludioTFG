import ApplicationLogo from '@/Components/ApplicationLogo';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Navbar() {
    const { user } = usePage().props.auth;
    const [AbrirDesplegable, setAbrir] = useState(false);

    return (
        <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-gris">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/">
                            <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                        </Link>
                        <p className="font-semibold text-black">HOTEL GLUDIO</p>
                    </div>

                    <div className="hidden w-full items-center justify-center space-x-8 sm:flex">
                        <NavLink href={route('dashboard')} active={route().current('dashboard')}>
                            Dashboard
                        </NavLink>
                        <NavLink href={route('home')} active={route().current('home')}>
                            Home
                        </NavLink>
                        <NavLink href={route('panel')} active={route().current('panel')}>
                            Panel de Control
                        </NavLink>
                    </div>

                    <div className="flex items-center space-x-4">
                        <label htmlFor="drawer-toggle" className={`inline-flex cursor-pointer items-center rounded-md border border-transparent bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:shadow-[2px_2px_0_0_rgba(239,68,68,1)] focus:ring-2 focus:ring-red-800 focus:ring-offset-2 active:bg-gray-900`}>
                            Reservar
                        </label>

                        <div className="flex sm:hidden">
                            <button
                                onClick={() => setAbrir(!AbrirDesplegable)}
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none"
                                aria-label="Toggle navigation menu">
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    {AbrirDesplegable ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={`${AbrirDesplegable ? 'block' : 'hidden'} bg-red-500 sm:hidden`}>
                <div className="flex flex-col space-y-1 px-4 py-2">
                    <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')} className="block rounded px-3 py-2 hover:bg-red-600">
                        HABITACIONES
                    </ResponsiveNavLink>
                    <ResponsiveNavLink href={route('home')} active={route().current('home')} className="block rounded px-3 py-2 hover:bg-red-600">
                        EXPERIENCIA
                    </ResponsiveNavLink>
                    <ResponsiveNavLink href={route('home')} active={route().current('home')} className="block rounded px-3 py-2 hover:bg-red-600">
                        SERVICIOS
                    </ResponsiveNavLink>
                    <ResponsiveNavLink href={route('home')} active={route().current('home')} className="block rounded px-3 py-2 hover:bg-red-600"
                    >
                        CONTACTO
                    </ResponsiveNavLink>
                </div>
                <div className="border-t border-red-600 px-4 py-4">
                    {user ? (
                        <>
                            <div className="text-base font-medium text-white">
                                {user.name}
                            </div>
                            <div className="mb-3 text-sm font-medium text-red-300">
                                {user.email}
                            </div>
                            <ResponsiveNavLink href={route('profile.edit')} className="block rounded px-3 py-2 hover:bg-red-600">
                                Perfil
                            </ResponsiveNavLink>
                            <ResponsiveNavLink method="post" href={route('logout')} as="button" className="block rounded px-3 py-2 hover:bg-red-600">
                                Log Out
                            </ResponsiveNavLink>
                        </>
                    ) : (
                        <>
                            <ResponsiveNavLink href={route('login')} className="block rounded px-3 py-2 hover:bg-red-600">
                                Log in
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('register')} className="block rounded px-3 py-2 hover:bg-red-600">
                                Registrarse
                            </ResponsiveNavLink>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
