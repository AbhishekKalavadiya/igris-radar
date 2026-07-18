/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
      './pages/**/*.{js,jsx}',
      './components/**/*.{js,jsx}',
      './app/**/*.{js,jsx}',
      './src/**/*.{js,jsx}',
      './lib/**/*.{js,jsx}',
    ],
    prefix: "",
    theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
    		colors: {
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			},
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			},
    			/* Igris brand named colors — use for hardcoded teal references */
    			igris: {
    				primary:  '#1a5a6b',
    				dark:     '#134a58',
    				darker:   '#0f4c5c',
    				light:    '#f0f9fa',
    				teal:     '#0f766e',
    				'teal-light': '#ccfbf1',
    			},
    			/* Semantic status */
    			success: 'hsl(var(--success))',
    			warning: 'hsl(var(--warning))',
    			/* Scanner identity accents — one per audit tool */
    			scanner: {
    				security: 'hsl(var(--accent-security))',
    				seo:      'hsl(var(--accent-seo))',
    				aeo:      'hsl(var(--accent-aeo))',
    				geo:      'hsl(var(--accent-geo))',
    				aso:      'hsl(var(--accent-aso))',
    				brand:    'hsl(var(--accent-brand))',
    				health:   'hsl(var(--accent-health))',
    			},
    			/* Finding severity */
    			severity: {
    				critical: 'hsl(var(--severity-critical))',
    				high:     'hsl(var(--severity-high))',
    				medium:   'hsl(var(--severity-medium))',
    				low:      'hsl(var(--severity-low))',
    			}
    		},
    		fontFamily: {
    			sans: ['Inter', 'system-ui', 'sans-serif'],
    			mono: ['Roboto Mono', 'ui-monospace', 'monospace'],
    		},
    		boxShadow: {
    			'igris-sm': 'var(--shadow-sm)',
    			'igris-md': 'var(--shadow-md)',
    			'igris-lg': 'var(--shadow-lg)',
    		},
    		borderRadius: {
    			xl: 'var(--radius-xl)',
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)',
    			/* Igris pill — for avatars/badges only */
    			pill: '999px',
    		},
    		keyframes: {
    			'accordion-down': {
    				from: { height: '0' },
    				to: { height: 'var(--radix-accordion-content-height)' }
    			},
    			'accordion-up': {
    				from: { height: 'var(--radix-accordion-content-height)' },
    				to: { height: '0' }
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		},
    		transitionTimingFunction: {
    			'igris': 'cubic-bezier(0.2, 0, 0, 1)',
    		},
    		transitionDuration: {
    			'fast': '150ms',
    		},
    	}
    },
    plugins: [require("tailwindcss-animate")],
  }
