# Design Brief — CyberScan Cyberpunk Makeover

**Tone:** Bold maximalism, retro-futuristic neon, synthwave + cyberpunk aesthetic with intense visual contrast and motion.

**Differentiation:** Threat intelligence interface transforms into a "deep web hacker" dashboard—neon blue on near-black with magenta/pink accents, aggressive glitch animations, scanline overlays on every surface, and pervasive neon glow effects. High-intensity, professional yet edgy.

## Palette (OKLCH)

| Token                | Value               | Usage                                      |
| -------------------- | ------------------- | ------------------------------------------ |
| background           | 0.08 0.02 250       | Page background, near-black with blue tint |
| card                 | 0.15 0.05 255       | Elevated surfaces, threat cards            |
| primary (neon-blue)  | 0.65 0.22 250       | Primary CTAs, highlights, active states    |
| accent (magenta)     | 0.60 0.23 305       | Secondary accents, synthwave mood          |
| destructive (pink)   | 0.65 0.20 335       | Phishing/critical threats, danger alerts   |
| border               | 0.25 0.08 260       | Card borders with glow effect              |
| foreground           | 0.95 0.02 250       | Off-white text, high contrast              |

## Typography

- **Display:** BricolageGrotesque (700 weight) — bold, geometric, futuristic
- **Body:** Inter (400–600 weight) — proven readability, modern tech aesthetic
- **Mono:** GeistMono (400 weight) — code/IPs, technical data emphasis

## Visual Craft

- **Shape Language:** 0.75rem (slightly rounded), borders integrated with 2px neon-glow effect
- **Elevation & Depth:** Glassmorphic cards with blue tint overlay and magenta/blue inner glow; scanline overlay on all surfaces (0.05 opacity horizontal lines)
- **Surfaces & Atmosphere:** Near-black ground (0.08 L), elevated card surfaces (0.15 L) with blue tint, full-page noise/scanline underlay at fixed position
- **Motion Signature:** Glitch animations with magenta/pink color shifts (4s steps), cyber-pulse rings (2s ease-in-out), fade-in-up on load, stagger timing for orchestrated reveal
- **Borders & Glow:** 2px solid neon-blue borders on interactive elements with inset + outer glow shadows; accent borders switch to magenta for secondary CTAs

## Structural Zones

| Zone      | Background  | Border & Glow                  | Text Color | Motion               |
| --------- | ----------- | ------------------------------ | ---------- | -------------------- |
| Header    | 0.12 L      | neon-blue glow, bottom shadow  | 0.95 L     | nav-active glitch    |
| Cards     | 0.15 L      | neon-blue or magenta glow edge | 0.95 L     | card-hover lift      |
| Sidebar   | 0.12 L      | 0.25 L border, glow on hover   | 0.95 L     | fade-in-up stagger   |
| Buttons   | 0.18 L      | neon glow border               | 0.08 L     | cyber-pulse infinite |
| Inputs    | 0.18 L      | neon-blue focus ring, glow     | 0.95 L     | focus ring shift     |
| Threat UI | 0.17 L      | neon-pink/danger glow          | 0.65 L     | pulse + scanline     |

## Spacing & Rhythm

- **Gap base:** 1rem (16px), 1.5rem for large sections, 0.5rem for tight UI
- **Padding hierarchy:** card padding 1.5rem, button padding 0.75rem 1.5rem, section padding 2rem
- **Density:** Moderate — readable threat cards with breathing room, scanline overlay adds visual texture without clutter

## Component Patterns

- **Buttons:** neon-blue base, magenta accent variant, neon-pink destructive. All 2px glow borders, cyber-pulse animation on hover/focus.
- **Cards:** glass effect + blue tint, neon-blue glow border, scanline overlay. Hover lifts 2px, border glow intensifies.
- **Inputs:** neon-blue focus ring (4px, 0.2 opacity), dark background with blue tint, glow shadow on focus.
- **Links:** inherit color, underline on hover with glow text-shadow, nav-active state with glitch effect and bottom glow bar.
- **Badges/Tags:** neon-pink for danger/phishing, neon-blue for default, magenta for meta/info. All with glow effect.

## Motion & Animation

- **Glitch (4s steps):** Header title, threat level badges — magenta/pink shadow shift with 2px translate
- **Cyber-Pulse (2s ease-in-out):** Primary buttons, active threat rings — box-shadow scales, glow intensifies
- **Scan-Overlay (always-on):** 2px horizontal lines at 0.05 opacity across all surfaces — subtle, pervasive
- **Fade-In-Up (0.5s ease-out):** Content reveal on page load, staggered per child element (0.05s–0.25s delay)
- **Card Hover (0.2s ease):** -2px translateY, border glow intensifies, shadow expands
- **Full-Page Scanline (fixed):** 1px blue lines at 0.02 opacity, always visible in background layer

## Constraints & Anti-Patterns

- **No lime green.** Full palette replacement — primary is neon-blue (0.65 L, 250° hue), accent is magenta (305° hue), danger is neon-pink (335° hue).
- **Glow > shadow.** All elevation uses box-shadow glow effects, not traditional drop-shadows. Inset glows for depth.
- **Scanline > gradient.** Background texture is horizontal scanlines + subtle gradient, not full-page gradients or geometric patterns.
- **Glitch is rare.** Only on headers and threat-level indicators — not every interactive element. Reserved for high-impact moments.
- **Contrast locked.** 0.95 L foreground on 0.08 L background = 0.87 delta. Maintained across all text surfaces for readability.

## Signature Detail

**Neon Glow Borders + Scanline Overlay**: Every interactive surface (buttons, cards, inputs) combines 2px solid neon-blue border with layered box-shadow (inset glow + outer glow). Scanline overlay underlay (fixed position, full-page) adds a CRT/cyberpunk atmosphere. The combo creates a "hacker console" aesthetic that feels intentional and high-tech, not generic.

## Differentiation

CyberScan is now visually unforgettable — a dark, intense, futuristic threat intelligence dashboard where every color serves a purpose (neon-blue = primary action, magenta = synthwave accent, neon-pink = danger) and every surface pulses with subtle motion. No defaults, no safe choices. The cyberpunk palette and glitch animations position it as a tool for professionals who take digital security seriously.
