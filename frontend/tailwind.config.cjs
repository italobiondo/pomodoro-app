/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				// Usa as variáveis de tema para light/dark
				background: "var(--bg-body)",
				soft: "var(--surface-soft)",
			},
			borderColor: {
				soft: "var(--border-soft)",
			},
		},
	},

	plugins: [],
};
