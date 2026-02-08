import { loadStripe } from '@stripe/stripe-js';

const cache = {};

export function getStripePromise(publicKey) {
    if (!publicKey) return null;
    if (cache[publicKey]) return cache[publicKey];
    cache[publicKey] = loadStripe(publicKey);
    return cache[publicKey];
}
