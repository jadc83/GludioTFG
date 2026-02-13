import { useRef } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function InputFotos({ fotos = [], previews = [], onAgregar, onQuitar, error, maxFotos }) {
    const fileInputRef = useRef(null);

    return (
        <div className="space-y-4">
            <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                Galería Multimedia <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-600">{fotos.length} / {maxFotos}</span>
            </label>

            <div className="grid grid-cols-3 gap-3">
                {previews.map((src, indice) => (
                    <div key={indice} className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
                        <img src={src} alt={`Preview ${indice}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
                        <button type="button" onClick={() => onQuitar(indice)} className="absolute right-2 top-2 scale-0 rounded-xl bg-white/90 p-1.5 text-gray-500 shadow-md transition-all hover:bg-red-50 hover:text-red-600 group-hover:scale-100">
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {fotos.length < maxFotos && (
                    <button type="button" className="group flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 transition-all hover:border-[#7a0202] hover:bg-red-50/30" aria-label="Subir fotos" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={onAgregar} />
                        <PhotoIcon className="h-6 w-6 text-gray-300 transition-colors group-hover:text-[#7a0202]" aria-hidden="true" />
                        <span className="mt-2 text-[9px] font-black uppercase tracking-tighter text-gray-400 group-hover:text-[#7a0202]">Subir</span>
                    </button>
                )}
            </div>

            {error && <span className="animate-pulse text-[10px] font-black uppercase tracking-wide text-red-600">{Array.isArray(error) ? error[0] : error}</span>}
        </div>
    );
}
