export type PosterType =
  | "Event"
  | "Business"
  | "Movie"
  | "Music"
  | "Sports"
  | "Sale"
  | "Birthday"
  | "Wedding"
  | "Conference"
  | "Fitness"
  | "Real Estate"
  | "Education"
  | "Food"
  | "Motivational"
  | "Gaming"
  | "Custom";

export type PosterStyle =
  | "Cinematic"
  | "Minimal"
  | "Modern"
  | "Anime"
  | "Realistic"
  | "Cyberpunk"
  | "Vintage"
  | "Bold Typography"
  | "Elegant";

export type ColorMood =
  | "Vibrant"
  | "Dark"
  | "Pastel"
  | "Monochrome"
  | "Neon"
  | "Earthy";

export type Orientation = "Portrait" | "Square" | "Landscape";

export const POSTER_TYPES: PosterType[] = [
  "Event", "Business", "Movie", "Music", "Sports", "Sale", "Birthday",
  "Wedding", "Conference", "Fitness", "Real Estate", "Education",
  "Food", "Motivational", "Gaming", "Custom",
];

export const STYLES: PosterStyle[] = [
  "Cinematic", "Minimal", "Modern", "Anime", "Realistic",
  "Cyberpunk", "Vintage", "Bold Typography", "Elegant",
];

export const COLOR_MOODS: ColorMood[] = [
  "Vibrant", "Dark", "Pastel", "Monochrome", "Neon", "Earthy",
];

export const ORIENTATIONS: Orientation[] = ["Portrait", "Square", "Landscape"];

const STYLE_MODIFIERS: Record<PosterStyle, string> = {
  Cinematic: "cinematic composition, dramatic film lighting, shallow depth of field, color graded",
  Minimal: "minimalist layout, generous negative space, refined geometry, subtle palette",
  Modern: "modern editorial design, crisp grid, contemporary typography, clean shapes",
  Anime: "high-detail anime key visual, vibrant cel-shaded illustration, expressive lighting",
  Realistic: "hyper realistic photography, 85mm lens, natural lighting, sharp micro details",
  Cyberpunk: "neon-soaked cyberpunk aesthetic, holographic accents, magenta and cyan rim lighting",
  Vintage: "vintage retro poster, halftone textures, warm faded palette, classic print look",
  "Bold Typography": "typography-driven poster, oversized confident headline, strong hierarchy",
  Elegant: "elegant editorial design, refined serif typography, luxurious feel, balanced layout",
};

const MOOD_MODIFIERS: Record<ColorMood, string> = {
  Vibrant: "vibrant saturated color palette",
  Dark: "dark moody palette with deep shadows and a single bright accent",
  Pastel: "soft pastel palette, airy and gentle",
  Monochrome: "monochrome black-and-white palette with one accent color",
  Neon: "neon palette of magenta, cyan and electric purple",
  Earthy: "earthy palette of warm browns, terracotta, sage and cream",
};

const TYPE_HINTS: Record<PosterType, string> = {
  Event: "event announcement poster",
  Business: "business promotional poster, professional brand feel",
  Movie: "movie poster, cinematic key art with hero subject",
  Music: "music concert poster, energetic and rhythmic composition",
  Sports: "sports poster, dynamic action and motion",
  Sale: "sale promo poster, bold offer, eye-catching pricing",
  Birthday: "birthday party poster, festive and joyful",
  Wedding: "wedding invitation poster, romantic and elegant",
  Conference: "conference / summit poster, professional and modern",
  Fitness: "gym / fitness poster, powerful and motivating",
  "Real Estate": "real estate poster, aspirational property feel",
  Education: "education / course poster, clear and welcoming",
  Food: "food / restaurant poster, appetizing and warm",
  Motivational: "motivational quote poster, inspiring composition",
  Gaming: "gaming key art poster, epic and high-energy",
  Custom: "creative poster",
};

export type PosterFields = {
  type: PosterType;
  title: string;
  subtitle?: string;
  dateTime?: string;
  location?: string;
  cta?: string;
  details?: string;
  style: PosterStyle;
  mood: ColorMood;
  orientation: Orientation;
};

export function orientationToSize(o: Orientation): string {
  if (o === "Portrait") return "1024x1536";
  if (o === "Landscape") return "1536x1024";
  return "1024x1024";
}

function aspectWords(o: Orientation): string {
  if (o === "Portrait") return "vertical portrait poster (2:3 ratio)";
  if (o === "Landscape") return "horizontal landscape poster (3:2 ratio)";
  return "square poster (1:1 ratio)";
}

