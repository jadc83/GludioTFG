import { useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { t } from '@/i18n';

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

			<div className="relative min-h-[calc(100vh-65px)] flex items-center justify-center bg-[#1a0101] overflow-hidden">
				<div className="absolute inset-0 z-0">
					<img
						src={`/fondo3.jpg?v=${Date.now()}`}
						className="w-full h-full object-cover scale-105 animate-slow-pan"
						alt="Background"
					/>
					<div className="absolute inset-0 bg-gradient-to-tr from-[#3a0101] via-[#7a0202]/40 to-[#1a0101]/80 mix-blend-multiply" />
					<div className="absolute inset-0 bg-black/20" />
				</div>

				<div className="relative z-20 max-w-5xl w-full px-6 flex flex-col items-center">
					<div className="bg-white/10 backdrop-blur-xl p-10 md:p-16 rounded-[2rem] shadow-2xl text-center border border-white/20 relative overflow-hidden">
						<div className="absolute -top-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

						<span className="text-white/80 text-xs tracking-[0.5em] uppercase font-light block mb-6 animate-fade-in">
							{t('dashboard.experience_tag')}
						</span>

						<h1 className="text-4xl md:text-7xl font-serif text-white leading-tight mb-8 animate-fade-in-up">
							{t('dashboard.headline_part1')} <br/>
							<span className="text-[#fdfaf6] italic font-light opacity-90">{t('dashboard.headline_emphasis')}</span>
						</h1>

						<p className="text-white/70 text-lg font-light max-w-md mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
							{t('dashboard.subtitle')}
						</p>

						<div className="mt-12 flex flex-col items-center gap-6">
							<div className="flex gap-3">
								<span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0s' }}></span>
								<span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></span>
								<span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></span>
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
								className="group relative overflow-hidden bg-white text-[#7a0202] px-8 py-3 rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
							>
								<span className="relative z-10 flex items-center gap-2">
									<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
										<path d="M10.707 1.707a1 1 0 00-1.414 0l-7 7A1 1 0 003 10h1v6a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001-1h4a1 1 0 001-1v-6h1a1 1 0 00.707-1.707l-7-7z" />
									</svg>
									{t('dashboard.cta')}
								</span>
							</button>
						</div>
					</div>
				</div>

				<div className="absolute bottom-8 left-8 flex items-center gap-4 opacity-50 text-white">
					<div className="w-8 h-[1px] bg-white" />
					<span className="font-serif tracking-[0.3em] text-xs uppercase">{t('dashboard.brand')}</span>
				</div>
			</div>

			<style dangerouslySetInnerHTML={{ __html: `
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
			`}} />
		</AuthenticatedLayout>
	);
}
