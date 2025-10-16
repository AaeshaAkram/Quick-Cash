/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {
			colors: {
				bg: '#0b0f1a', card: '#111827', panel: '#0f172a', border: '#22304a',
				accentA: '#7c3aed', accentB: '#00d4ff', danger: '#ef4444', ok: '#10b981', muted: '#94a3b8'
			}
		}
	},
	plugins: []
}


