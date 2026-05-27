export type PosterStyle = "Cinematic" | "Anime" | "Realistic" | "Cyberpunk";

const STYLE_MODIFIERS: Record<PosterStyle, string> = {
  Cinematic:
    "cinematic composition, dramatic film lighting, anamorphic lens flare, shallow depth of field, color graded teal and orange, IMAX poster framing",
  Anime:
    "high-detail anime key visual, vibrant cel-shaded illustration, dynamic action pose, studio-quality line art, expressive lighting, Makoto Shinkai inspired sky",
  Realistic:
    "hyper realistic photography, 85mm lens, natural global illumination, true-to-life skin texture, sharp micro details, photojournalism quality",
  Cyberpunk:
    "neon-soaked cyberpunk megacity, holographic signage, chromatic aberration, rain-slick streets, magenta and cyan rim lighting, blade runner atmosphere",
};

const BASE_TAGS =
  "ultra detailed, 4K, 8K resolution, intricate details, volumetric lighting, ray tracing, depth of field, epic atmosphere, professional poster design, trending on ArtStation, award winning concept art";

export function enhancePrompt(userPrompt: string, style: PosterStyle): string {
  const trimmed = userPrompt.trim().replace(/\s+/g, " ");
  const styleTag = STYLE_MODIFIERS[style];
  return `${trimmed}. Style: ${styleTag}. ${BASE_TAGS}. Composition: bold focal subject, dramatic background, cinematic title-poster framing suitable for YouTube thumbnail and gaming key art.`;
}

export const EXAMPLE_PROMPTS: { label: string; prompt: string; style: PosterStyle }[] = [
  {
    label: "Roblox warrior squad",
    prompt: "Roblox blocky warriors charging through a fiery battlefield with glowing swords",
    style: "Cinematic",
  },
  {
    label: "Fortnite victory drop",
    prompt: "Fortnite-style hero skydiving into a neon island at sunset, battle bus in the sky",
    style: "Cinematic",
  },
  {
    label: "Cyberpunk samurai",
    prompt: "Cyberpunk samurai with glowing katana standing on a Tokyo rooftop in heavy rain",
    style: "Cyberpunk",
  },
  {
    label: "Anime action duel",
    prompt: "Two anime fighters clashing energy blasts mid-air, sparks and shockwaves everywhere",
    style: "Anime",
  },
  {
    label: "Valorant agent splash",
    prompt: "Hooded futuristic agent aiming a glowing pistol, smoke and sparks, esports key art",
    style: "Realistic",
  },
  {
    label: "Mech vs dragon",
    prompt: "Giant mech battling a dragon over a burning futuristic city, lightning storm",
    style: "Cinematic",
  },
];

export function suggestImprovements(prompt: string): string[] {
  const p = prompt.toLowerCase();
  const tips: string[] = [];
  if (prompt.trim().length > 0 && prompt.trim().length < 25)
    tips.push("Add more detail — describe the subject, setting, and mood.");
  if (!/(light|lighting|sun|neon|glow|rim)/.test(p))
    tips.push("Mention lighting (neon glow, rim light, sunset, volumetric).");
  if (!/(color|red|blue|gold|teal|magenta|purple|orange)/.test(p))
    tips.push("Specify a color palette (teal & orange, magenta & cyan).");
  if (!/(angle|close-up|wide|low angle|shot|view)/.test(p))
    tips.push("Add a camera angle (low angle, close-up, wide shot).");
  if (!/(action|pose|standing|running|jumping|holding|wielding)/.test(p))
    tips.push("Describe an action or pose to make it dynamic.");
  return tips.slice(0, 3);
}
