const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(value.trim());
}

function expandShorthandHex(hex: string): string {
  if (hex.length !== 4) return hex;
  const [, r, g, b] = hex;
  return `#${r}${r}${g}${g}${b}${b}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = expandShorthandHex(hex.trim());
  if (!isHexColor(normalized)) {
    throw new Error(`hexToRgb: "${hex}" is not a valid hex color`);
  }
  const value = normalized.slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

/** Mixes `hex` towards white (`amount` > 0) or black (`amount` < 0). Amount is clamped to [-1, 1]. */
export function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const t = Math.max(-1, Math.min(1, amount));
  const target = t >= 0 ? 255 : 0;
  const factor = Math.abs(t);
  const mix = (channel: number) => Math.round(channel + (target - channel) * factor);
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}
