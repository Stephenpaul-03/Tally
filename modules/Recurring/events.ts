const listeners = new Set<() => void>();
export function subscribeRecurring(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function notifyRecurring() { listeners.forEach(listener => listener()); }
