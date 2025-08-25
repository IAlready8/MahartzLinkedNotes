/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme (default)
        'bg': '#0f1115',
        'panel': '#151922', 
        'muted': '#8b93a5',
        'text': '#e7ecf5',
        'accent': '#6ee7ff',
        'accent-2': '#9a7cff',
        'success': '#00d18f',
        'warning': '#ffd166',
        'danger': '#ef476f',
        'border': '#1f2434',
        
        // Additional semantic colors
        'card-bg': '#0b0f18',
        'card-border': '#1a2133',
        'input-bg': '#0b0e14',
        'input-border': '#22283a',
        'btn-bg': '#1b2130',
        'btn-border': '#2a3147',
        'btn-hover': '#3a4563',
        'tag-bg': '#111624',
        'tag-border': '#232c44',
        'code-bg': '#0b0f18',
        'editor-header': '#0f1422',
        
        // Link colors
        'link': '#80f3ff',
        'link-hover': '#6ee7ff',
        'link-border': '#284b55',
        'link-id': '#9a7cff',
      },
      fontFamily: {
        'sans': ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Inter', 'Arial', 'sans-serif'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'Monaco', 'monospace'],
      },
      borderRadius: {
        'app': '14px',
      },
      boxShadow: {
        'app': '0 10px 30px rgba(0,0,0,.25)',
      },
      gridTemplateAreas: {
        'app-layout': `
          "top top top"
          "left main right"
        `,
      },
      gridTemplateColumns: {
        'app': '300px 1fr 360px',
        'main-split': '1fr 1fr',
        'kpi': 'repeat(3, 1fr)',
      },
      gridTemplateRows: {
        'app': '48px 1fr',
      },
      height: {
        'editor': 'calc(100vh - 160px)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    function({ addUtilities }) {
      addUtilities({
        '.grid-area-top': {
          'grid-area': 'top',
        },
        '.grid-area-left': {
          'grid-area': 'left',
        },
        '.grid-area-main': {
          'grid-area': 'main',
        },
        '.grid-area-right': {
          'grid-area': 'right',
        },
      })
    }
  ],
}