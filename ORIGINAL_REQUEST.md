# Original User Request

## Initial Request — 2026-09-03T12:42:12Z

This is a single self-contained fix; keep it small and focused. Redesign the public marketing landing page (`app/page.tsx`) to match the exact design language, color tokens, and executive styling of the Beacon dashboard, presenting a clean, non-technical marketing showcase for brand visibility in AI search engines.

Working directory: c:/Users/Cam/Documents/antigravity/goofy-hertz
Integrity mode: development

## Requirements

### R1. Marketing Landing Page Architecture & Sections
Replace the placeholder in `src/app/page.tsx` with a cohesive, full-length public landing page featuring:
- A sticky glassmorphic navigation bar with Beacon brand mark, navigation anchors (*Features*, *Google AI Tracking*, *Pricing*), and CTA button routing to `/login`.
- A high-impact hero section with headline, value proposition subheadline, primary CTA button ("Start Tracking Free"), a secondary badge highlighting Google AI tracking, and an interactive executive dashboard mockup preview.
- "The Shift" comparison module contrasting traditional 10 blue links with modern AI synthesized answers.
- 4 core feature cards with subtle hover lifts (Multi-Engine Visibility, Google AI Mode & Overviews, Citation Discovery, Proactive AI Copilot).
- Interactive pricing/tier gating teaser highlighting Starter vs Pro Tier (Tier 2).
- Minimalist footer with copyright, brand sign-off, and clean navigation links.

### R2. Design System & Typography Alignment
Strictly match the Beacon dashboard visual language: `bg-slate-50` canvas, pure white card surfaces with `border-slate-200`, Beacon emerald accents (`#10b981`), and universal Google Sans typography.

### R3. Non-Technical Executive Tone
All copy must be framed around business outcomes, customer acquisition, and brand visibility in conversational engines (ChatGPT, Google AI Mode/Overviews, Perplexity, Claude), free of technical database or pipeline jargon.

## Acceptance Criteria

### Automated Compilation & Type Safety
- [ ] `npx tsc --noEmit` exits with code 0 without any TypeScript type errors.
- [ ] `npm run build` succeeds with code 0 and compiles `/` cleanly with all client and static components.

### UI & Functional Verification
- [ ] The landing page at `/` renders without browser console errors or hydration mismatches.
- [ ] The sticky header remains fixed with glassmorphic blur when scrolling.
- [ ] All primary CTA buttons and links cleanly route to `/login`.
- [ ] The interactive hero mockup displays realistic model metrics, Share of Voice indicators, and engine icons.
- [ ] Responsive design verified across mobile (< 640px) and desktop (>= 1024px) viewport widths without horizontal overflow.
