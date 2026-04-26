---
name: Arid Sentinel
colors:
  surface: '#fff8f3'
  surface-dim: '#e1d9d0'
  surface-bright: '#fff8f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2e9'
  surface-container: '#f5ede4'
  surface-container-high: '#efe7de'
  surface-container-highest: '#e9e1d8'
  on-surface: '#1e1b16'
  on-surface-variant: '#4e4639'
  inverse-surface: '#34302a'
  inverse-on-surface: '#f8efe6'
  outline: '#7f7667'
  outline-variant: '#d1c5b4'
  surface-tint: '#775a19'
  primary: '#775a19'
  on-primary: '#ffffff'
  primary-container: '#c5a059'
  on-primary-container: '#4e3700'
  inverse-primary: '#e9c176'
  secondary: '#745853'
  on-secondary: '#ffffff'
  secondary-container: '#fed7d0'
  on-secondary-container: '#795c57'
  tertiary: '#005faf'
  on-tertiary: '#ffffff'
  tertiary-container: '#65a7ff'
  on-tertiary-container: '#003b71'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdea5'
  primary-fixed-dim: '#e9c176'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4201'
  secondary-fixed: '#ffdad4'
  secondary-fixed-dim: '#e3beb8'
  on-secondary-fixed: '#2b1613'
  on-secondary-fixed-variant: '#5b403c'
  tertiary-fixed: '#d4e3ff'
  tertiary-fixed-dim: '#a5c8ff'
  on-tertiary-fixed: '#001c3a'
  on-tertiary-fixed-variant: '#004786'
  background: '#fff8f3'
  on-background: '#1e1b16'
  surface-variant: '#e9e1d8'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-bold:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin: 32px
  max_width: 1440px
---

## Brand & Style

The brand personality is grounded, authoritative, and urgently humanitarian. This design system bridges the gap between sophisticated data visualization and environmental stewardship. It evokes a sense of "technological empathy"—combining the precision of satellite monitoring with the warmth of human-centric action.

The chosen style is **Corporate Modern with Tactile Warmth**. It avoids the coldness of traditional SaaS by using organic earth tones while maintaining a premium startup aesthetic through high-impact typography and expansive whitespace. The interface feels like a high-end physical field journal translated into a digital cockpit: precise, clean, and profoundly reliable.

## Colors

The palette is rooted in the "Earth and Sky" dichotomy.
- **Desert Gold (#C5A059)**: Used for primary actions and highlighting critical drought data. It represents value and the sun.
- **Warm Sand (#F5E6CA)**: The primary canvas color. It reduces eye strain compared to pure white and reinforces the environmental theme.
- **Deep Brown (#3E2723)**: Provides the grounding force for typography and deep structural elements, replacing standard blacks for a more sophisticated, organic feel.
- **Muted Green (#689F38)**: Reserved for "Recovery" or "Safe" zones, representing ecological health and successful intervention.
- **Modern Accent Blue (#1976D2)**: Used exclusively for data overlays, water-source tracking, and interactive links to provide high-contrast clarity against the warm base.

## Typography

This design system utilizes a high-contrast typographic pairing to balance technicality with readability. 

**Space Grotesk** is used for headings to provide a technical, geometric edge that suggests satellite precision and modern engineering. Its bold weights create the "high-impact" look required for emergency alerts and data summaries.

**Manrope** is used for all body copy and UI labels. Its balanced, modern proportions ensure maximum legibility during long-form report reading. Letter spacing is slightly tightened for headlines to maintain a compact, "premium" feel, while labels utilize increased tracking for clarity in small-scale UI components.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop to maintain the "field report" aesthetic, centering content with generous margins. A 12-column grid is used with wide 24px gutters to give complex data visualizations room to breathe. 

The rhythm is strictly based on a 4px baseline. Spacing between sections (lg/xl) is intentionally large to prevent the density of environmental data from becoming overwhelming, reinforcing the "Minimalist" brand influence.

## Elevation & Depth

This design system uses **Tonal Layers** combined with **Ambient Shadows**. 

Depth is primarily communicated through subtle shifts in surface color (e.g., a card being slightly lighter than the 'Warm Sand' background). Shadows are not used to simulate floating, but rather to provide a soft "lift" (Low-opacity, Deep Brown tint, 15-20px blur) to interactive elements like primary cards and modals. 

Thin, 1px borders in a semi-transparent 'Deep Brown' (10% opacity) are used on secondary elements to define boundaries without adding visual weight, maintaining the clean lines of the premium startup aesthetic.

## Shapes

The shape language is **Soft (0.25rem)**. 

While the "Modern" aesthetic often leans into hyper-rounded corners, this design system uses tighter radii to maintain a sense of professional seriousness and architectural stability. Buttons and input fields use the standard `rounded` (4px), while large data containers and map modules use `rounded-lg` (8px). This subtle rounding softens the technical data without making the interface feel "playful" or "juvenile."

## Components

- **Buttons**: Primary buttons are solid 'Desert Gold' with 'Deep Brown' text for maximum contrast. Secondary buttons use a 'Deep Brown' outline. The hover state involves a subtle darkening of the fill and a slight increase in shadow depth.
- **Cards**: Backgrounds are pure white or a very pale tint of 'Warm Sand'. They feature a 1px border and a soft ambient shadow on hover.
- **Input Fields**: Borders use a muted version of 'Deep Brown'. Focus states transition the border to 'Modern Accent Blue' to signal active technical input.
- **Chips/Badges**: Small, high-contrast indicators. Use 'Muted Green' for positive trends (e.g., "Increased Rainfall") and 'Desert Gold' for warnings.
- **Data Visualizations**: Charts should use 'Modern Accent Blue' for water-related data and 'Desert Gold' or 'Deep Brown' for soil and heat metrics. 
- **Progress Bars**: Used for "Water Reserve" levels, utilizing a 'Modern Accent Blue' fill against a 'Warm Sand' track.
- **Navigation**: A clean top-tier bar with 'Deep Brown' text and 'Desert Gold' active indicators (bottom-border 2px).