export default function CuponDescuento({
    value = '',
    onChange = () => {},
    onApply = () => {},
    placeholder = 'Código',
    buttonText = 'Aplicar',
    className = '',
}) {
    return (
        <div className={`mt-3 ${className}`}>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-gray-700">
                Código especial
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-[12px] font-bold"
                />
                <button
                    type="button"
                    onClick={onApply}
                    disabled={!value}
                    className="rounded-lg bg-[#7a0202] px-4 py-3 text-[12px] font-bold text-white disabled:opacity-50"
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
}
