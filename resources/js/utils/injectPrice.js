import React, { cloneElement, isValidElement } from 'react';

export function injectPriceIntoChild(child, precio, disabled, hide) {
    if (!isValidElement(child)) return child;
    if (disabled) return child;
    if (hide) return child;
    const priceSpan = React.createElement(
        'span',
        { className: 'rdp-day_price text-[#077a02]' },
        precio ? `€${precio}` : '—',
    );
    return cloneElement(child, { ...(child.props || {}) }, [
        priceSpan,
        child.props && child.props.children,
    ]);
}
