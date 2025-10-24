import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
// Wenn die aktuelle URL nur "/" ist
if (request.nextUrl.pathname === '/') {
    // Neue URL auf "/home" setzen
    const url = request.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.redirect(url);
}

// Andere Requests normal weitergeben
return NextResponse.next();
}

// Diese Middleware soll nur für die Root-Route greifen
export const config = {
matcher: '/', // nur die Startseite
};
