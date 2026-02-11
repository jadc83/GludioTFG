import { t } from '@/i18n';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Dashboard() {
    useEffect(() => {
        const timer = setTimeout(() => {
            // router.visit(route('home'));
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AuthenticatedLayout header={null}>
            <Head title={t('dashboard.title')} />

            <div className="relative flex min-h-[calc(100vh-65px)] items-center justify-center overflow-hidden bg-[#1a0101]">
                <div className="absolute inset-0 z-0">
                    <img
                        src={`/fondo3.jpg?v=${Date.now()}`}
                        className="animate-slow-pan h-full w-full scale-105 object-cover"
                        alt="Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#3a0101] via-[#7a0202]/40 to-[#1a0101]/80 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                <div className="relative z-20 flex w-full max-w-5xl flex-col items-center px-6">
                    <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-10 text-center shadow-2xl backdrop-blur-xl md:p-16">
                        <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

                        <span className="animate-fade-in mb-6 block text-xs font-light uppercase tracking-[0.5em] text-white/80">
                            {t('dashboard.experience_tag')}
                        </span>

                        <h1 className="animate-fade-in-up mb-8 font-serif text-4xl leading-tight text-white md:text-7xl">
                            {t('dashboard.headline_part1')} <br />
                            <span className="font-light italic text-[#fdfaf6] opacity-90">
                                {t('dashboard.headline_emphasis')}
                            </span>
                        </h1>

                        <p
                            className="animate-fade-in-up mx-auto max-w-md text-lg font-light leading-relaxed text-white/70"
                            style={{ animationDelay: '0.2s' }}
                        >
                            {t('dashboard.subtitle')}
                        </p>

                        <div className="mt-12 flex flex-col items-center gap-6">
                            <div className="flex gap-3">
                                <span
                                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"
                                    style={{ animationDelay: '0s' }}
                                ></span>
                                <span
                                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"
                                    style={{ animationDelay: '0.2s' }}
                                ></span>
                                <span
                                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"
                                    style={{ animationDelay: '0.4s' }}
                                ></span>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    try {
                                        router.visit(route('home'));
                                    } catch (e) {
                                        router.visit('/');
                                    }
                                }}
                                className="group relative overflow-hidden rounded-full bg-white px-8 py-3 font-bold text-[#7a0202] shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path d="M10.707 1.707a1 1 0 00-1.414 0l-7 7A1 1 0 003 10h1v6a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001-1h4a1 1 0 001-1v-6h1a1 1 0 00.707-1.707l-7-7z" />
                                    </svg>
                                    {t('dashboard.cta')}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 left-8 flex items-center gap-4 text-white opacity-50">
                    <div className="h-[1px] w-8 bg-white" />
                    <span className="font-serif text-xs uppercase tracking-[0.3em]">
                        {t('dashboard.brand')}
                    </span>
                </div>
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
				@keyframes fade-in-up {
					from { opacity: 0; transform: translateY(20px); }
					to { opacity: 1; transform: translateY(0); }
				}
				@keyframes fade-in {
					from { opacity: 0; }
					to { opacity: 1; }
				}
				@keyframes slow-pan {
					from { transform: scale(1) translateX(0); }
					to { transform: scale(1.1) translateX(-2%); }
				}
				.animate-fade-in-up { animation: fade-in-up 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
				.animate-fade-in { animation: fade-in 2.5s forwards; opacity: 0; }
				.animate-slow-pan { animation: slow-pan 30s infinite alternate ease-in-out; }
			`,
                }}
            />
        </AuthenticatedLayout>
    );
}
