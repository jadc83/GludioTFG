export function emitToast(message, type = 'info', duration = 4500) {
    if (!message) return;
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type, duration } }));
}

export default emitToast;
