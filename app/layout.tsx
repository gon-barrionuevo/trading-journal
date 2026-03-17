import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    variable: '--font-space',
    weight: ['300', '400', '500', '600', '700']
})

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    weight: ['400', '500']
})

export const metadata: Metadata = {
    title: 'TrackR — Trading Journal',
    description: 'Registrá y analizá tus trades',
    icons: {
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230a0a0f'/><line x1='8' y1='6' x2='8' y2='26' stroke='%23333348' stroke-width='1.5'/><line x1='16' y1='6' x2='16' y2='26' stroke='%23333348' stroke-width='1.5'/><line x1='24' y1='6' x2='24' y2='26' stroke='%23333348' stroke-width='1.5'/><rect x='5' y='10' width='6' height='10' rx='1' fill='%23ff4d6d'/><line x1='8' y1='7' x2='8' y2='10' stroke='%23ff4d6d' stroke-width='1.5'/><line x1='8' y1='20' x2='8' y2='24' stroke='%23ff4d6d' stroke-width='1.5'/><rect x='13' y='8' width='6' height='12' rx='1' fill='%2300d68f'/><line x1='16' y1='5' x2='16' y2='8' stroke='%2300d68f' stroke-width='1.5'/><line x1='16' y1='20' x2='16' y2='23' stroke='%2300d68f' stroke-width='1.5'/><rect x='21' y='12' width='6' height='8' rx='1' fill='%2300d68f'/><line x1='24' y1='9' x2='24' y2='12' stroke='%2300d68f' stroke-width='1.5'/><line x1='24' y1='20' x2='24' y2='24' stroke='%2300d68f' stroke-width='1.5'/></svg>"
    }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
        <body>
        <div className="layout">
            <Sidebar />
            <main className="main">{children}</main>
        </div>
        </body>
        </html>
    )
}
