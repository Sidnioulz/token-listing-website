# Token Listing design guidelines

Token Listing is infrastructure: a format that sits between token translators and the tools that consume them. The site should look like it was engineered, not decorated. This document is the source of truth for the brand. It is rendered inside Storybook ("Brand / Design guidelines") and its values live in code as `src/styles/intents.css`.

## 1. Personality

Three words, in priority order:

| Word | What it means on screen | What it rules out |
|---|---|---|
| **Precise** | Right angles, thin rules, a visible grid, mono labels, exact spacing. | Rounded blobs, soft shadows, decorative gradients. |
| **Electric** | One lime signal on an indigo field. It reads like a status light in a dark room. | Lime used as a fill colour for large areas, several lime elements competing. |
| **Steady** | Nothing wobbles. Motion is a change of state, ambient motion is slow and quiet. | Springs, overshoot, hover-lift cards, anything that pulses on its own. |

The site is designed dark first. Light mode is a mirror of the same intents and is tuned after dark is finished.

## 2. Colour: intents, priorities, modes

We follow the Mise en Mode approach: a small set of **intents** named by purpose, priority and property. Context never adds tokens. Context is a **mode** that re-values the same intents on a container.

### Naming

```
--tl-{purpose}-{priority}-{property}
```

| Axis | Values | Meaning |
|---|---|---|
| purpose | `action` `surface` `text` | What the element is for. Buttons and links are actions, pages, cards, nav and the grid are surfaces, prose and headings are text. |
| priority | `primary` `secondary` `auxiliary` | How much attention it should get. **Primary is lime and there is one per view.** Secondary is violet and carries everything load-bearing. Auxiliary is muted. |
| property | `background` `foreground` `border` | The CSS property the value feeds. |

Priority encodes attention, not hue. The rule "lime is the signal, violet is the structure" is a consequence: lime goes on the one thing you should look at next (the primary CTA, the page title, the active nav item, the focus ring, the hover border, the grid spotlight) and never fills a large area. Violet carries secondary buttons, links, card borders, grid lines at rest.

### Values (dark, the root mode)

| Intent | Value | Used for |
|---|---|---|
| `action-primary-background` / `-border` | `#a3df00` | the primary button fill, focus rings |
| `action-primary-foreground` | `#05001a` | text on the primary button |
| `action-secondary-border` | `#7b61ff` | outlined secondary button, prose links |
| `action-secondary-foreground` | `#a89adf` | secondary button text |
| `action-auxiliary-foreground` | `#a89adf` | text-only buttons |
| `surface-primary-background` | `#05001a` | the page |
| `surface-primary-foreground` | `#f0eeff` | default text on the page |
| `surface-primary-border` | `#a3df00` | the hover and focus border of any surface |
| `surface-secondary-background` | `#0d0530` | cards, nav, sidebar |
| `surface-secondary-border` | `#4d3a9e` | card borders at rest, grid lines, chip borders |
| `surface-auxiliary-background` | `#160840` | icon chips, inline code |
| `surface-auxiliary-border` | `#2a1e60` | hairlines |
| `text-primary-foreground` | `#a3df00` | h1, inline code, hover state of links |
| `text-secondary-foreground` | `#f0eeff` | headings, card titles |
| `text-auxiliary-foreground` | `#a89adf` | taglines, card bodies, labels |

Light-mode values are a first mirror in `intents.css` under `[data-theme='light']` and are not final.

### Modes

- `dark` and `light` are root modes set by Starlight on `<html data-theme>`.
- A section that needs to feel louder gets a nested mode on its container that re-values intents. It does not get new tokens.
- Interaction states (hover, focus, active) are not modes. They are expressed by swapping which intent an element reads, e.g. a card border reads `surface-secondary-border` at rest and `surface-primary-border` on hover.

Starlight's own `--sl-*` variables are assigned from intents in `src/styles/custom.css`. Nothing else writes `--sl-*`.

## 3. Typography

- **Body and headings** use the system sans stack. No web fonts. A spec site should not make you wait for a typeface, and system fonts read as steady.
- **The mono stack is the label voice.** Card titles, button labels, eyebrows, badges, section numbering. Uppercase, weight 600, `letter-spacing: 0.02em`.
- Body prose is 18px (`--sl-text-lg`). Headings h2 and h3 are weight 700. The h1 is `text-primary` lime.
- Mono glyphs sit low in their line box. In buttons the label gets `line-height: 1` and the icon a small negative block margin so both centre on the same optical line.

## 4. Shape

- **No radius anywhere.** Corners are either square or chamfered at 45 degrees with `corner-shape: bevel`, using `border-radius` as the bevel size. Browsers without `corner-shape` get square corners, which is still on-brand.
- `--tl-bevel-sm` (6px) on buttons and the primary chip. `--tl-bevel-lg` (14px) on cards.
- **Cards chamfer one corner only, the top right.** It reads as a tab or a clipped ticket and gives the card a direction. Buttons chamfer all four because they are small enough to read as one shape.
- **Borders are 1px (`--tl-rule`) and define surfaces.** A filled box is an action, a bordered box is a surface. No drop shadows at rest and no glows: elevation does not exist in this system, only border colour.
- Code blocks, tables and asides stay square.