export function buildPosterPrompt(f: PosterFields): string {
  const title = f.title.trim();
  const sub = f.subtitle?.trim();
  const dt = f.dateTime?.trim();
  const loc = f.location?.trim();
  const cta = f.cta?.trim();
  const details = f.details?.trim();

  const textLines: string[] = [];
  if (title) textLines.push(`Main headline: "${title}"`);
  if (sub) textLines.push(`Subtitle: "${sub}"`);
  if (dt) textLines.push(`Date / time: "${dt}"`);
  if (loc) textLines.push(`Location: "${loc}"`);
  if (cta) textLines.push(`Call to action: "${cta}"`);
  if (details) textLines.push(`Additional details: ${details}`);

  const text =
    textLines.length > 0
      ? `Render the following text legibly on the poster with clean professional typography and strong visual hierarchy (largest = headline, then subtitle, then supporting info):\n- ${textLines.join("\n- ")}`
      : "No text on the poster — purely visual.";

  return [
    `Design a ${aspectWords(f.orientation)} — a ${TYPE_HINTS[f.type]}.`,
    text,
    `Visual style: ${STYLE_MODIFIERS[f.style]}.`,
    `Color mood: ${MOOD_MODIFIERS[f.mood]}.`,
    "Composition: balanced, print-ready, clear focal point, generous margins so text never touches the edges.",
    "Quality: ultra detailed, 4K, sharp legible text with correct spelling, professional poster layout, award-winning graphic design.",
  ].join(" ");
}

export type PosterTemplate = {
  label: string;
  fields: Partial<PosterFields> & Pick<PosterFields, "type" | "title">;
};

export const TEMPLATES: PosterTemplate[] = [
  {
    label: "Birthday Party",
    fields: {
      type: "Birthday",
      title: "Happy 21st Birthday",
      subtitle: "Sara's Big Night",
      dateTime: "Sat, July 20 · 8 PM",
      location: "Skyline Lounge, Mumbai",
      cta: "RSVP Now",
      style: "Modern",
      mood: "Vibrant",
      orientation: "Portrait",
    },
  },
  {
    label: "Black Friday Sale",
    fields: {
      type: "Sale",
      title: "BLACK FRIDAY",
      subtitle: "Up to 70% OFF Everything",
      dateTime: "Nov 28 — Dec 1",
      cta: "Shop Now",
      style: "Bold Typography",
      mood: "Dark",
      orientation: "Portrait",
    },
  },
  {
    label: "Tech Conference",
    fields: {
      type: "Conference",
      title: "FutureStack 2026",
      subtitle: "AI, Cloud & Beyond",
      dateTime: "March 14–16, 2026",
      location: "Bengaluru ICC",
      cta: "Register",
      style: "Modern",
      mood: "Neon",
      orientation: "Portrait",
    },
  },
  {
    label: "Live Concert",
    fields: {
      type: "Music",
      title: "NIGHT WAVE LIVE",
      subtitle: "Featuring The Echoes",
      dateTime: "Fri, Aug 9 · 9 PM",
      location: "Phoenix Arena",
      cta: "Get Tickets",
      style: "Cinematic",
      mood: "Neon",
      orientation: "Portrait",
    },
  },
  {
    label: "Gym Promo",
    fields: {
      type: "Fitness",
      title: "BUILD THE BEAST",
      subtitle: "New Year Membership",
      cta: "Join Today",
      details: "First month free with annual plan",
      style: "Bold Typography",
      mood: "Dark",
      orientation: "Portrait",
    },
  },
  {
    label: "Restaurant Menu",
    fields: {
      type: "Food",
      title: "Tuscan Nights",
      subtitle: "Authentic Italian Specials",
      details: "Truffle pasta, wood-fired pizza, tiramisu",
      cta: "Reserve a Table",
      style: "Elegant",
      mood: "Earthy",
      orientation: "Portrait",
    },
  },
  {
    label: "Movie Poster",
    fields: {
      type: "Movie",
      title: "SHADOW PROTOCOL",
      subtitle: "The hunt begins.",
      dateTime: "In Theaters Dec 25",
      style: "Cinematic",
      mood: "Dark",
      orientation: "Portrait",
    },
  },
  {
    label: "Real Estate",
    fields: {
      type: "Real Estate",
      title: "Luxury 3BHK Apartments",
      subtitle: "Now Selling in South Delhi",
      cta: "Book a Visit",
      details: "Starting ₹2.4 Cr · Possession 2027",
      style: "Elegant",
      mood: "Earthy",
      orientation: "Portrait",
    },
  },
];

export function suggestImprovements(f: PosterFields): string[] {
  const tips: string[] = [];
  if (!f.title.trim()) tips.push("Add a strong main headline — it's the biggest element.");
  else if (f.title.length > 40) tips.push("Shorten the headline (<40 chars) so it stays bold and readable.");
  if (!f.subtitle?.trim()) tips.push("Add a short subtitle to give context under the headline.");
  if ((f.type === "Event" || f.type === "Music" || f.type === "Conference" || f.type === "Sale") && !f.dateTime?.trim())
    tips.push("Add a date/time — essential for this poster type.");
  if ((f.type === "Event" || f.type === "Wedding" || f.type === "Real Estate") && !f.location?.trim())
    tips.push("Add a location/venue so people know where to go.");
  if (!f.cta?.trim()) tips.push("Add a call-to-action (e.g. 'Book Now', 'Register').");
  return tips.slice(0, 3);
}
