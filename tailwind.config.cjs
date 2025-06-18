/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'bg-blue-500',
    'text-white',
    'p-4',
    'text-xl',
    'mb-4',
    'bg-blue-600',
    'hover:bg-blue-700',
    'text-green-600',
    'text-yellow-500',
    'text-orange-500',
    'text-red-600'
  ]
}