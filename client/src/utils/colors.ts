export const USER_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export function getRandomColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

export function getRandomName(): string {
  const adjectives = [
    'Cosmic', 'Quantum', 'Nebula', 'Hyper', 'Sonic',
    'Aero', 'Cyber', 'Voxel', 'Matrix', 'Zenith',
    'Nova', 'Stellar', 'Prism', 'Apex', 'Flux'
  ];
  const nouns = [
    'Architect', 'Designer', 'Creator', 'Builder', 'Modeler',
    'Sculptor', 'Engineer', 'Artist', 'Voyager', 'Pilot',
    'Explorer', 'Crafter', 'Mapper', 'Weaver', 'Synth'
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

export function hexToRgba(hex: string, alpha = 1): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}
