---
name: Warm Culinary Modern
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#584237'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#8c7164'
  outline-variant: '#e0c0b1'
  surface-tint: '#9d4300'
  primary: '#9d4300'
  on-primary: '#ffffff'
  primary-container: '#f97316'
  on-primary-container: '#582200'
  inverse-primary: '#ffb690'
  secondary: '#006e2d'
  on-secondary: '#ffffff'
  secondary-container: '#7cf994'
  on-secondary-container: '#007230'
  tertiary: '#855300'
  on-tertiary: '#ffffff'
  tertiary-container: '#d78900'
  on-tertiary-container: '#492c00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb690'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#783200'
  secondary-fixed: '#7ffc97'
  secondary-fixed-dim: '#62df7d'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005320'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The design system positions itself as an intelligent, warm, and hyper-reliable culinary companion. Balancing computational AI precision with organic culinary pleasure, the aesthetic avoids clinical laboratory tropes in favor of an inviting, sensory-rich kitchen atelier feel. 

The personality is encouraging, crisp, and effortless. Interfaces are lightweight and uncluttered to let rich culinary photography and instant AI recognition results take center stage. The style merges Modern Functionalism with tactile, warm micro-surfaces:
- Generous breathable whitespace paired with warm-tinted base foundations.
- Hyper-focused visual hierarchy where AI recognition metrics (confidence scores, ingredient detections) feel natural and immediate rather than intimidating.
- Crisp vector iconography, clean lines, and soft rounded contours that invite touch and interaction.

## Colors
The palette balances culinary warmth with analytical clarity:
- **Canvas & Surface**: The base canvas is anchored by a warm cream tone (`#FAF7F2`), while interactive cards and modular panels utilize pristine white (`#FFFFFF`) to pop softly against the background.
- **Primary Accent (`#F97316`)**: Zesty citrus orange acts as the focal driver for main actions (e.g., "Scan Meal", "Generate Recipe"), key highlights, active selection indicators, and focused tab underlines.
- **Secondary Accent (`#16A34A` / `#22C55E`)**: Fresh culinary greens signify high-confidence AI predictions (e.g., `>90% match`), fresh ingredient validations, dietary safety, and completed steps.
- **Tertiary Accent (`#F59E0B`)**: Warm golden amber serves as an informative caution layer for lower AI confidence levels, substitute ingredient suggestions, and prep-time timers.
- **Neutrals**: Core headings and primary metrics use a deep, grounding charcoal (`#1F2937`), secondary instructional copy relies on slate (`#4B5563`), and structural layout framing leverages subtle hairline tones (`#E5E7EB` and `#F3F4F6`).

## Typography
The system blends the geometric warmth of **Plus Jakarta Sans** for prominent titles with the unmatched technical legibility of **Inter** for data grids, recipe procedures, and ingredient metrics:
- Headlines are tightly tracked (`-0.02em` to `-0.03em`) with heavy weights (`700` and `800`) to evoke a clean, modern lifestyle editorial feel.
- Body copy is set with generous line heights (`1.5` to `1.6`) to ensure high readability during hands-free cooking or glanceable scanning.
- Micro-labels and confidence badges employ medium-to-bold weights with slight tracking expansion to maintain clarity across dense ingredient tags and detection chips.

## Layout & Spacing
A 12-column responsive fluid grid underpins the layout architecture:
- **Desktop (1024px+)**: Max-width locked container at `1280px` with `2rem` margins and `1.5rem` gutters. Accommodates two-pane layouts (e.g., Live Viewfinder/Upload Dropzone alongside dynamic Parsed Ingredient & Recipe sidebars).
- **Tablet (768px - 1023px)**: Reflows to an 8-column structure with `1.5rem` margins and gutters. Sidebars fold into sequential collapsible cards.
- **Mobile (< 768px)**: 4-column single-stream stack with `1rem` edge margins and gutters. Key action bars become sticky bottom sheets for natural thumb reach.

## Elevation & Depth
Depth is achieved through warm, diffused ambient shadows paired with low-contrast borders:
- **Base Canvas**: Completely flat (`#FAF7F2`), anchoring the entire application.
- **Resting Containers & Cards**: White surfaces (`#FFFFFF`) with a delicate hairline perimeter border (`1px solid #E5E7EB`) elevated by an ambient tinted shadow (`0 2px 8px -2px rgba(31, 41, 55, 0.04), 0 1px 4px -1px rgba(249, 115, 22, 0.02)`).
- **Floating Controls & Modals**: Used for scan capture bars, live detection highlights, and floating action triggers (`0 12px 24px -4px rgba(31, 41, 55, 0.08), 0 4px 12px -2px rgba(31, 41, 55, 0.03)`).
- **Dropzones**: Border-driven hierarchy featuring dashed 2px outlines (`#E5E7EB` at rest, transitioning to `#F97316` on drag-over) with zero shadow to emphasize canvas receptivity.

## Shapes
A hybrid geometry provides both structure and tactile playfulness:
- **Cards & Modules**: Bound by `1rem` (16px / `rounded-2xl`) corners to establish a soft, modern framing for recipe steps, nutrition cards, and AI panels.
- **Interactive Thumbnails & Input Fields**: Standardized to `0.75rem` (12px / `rounded-xl`) for visual sharpness within compact modules.
- **Buttons, Confidence Badges, & Chips**: Completely pill-shaped (`9999px` / `rounded-full`) to differentiate actionable triggers and quick-glance status indicators from structural content boxes.

## Components

### Buttons
- **Primary**: Solid vibrant orange (`#F97316`) background, white label, full pill radius (`rounded-full`), `0.75rem` vertical and `1.5rem` horizontal padding. On hover: shifts to `#EA580C` with subtle scale-up (`scale-[1.02]`).
- **Secondary**: Crisp white background with subtle border (`1px solid #E5E7EB`) and dark charcoal text (`#1F2937`). On hover: border tints to `#F97316` and text subtly shifts warm.
- **Ghost/Tertiary**: No border or background; slate text (`#4B5563`) that turns `#F97316` on hover.

### Chips & Confidence Tags
- **High Confidence (90%+ Match)**: Pill container (`rounded-full`) with light emerald tint background (`rgba(22, 163, 74, 0.1)`), deep leaf-green text (`#16A34A`), featuring a leading check or confidence dot indicator.
- **Medium/Low Confidence (< 90%)**: Soft amber background (`rgba(245, 158, 11, 0.12)`), warm amber text (`#D97706`).
- **Ingredient Filter Pill**: Clean white surface with neutral hairline border; turns solid `#F97316` with white text when selected.

### Input Fields & Camera Dropzones
- **Inputs & Search**: `0.75rem` radius (`rounded-xl`), `#FFFFFF` background, `1px solid #E5E7EB` border. Focus ring applies a distinct 2px ring in translucent orange (`rgba(249, 115, 22, 0.2)`) with `#F97316` border.
- **AI Dropzone**: Substantial container framed with `2px dashed #D1D5DB`, soft off-white interior hover state (`rgba(249, 115, 22, 0.02)`), containing minimalist Lucide-style camera/upload icons and friendly typography.

### Structured Cards & Checklists
- **Recipe Checklist Card**: Surface at `#FFFFFF` with `16px` border-radius and ambient shadow. Checklist rows feature custom circular checkboxes (`rounded-full`) that transition from clean neutral borders to solid `#16A34A` when struck through.
- **Step Progress Indicator**: Horizontal node track using solid `#F97316` for completed/active steps, and `#E5E7EB` for upcoming steps, accompanied by micro labels.