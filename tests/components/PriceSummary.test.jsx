import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PriceSummary from '@/Components/reservas/comunes/PriceSummary';

describe('PriceSummary', () => {
    it('renders compact total and refunds', () => {
        const { getByText } = render(<PriceSummary total={150} refunds={20} />);
        expect(getByText(/150.00€/)).toBeTruthy();
        expect(getByText(/-20.00€/)).toBeTruthy();
    });

    it('renders big variant', () => {
        const { getByText } = render(<PriceSummary total={200} big />);
        expect(getByText(/200.00€/)).toBeTruthy();
        expect(getByText(/Total a cobrar/i)).toBeTruthy();
    });
});
