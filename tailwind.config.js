const colors = {
  alper: {
    green: '#06805B',
    greenDark: '#05674A',
    navy: '#143D6B',
    navyDark: '#0F2D50',
    blue: '#3b82f6',
    blueDark: '#2563eb',
    teal: '#2C7A93',
    tealDark: '#236179',
    rose: '#e11d48',
    amber: '#d97706',
    ink: '#111827',
    slate: '#374151',
    muted: '#6b7280',
    line: '#e5e7eb',
    surface: '#ffffff',
    background: '#f9fafb',
  },
};

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: [
          'Inter',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['SFMono-Regular', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      borderRadius: {
        control: '8px',
        panel: '9px',
      },
      boxShadow: {
        panel: '0 1px 3px rgba(17,24,39,.06)',
        elevated: '0 24px 60px rgba(30,58,138,.24)',
      },
    },
  },
  plugins: [],
};