## 5. Motion

Motion is a change of state, not a performance.

| Token | Value | Use |
|---|---|---|
| `--tl-motion-fast` | 120ms | colour, background, border, opacity |
| `--tl-motion-base` | 200ms | the rare transform |
| `--tl-ease` | `cubic-bezier(0.2, 0, 0, 1)` | everything the user triggers |
| `--tl-ease-ambient` | `ease-in-out` | ambient loops |

Rules:

1. **One easing family.** No springs, no overshoot.
2. **Light over displacement.** Hover and focus change border colour and text colour. Translate is capped at 1px and used only on the primary button. Nothing scales.
3. **Ambient motion is slow and subtle.** Nothing ambient cycles faster than 4s.
4. **Reduced motion is a hard off.** Under `prefers-reduced-motion`, ambient motion stops and interaction transitions drop to 0ms. Not slower. Off.

## 6. The grid

The grid is the most recognisable brand element and appears behind every page. It is two fixed layers:

- A **violet grid** (`--tl-grid-color-rest`, a saturated violet kept quiet by `--tl-grid-line-alpha`). It only repaints when the cell size changes on scroll.
- A **lime copy of the grid**, offset upward by half a cell so its lines fall between the violet lines, masked by a very large, soft radial gradient whose centre follows the cursor. A `requestAnimationFrame` loop lerps the centre toward the pointer and goes idle once converged, so it costs nothing while the mouse is still. Only two custom properties change per frame. A slow opacity breathe replaces any fixed pulse.

Parameters (all in `intents.css`, all overridable per instance of `GridBackground`):

| Parameter | Default | Effect |
|---|---|---|
| `--tl-grid-cell` | 40px | cell size |
| `--tl-grid-line-alpha` | 0.11 | opacity of the violet lines (the lime layer uses 1.8× this) |
| `--tl-spot-radius` | 110vmax | size of the lime region. Large on purpose so the whole grid tints and the effect is not localised enough to feel like it moves. |
| `--tl-spot-softness` | 0% | where the fade starts. 0% fades from the centre. |
| `--tl-spot-intensity` | 0.35 | max opacity of the lime layer. Subtle on purpose. |
| `--tl-spot-bloom` | 0.05 | opacity of a soft lime haze behind the lime grid |
| `--tl-spot-follow` | 0.3 | lerp factor per frame. 1 is instant. |
| `--tl-spot-breathe-period` | 8s | breathe cycle. 0 disables. |
| `--tl-spot-breathe-amount` | 0.35 | fraction of intensity that breathes away |
| `--tl-grid-scroll-rate` | 0.333 | cell growth per viewport height scrolled (0.333 = +33%), no upper limit. Both layers are anchored to the bottom edge, so growth pushes lines upward. 0 disables. |

Under reduced motion the spotlight parks at its idle position (top centre), does not breathe, and the cell size does not change on scroll.

## 7. Icons

- **Phosphor regular is the base set**, used through `astro-icon` as `ph:<name>`. It won the icon vote 12 to 9 against Starlight, Tabler and Lucide combined (Heroicons and Material Symbols got none).
- Nine liked icons from other sets are kept as SVG files. `src/icons/original/` is the untouched source. `src/icons/adjusted/` is re-gridded to Phosphor's 256 canvas and 24..232 bounds, with 16-unit round strokes, which is Phosphor's 1.5px weight. Use `adjusted/<file>` on the site and keep `original/` for comparison. Starlight's filled glyphs could only be resized, not re-weighted.
- **The chip is the brand treatment, not the glyph.** An icon on a surface sits in a square `IconChip`: lime glyph, `surface-auxiliary` background, 1px `surface-secondary` border that turns lime with the card. Chips are never chamfered so glyphs stay legible.
- Inside buttons the icon is bare, 18px, after the label by default.
- Logo and favicon are still Starlight's defaults and are a separate piece of work.

## 8. Components

| Component | Shape | Rest | Hover and focus |
|---|---|---|---|
| **Button primary** | four chamfers, filled | lime fill, dark mono label | fill lightens 12%, rises 1px, lime focus ring |
| **Button secondary** | four chamfers, outlined | violet 1px border, muted violet label | border and label go lime |
| **Button auxiliary** | none | muted violet text | text goes lime |
| **Card** | one chamfer top right | `surface-secondary` fill, 1px violet border | border and chip border go lime |
| **IconChip** | square | lime glyph on `surface-auxiliary` | follows its card |
| **Prose link** | underline | violet | lime |
| **GridBackground** | | static violet grid | lime spotlight follows cursor |

Every component is in Storybook under "Brand" with its variants and controls.

## 9. Accessibility

- Lime on `#05001a` and dark text on lime both exceed 7:1. Violet `#7b61ff` on `#05001a` is about 5:1, so violet is never used for small text under 14px.
- Focus is always visible: a 2px lime outline offset 3px, or a lime border on surfaces.
- Reduced motion is honoured as described in section 5.
- Hover never carries meaning that focus does not also carry.

## 10. Open items

- Light mode: mirror the dark values properly and verify contrast.
- Logo and favicon.
- Nested emphasis mode for sections that need to be louder, if one is ever needed.
