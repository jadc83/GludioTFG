import { t } from '@/i18n';
import { ArrowsPointingOutIcon, CheckCircleIcon, MoonIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function ModalGaleriaInfo({
    titulo,
    descripcion,
    precio,
    m2,
    capacidad,
    camas,
    amenidades = [],
    onCerrar,
}) {
    return (
        <div className="flex w-full flex-col overflow-y-auto bg-white p-8 md:p-12 lg:w-2/5">
            <div className="mb-8">
                <span className="mb-3 block text-xs font-bold uppercase tracking-[0.4em] text-[#7a0202]">
                    {t('modal.gallery.room_badge')}
                </span>
                <h2 id="modal-galeria-title" className="font-serif text-4xl leading-tight text-black">
                    {titulo}
                </h2>
                <div className="mt-6 h-1 w-20 bg-[#7a0202]" />
            </div>

            <div className="my-4 grid grid-cols-3 gap-6 border-y border-gray-100 py-8 text-center text-black">
                <div className="space-y-2">
                    <ArrowsPointingOutIcon className="mx-auto h-6 w-6 text-[#7a0202]" />
                    <p className="text-[10px] font-black uppercase tracking-tighter">{m2} {t('modal.gallery.meters')}</p>
                </div>
                <div className="space-y-2">
                    <UsersIcon className="mx-auto h-6 w-6 text-[#7a0202]" />
                    <p className="text-[10px] font-black uppercase tracking-tighter">{capacidad} {t('modal.gallery.guests')}</p>
                </div>
                <div className="space-y-2">
                    <MoonIcon className="mx-auto h-6 w-6 text-[#7a0202]" />
                    <p className="text-[10px] font-black uppercase tracking-tighter">{camas}</p>
                </div>
            </div>

            <div className="mt-6 flex-1 space-y-10">
                <div>
                    <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-black opacity-40">
                        {t('modal.gallery.description_title')}
                    </h3>
                    <p className="text-lg font-light leading-relaxed text-gray-700">{descripcion}</p>
                </div>

                <div>
                    <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-black opacity-40">
                        {t('modal.gallery.amenities_title')}
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {amenidades.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm font-medium text-black">
                                <CheckCircleIcon className="h-5 w-5 text-[#7a0202]" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-12 flex items-end justify-between border-t border-gray-100 pt-8">
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('modal.gallery.price_per_night')}</span>
                    <div className="text-black">
                        <span className="font-serif text-4xl font-bold">{precio}€</span>
                    </div>
                </div>
                <button onClick={onCerrar} aria-label="Volver" className="rounded-2xl bg-[#7a0202] px-10 py-5 text-xs font-bold uppercase tracking-widest text-white shadow-[0_10px_30px_rgba(122,2,2,0.3)] transition-all hover:bg-black active:scale-95">
                    {t('modal.gallery.back')}
                </button>
            </div>
        </div>
    );
}
