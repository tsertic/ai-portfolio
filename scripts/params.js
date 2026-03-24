/**
 * Daily parameter generator for AI portfolio regeneration.
 * Each run picks random values from each category to make every day unique.
 * null = "let the AI decide freely"
 */

// ─── Parameter definitions ──────────────────────────────────────────────────

const PARAMS = {

  // Should the portrait photo be shown?
  // Weighted: portrait appears more often than not
  use_portrait: [true, true, true, true, false],

  // Creativity / wildness scale 0–100
  // 0  = strictly professional, clean, corporate
  // 50 = balanced creative professional
  // 100 = full circus, anything goes
  creativity: () => Math.floor(Math.random() * 101),

  // Visual theme / aesthetic — null means AI decides
  theme: [
    null, null, null,           // AI decides most of the time
    "brutalism",
    "ocean and Adriatic sea",
    "cyberpunk neon city",
    "retro 1990s web nostalgia",
    "newspaper editorial print",
    "minimal Swiss grid design",
    "art deco golden age",
    "dark cosmos and space",
    "neon Tokyo night market",
    "forest and nature organic",
    "glassmorphism frosted glass",
    "Memphis 80s pattern design",
    "vintage analogue film",
    "hipster beard and craft",
    "Croatian coast summer",
    "dark academia library",
    "vaporwave retro aesthetic",
    "blueprint technical drawing",
    "stained glass cathedral",
    "noir detective film",
    "tropical maximalism",
    "Scandinavian hygge cozy",
    "steampunk brass and gears",
    "pixel art 8-bit retro",
    "terracotta Mediterranean",
    "aurora borealis arctic",
    "origami paper craft",
    "chalkboard classroom",
    "synthwave sunset drive",
  ],

  // Text voice / tone — null means AI decides
  text_tone: [
    null, null,                 // AI decides often
    "sarcastic and witty",
    "clever and intellectual",
    "cynical but self-aware",
    "serious and authoritative",
    "poetic and slightly dramatic",
    "casual and friendly",
    "formal and polished",
    "humorous and self-deprecating",
    "confident and bold",
    "mysterious and cryptic",
    "stoic and minimal",
    "enthusiastic and energetic",
    "dry deadpan humor",
    "philosophical and reflective",
    "street-smart and direct",
    "warm and storytelling",
    "provocative and contrarian",
  ],

  // Page layout approach — null means AI decides
  layout: [
    null, null,
    "single centered column",
    "asymmetric split layout",
    "magazine editorial grid",
    "bento box card grid",
    "full-screen snap sections",
    "sidebar navigation with content area",
    "timeline vertical story",
    "overlapping layered cards",
    "centered hero with floating elements",
    "zigzag alternating sections",
    "masonry staggered grid",
    "dashboard panel layout",
    "newspaper multi-column",
    "diagonal sliced sections",
  ],

  // Color palette mood — null means AI decides
  color_mood: [
    null, null,
    "monochrome black and white",
    "earthy warm terracotta tones",
    "neon vibrant electric",
    "soft pastel muted",
    "dark moody atmospheric",
    "high contrast bold",
    "duotone two-color",
    "gradient mesh colorful",
    "ocean blues and teals",
    "forest greens and browns",
    "gold and black luxurious",
    "red and dark dramatic",
    "candy pop bright and playful",
    "sepia warm vintage",
    "ice cold blues and whites",
    "sunset orange to purple gradient",
    "matte jewel tones",
  ],

  // Typography character — null means AI decides
  typography: [
    null, null,
    "serif editorial magazine style",
    "monospace terminal code feel",
    "large display ultra-bold headers",
    "clean humanist sans-serif",
    "condensed tall narrow fonts",
    "mixed expressive variable fonts",
    "oldstyle classic serif",
    "geometric modern sans",
    "handwritten script headers with clean body",
    "slab serif industrial",
    "futuristic tech sans",
    "elegant thin light-weight type",
  ],

  // How elaborate should decorative background elements be?
  decoration: [
    "none",
    "minimal — one or two subtle shapes",
    "moderate — a few SVG blobs or grid lines",
    "heavy — multiple layered decorations",
    "extreme — maximalist visual noise",
  ],

  // ─── HERO SECTION ─────────────────────────────────────────────────────────

  // Overall hero layout composition — null means AI decides
  hero_layout: [
    null, null, null,
    "centered — everything stacked in the middle",
    "split — portrait/visual on one side, text on the other",
    "text overlaid on a full-background pattern or illustration",
    "minimal — just name and title, lots of whitespace",
    "stacked cinematic — big fullscreen text with scroll cue",
    "diagonal split — angled divider between visual and text",
    "scattered — name, title, links placed around the viewport freely",
    "card-style — hero content inside a floating card/panel",
    "asymmetric offset — text heavy on one side, visual peeking from edge",
  ],

  // Hero headline size intensity
  hero_headline_scale: [
    null, null,
    "subtle — standard h1 size, nothing crazy",
    "large — noticeably big, makes a statement",
    "massive — viewport-dominating, almost typographic art",
    "mixed — huge first name, smaller subtitle underneath",
  ],

  // Hero background treatment — null means AI decides
  hero_background: [
    null, null, null,
    "solid color",
    "subtle gradient",
    "bold multicolor gradient",
    "CSS pattern (dots, stripes, grid)",
    "animated gradient that slowly shifts",
    "large faded typography watermark in background",
    "geometric shapes composition",
    "noise/grain texture overlay",
    "radial spotlight / vignette effect",
  ],

  // Hero CTA (call-to-action) button style — null means AI decides
  hero_cta_style: [
    null, null,
    "solid filled buttons",
    "outlined / ghost buttons",
    "pill-shaped rounded buttons",
    "underline text links, no buttons",
    "icon-only circular buttons",
    "one primary filled + secondary outlined",
    "floating action buttons with hover effects",
    "brutalist chunky block buttons",
  ],

  // Hero vertical height — null means AI decides
  hero_height: [
    null, null,
    "compact — just enough for content, ~50vh",
    "full viewport — 100vh with scroll cue below",
    "extra tall — 80vh, breathing room",
    "auto — natural content height, no forced height",
  ],

  // ─── NAVIGATION ───────────────────────────────────────────────────────────

  // Navigation style — null means AI decides
  nav_style: [
    null, null, null,
    "fixed top bar — always visible on scroll",
    "sticky top — visible but scrolls into view",
    "hidden on scroll down, shows on scroll up",
    "minimal floating — small pill in corner",
    "hamburger menu icon only (even on desktop)",
    "bottom bar — fixed navigation at the bottom",
    "inline in hero — no separate nav bar, links inside hero",
    "side dots — floating dot indicators on the side",
  ],

  // ─── PROJECT CARDS ────────────────────────────────────────────────────────

  // How project cards are presented — null means AI decides
  card_style: [
    null, null,
    "clean flat cards with subtle shadow",
    "bordered cards with no shadow",
    "glassmorphism translucent cards",
    "cards with colored left/top accent border",
    "full-bleed image header cards",
    "minimal — no cards, just separated content blocks",
    "dark inset/recessed cards",
    "hover-to-reveal — minimal at rest, details on hover",
    "stacked paper / layered card effect",
    "terminal window styled cards (title bar with dots)",
  ],

  // ─── ANIMATION & INTERACTION ──────────────────────────────────────────────

  // Scroll animation intensity — null means AI decides
  scroll_animation: [
    null, null,
    "none — everything static and immediately visible",
    "minimal — subtle fade-up on sections (CSS only, short delay)",
    "moderate — staggered entrance of cards and elements",
    "playful — elements slide/bounce in from different directions",
  ],

  // Hover interaction intensity — null means AI decides
  hover_effects: [
    null, null,
    "none — clean and static",
    "subtle — slight lift or color shift on cards",
    "moderate — scale, shadow change, color transitions",
    "expressive — tilt, glow, border animations, underline slides",
  ],

  // Cursor / pointer special effects — very rare
  cursor_effect: [
    null, null, null, null, null, null, null,  // almost never
    "custom CSS cursor shape",
    "subtle glow/dot following cursor (lightweight JS)",
    "magnetic effect — buttons slightly attract cursor on hover",
  ],

  // ─── SKILLS / ABOUT SECTION ───────────────────────────────────────────────

  // How skills are displayed — null means AI decides
  skills_display: [
    null, null,
    "pill/tag badges",
    "horizontal scrolling ticker",
    "grouped by category with headers",
    "progress bars with percentages",
    "icon grid with labels",
    "word cloud / varied font sizes",
    "compact comma-separated inline list",
    "radial / radar chart (CSS only)",
    "timeline of skills acquired",
  ],

  // ─── CONTACT SECTION ──────────────────────────────────────────────────────

  // Contact section personality — null means AI decides
  contact_style: [
    null, null,
    "simple centered links",
    "big bold email as hero text",
    "card-based contact options",
    "terminal/command-line style",
    "social icons in a row",
    "split layout — message on left, links on right",
    "playful — with a friendly CTA headline",
    "map-themed — as if marking your location",
  ],

  // ─── SECTION DIVIDERS ─────────────────────────────────────────────────────

  // How sections are separated — null means AI decides
  section_divider: [
    null, null, null,
    "none — just whitespace/padding",
    "thin horizontal line",
    "thick decorative horizontal rule",
    "wave / curved SVG divider",
    "diagonal / slanted edge",
    "alternating background colors",
    "dotted or dashed line",
    "gradient fade between sections",
    "zigzag / triangular edge",
  ],

  // ─── FOOTER ───────────────────────────────────────────────────────────────

  // Footer vibe — null means AI decides
  footer_style: [
    null, null,
    "minimal one-liner",
    "dark contrasting background footer",
    "same as page — seamless ending",
    "footer with small sitemap/links",
    "playful — with an emoji or easter egg",
    "brutalist — raw, stark, bold",
    "sticky / always visible micro-footer",
  ],

  // ─── PAGE-WIDE EFFECTS ────────────────────────────────────────────────────

  // Overall border-radius preference — null means AI decides
  border_radius: [
    null, null, null,
    "none — sharp 0px corners everywhere",
    "subtle — 4-6px, slightly rounded",
    "moderate — 8-12px, friendly rounded",
    "heavy — 16-24px, very rounded / bubbly",
    "pill — fully rounded on small elements",
    "mixed — sharp sections with rounded cards",
  ],

  // Image treatment for portrait and any visuals — null means AI decides
  image_treatment: [
    null, null,
    "circle crop",
    "rounded rectangle",
    "hexagonal clip-path",
    "diamond rotated square",
    "blob/organic shape clip-path",
    "polaroid frame with shadow",
    "duotone color filter",
    "grayscale with color on hover",
    "dotted/pixelated halftone effect (CSS filter)",
    "thick colored border frame",
    "no clip — square with heavy shadow",
  ],

  // Spacing / density — null means AI decides
  spacing_density: [
    null, null,
    "tight — compact, lots of content visible",
    "normal — balanced padding and margins",
    "airy — generous whitespace, breathing room",
    "ultra-spacious — luxury feel, huge gaps between sections",
  ],

  // Dark mode or light mode — null means AI decides
  color_scheme: [
    null, null,
    "dark mode",
    "light mode",
    "dark mode with vibrant accents",
    "light mode with dark hero section",
    "mixed — alternating dark and light sections",
  ],

  // ─── SPECIAL & QUIRKS ────────────────────────────────────────────────────

  // Special one-off constraint to make each day truly unique
  quirk: [
    null, null, null, null, null, // usually no quirk (weighted)
    "hero text must be extremely large, almost full viewport width",
    "every section uses a different background color",
    "navigation is vertical on the left side, not top",
    "include a visible CSS-only geometric art element",
    "all section headings are uppercase and letter-spaced",
    "use only two accent colors total throughout the entire page",
    "hero takes 100vh with centered huge typography",
    "project cards are arranged in a diagonal / staggered grid",
    "contact section looks like a terminal / command line",
    "use a prominent horizontal rule / divider design motif",
    "bio section is styled like a magazine pull-quote",
    "skills are shown as a visual tag cloud, not a list",
    "entire page has a subtle paper/grain texture overlay",
    "section titles are rotated vertically along the left edge",
    "use a single accent color — everything else is grayscale",
    "add a subtle CSS grid/dot pattern visible on the background",
    "project cards flip on hover to reveal description on the back",
    "headings use a gradient text color effect",
    "include a decorative large quotation mark near the bio",
    "nav links have an animated underline effect on hover",
    "the entire page has a max-width of 900px, ultra-focused",
    "use a prominent number/counter design element for sections (01, 02, 03...)",
  ],

  // Rare second quirk for extra spicy days
  bonus_quirk: [
    null, null, null, null, null, null, null, null, null, // very rarely triggers
    "all external links open with a subtle tooltip preview",
    "add a tiny animated element somewhere (spinning gear, blinking cursor, floating shape)",
    "include a CSS-only dark/light mode toggle switch",
    "the daily regen banner is styled as a handwritten note",
    "add a subtle scanline/CRT effect over the hero section",
    "footer includes a tiny randomly chosen emoji that changes daily",
    "one section has an inverted color scheme compared to the rest",
  ],
};

