// lib/profanity.ts
// Use a placeholder if not on client to avoid build/SSR issues
let filter: any = {
    clean: (s: string) => s,
    check: () => false,
    loadDictionary: () => {}
};

export async function initProfanity() {
    if (typeof window !== 'undefined') {
        const leoProfanity = (await import('leo-profanity')).default;
        leoProfanity.loadDictionary('en');
        leoProfanity.loadDictionary('de');
        filter = leoProfanity;
        return filter;
    }
    return filter;
}

export function getFilter() {
    return filter;
}
