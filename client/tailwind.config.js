/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                gold: {
                    50: '#F9F5E6',
                    100: '#F2EBCF',
                    200: '#E6D6A0',
                    300: '#D9C270',
                    400: '#CCAD40',
                    500: '#D4AF37',
                    600: '#AA8C2C',
                    700: '#806921',
                    800: '#554616',
                    900: '#2B230B',
                },
                bronze: {
                    500: '#CD7F32',
                },
                'off-black': '#0b0b0b',
                'glass-white': 'rgba(255, 255, 255, 0.06)',
                'glass-border': 'rgba(212, 175, 55, 0.3)',
                // Dynamic tier colors using CSS variables from CommunityContext
                'tier-std': {
                    DEFAULT: 'var(--tier-std-500)',
                    50: 'color-mix(in srgb, var(--tier-std-500) 10%, white)',
                    100: 'color-mix(in srgb, var(--tier-std-500) 20%, white)',
                    200: 'color-mix(in srgb, var(--tier-std-500) 40%, white)',
                    300: 'color-mix(in srgb, var(--tier-std-500) 60%, white)',
                    400: 'var(--tier-std-400)',
                    500: 'var(--tier-std-500)',
                    600: 'var(--tier-std-600)',
                    700: 'var(--tier-std-700)',
                    800: 'color-mix(in srgb, var(--tier-std-500) 30%, black)',
                    900: 'color-mix(in srgb, var(--tier-std-500) 20%, black)',
                    950: 'var(--tier-std-950)',
                },
                'tier-vip': {
                    DEFAULT: 'var(--tier-vip-500)',
                    400: 'var(--tier-vip-400)',
                    500: 'var(--tier-vip-500)',
                    600: 'var(--tier-vip-600)',
                },
            },
            fontFamily: {
                serif: ['Forum', 'serif'],
                sans: ['Inter', 'sans-serif'],
                grotesk: ['Space Grotesk', 'sans-serif'],
            },
            backgroundImage: {
                'metal-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F2EBCF 50%, #AA8C2C 100%)',
                'dark-metal': 'linear-gradient(to bottom, #1a1a1a, #0b0b0b)',
            },
        },
    },
    plugins: [],
}