// ─── Picker ─────────────────────────────────────────────────────────────────

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickParams() {
  const creativity = PARAMS.creativity();

  const params = {
    // core
    use_portrait:     pickRandom(PARAMS.use_portrait),
    creativity,
    theme:            pickRandom(PARAMS.theme),
    text_tone:        pickRandom(PARAMS.text_tone),
    layout:           pickRandom(PARAMS.layout),
    color_mood:       pickRandom(PARAMS.color_mood),
    typography:       pickRandom(PARAMS.typography),
    decoration:       pickRandom(PARAMS.decoration),

    // hero
    hero_layout:      pickRandom(PARAMS.hero_layout),
    hero_headline_scale: pickRandom(PARAMS.hero_headline_scale),
    hero_background:  pickRandom(PARAMS.hero_background),
    hero_cta_style:   pickRandom(PARAMS.hero_cta_style),
    hero_height:      pickRandom(PARAMS.hero_height),

    // navigation
    nav_style:        pickRandom(PARAMS.nav_style),

    // project cards
    card_style:       pickRandom(PARAMS.card_style),

    // animation & interaction
    scroll_animation: pickRandom(PARAMS.scroll_animation),
    hover_effects:    pickRandom(PARAMS.hover_effects),
    cursor_effect:    pickRandom(PARAMS.cursor_effect),

    // sections
    skills_display:   pickRandom(PARAMS.skills_display),
    contact_style:    pickRandom(PARAMS.contact_style),
    section_divider:  pickRandom(PARAMS.section_divider),
    footer_style:     pickRandom(PARAMS.footer_style),

    // page-wide
    border_radius:    pickRandom(PARAMS.border_radius),
    image_treatment:  pickRandom(PARAMS.image_treatment),
    spacing_density:  pickRandom(PARAMS.spacing_density),
    color_scheme:     pickRandom(PARAMS.color_scheme),

    // quirks
    quirk:            pickRandom(PARAMS.quirk),
    bonus_quirk:      pickRandom(PARAMS.bonus_quirk),
  };

  return params;
}

