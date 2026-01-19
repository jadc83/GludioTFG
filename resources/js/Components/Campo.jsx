import React, { forwardRef } from 'react';

const Campo = forwardRef(({ id, label, as = 'input', error, classNameExtra = '', className = '', children, ...props }, ref) => {
    const InputTag = as;

    const mergedClassName = `w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${error ? 'border-red-500' : ''} ${className} ${classNameExtra}`.trim();

    const voidElements = new Set(['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']);
    const isVoid = typeof InputTag === 'string' && voidElements.has(InputTag);

    const describedBy = error ? `${id}-error` : undefined;

    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700" htmlFor={id}>
                {label}
            </label>
            <InputTag id={id} name={id} ref={ref} className={mergedClassName} aria-invalid={!!error} aria-describedby={describedBy}
                {...props}
            >
                {!isVoid ? children : null}
            </InputTag>
            {error && (
                <span id={describedBy} className="text-xs text-red-500">
                    {Array.isArray(error) ? error[0] : error}
                </span>
            )}
        </div>
    );
});

Campo.displayName = 'Campo';

export default Campo;
