// src/lib/auth.ts

// Wir re-exportieren einfach die vorhandenen authOptions
// aus deiner bestehenden NextAuth-Route.
// So muss an der eigentlichen Konfiguration nichts geändert werden.

export { authOptions } from "@/app/api/auth/[...nextauth]/route";
