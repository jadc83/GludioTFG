import { t } from '@/i18n';

export default function CuponDescuento({
    value = '',
    onChange = () => {},
    onApply = () => {},
    placeholder = null,
    buttonText = null,
    className = '',
}) {
    const ph = placeholder || t('paso2.coupon_placeholder');
    const btn = buttonText || t('paso2.coupon_apply');

    return (
        <div className={`mt-3 ${className}`}>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-gray-700">
                {t('paso2.coupon_label')}
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder={ph}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-[12px] font-bold"
                />
                <button
                    type="button"
                    onClick={onApply}
                    disabled={!value}
                    className="rounded-lg bg-[#7a0202] px-4 py-3 text-[12px] font-bold text-white disabled:opacity-50"
                >
                    {btn}
                </button>
            </div>
        </div>
    );
}