// ─── Describe params as human-readable text for the AI prompt ────────────────

function describeParams(params) {
  const lines = [];

  // Core
  lines.push(`Creativity level: ${params.creativity}/100 — ${creativityLabel(params.creativity)}`);

  lines.push(params.theme
    ? `Visual theme: ${params.theme}`
    : `Visual theme: your choice — surprise us`);

  lines.push(params.text_tone
    ? `Text tone/voice: ${params.text_tone}`
    : `Text tone: your choice`);

  lines.push(params.layout
    ? `Layout approach: ${params.layout}`
    : `Layout: your choice`);

  lines.push(params.color_mood
    ? `Color mood: ${params.color_mood}`
    : `Color mood: your choice`);

  lines.push(params.typography
    ? `Typography: ${params.typography}`
    : `Typography: your choice`);

  lines.push(`Decoration level: ${params.decoration}`);

  lines.push(params.color_scheme
    ? `Color scheme: ${params.color_scheme}`
    : `Color scheme: your choice (dark or light)`);

  // Hero section
  lines.push("");
  lines.push("── HERO SECTION ──");

  lines.push(params.hero_layout
    ? `Hero layout: ${params.hero_layout}`
    : `Hero layout: your choice`);

  lines.push(params.hero_headline_scale
    ? `Hero headline scale: ${params.hero_headline_scale}`
    : `Hero headline scale: your choice`);

  lines.push(params.hero_background
    ? `Hero background: ${params.hero_background}`
    : `Hero background: your choice`);

  lines.push(params.hero_cta_style
    ? `Hero CTA buttons: ${params.hero_cta_style}`
    : `Hero CTA buttons: your choice`);

  lines.push(params.hero_height
    ? `Hero height: ${params.hero_height}`
    : `Hero height: your choice`);

  // Navigation
  lines.push("");
  lines.push("── NAVIGATION ──");

  lines.push(params.nav_style
    ? `Nav style: ${params.nav_style}`
    : `Nav style: your choice`);

  // Cards
  lines.push("");
  lines.push("── PROJECT CARDS ──");

  lines.push(params.card_style
    ? `Card style: ${params.card_style}`
    : `Card style: your choice`);

  // Interaction
  lines.push("");
  lines.push("── ANIMATION & INTERACTION ──");

  lines.push(params.scroll_animation
    ? `Scroll animation: ${params.scroll_animation}`
    : `Scroll animation: your choice (keep it lightweight)`);

  lines.push(params.hover_effects
    ? `Hover effects: ${params.hover_effects}`
    : `Hover effects: your choice`);

  if (params.cursor_effect)
    lines.push(`Cursor effect: ${params.cursor_effect}`);

  // Section details
  lines.push("");
  lines.push("── SECTION DETAILS ──");

  lines.push(params.skills_display
    ? `Skills display: ${params.skills_display}`
    : `Skills display: your choice`);

  lines.push(params.contact_style
    ? `Contact section: ${params.contact_style}`
    : `Contact section: your choice`);

  lines.push(params.section_divider
    ? `Section dividers: ${params.section_divider}`
    : `Section dividers: your choice`);

  lines.push(params.footer_style
    ? `Footer style: ${params.footer_style}`
    : `Footer style: your choice`);

  // Page-wide design
  lines.push("");
  lines.push("── PAGE-WIDE DESIGN ──");

  lines.push(params.border_radius
    ? `Border radius: ${params.border_radius}`
    : `Border radius: your choice`);

  lines.push(params.image_treatment
    ? `Image/portrait treatment: ${params.image_treatment}`
    : `Image/portrait treatment: your choice`);

  lines.push(params.spacing_density
    ? `Spacing density: ${params.spacing_density}`
    : `Spacing: your choice`);

  // Portrait
  lines.push("");
  lines.push(`Use portrait photo: ${params.use_portrait ? "yes" : "no — use styled initials placeholder instead"}`);

  // Quirks
  if (params.quirk)
    lines.push(`\nSpecial constraint: ${params.quirk}`);

  if (params.bonus_quirk)
    lines.push(`Bonus constraint: ${params.bonus_quirk}`);

  return lines.join("\n");
}

function creativityLabel(n) {
  if (n <= 10)  return "strictly professional, clean corporate look";
  if (n <= 30)  return "polished and professional with subtle personality";
  if (n <= 50)  return "balanced — professional but with clear creative flair";
  if (n <= 70)  return "bold and expressive, clearly creative";
  if (n <= 85)  return "very experimental, unconventional layout and style";
  if (n <= 95)  return "wild and artistic, push the boundaries";
  return "absolute chaos — make it unforgettable, no rules";
}

module.exports = { pickParams, describeParams, PARAMS };
