/**
 * Centralized icon registry. The approved prototype renders icons as plain
 * Unicode/emoji glyphs (📅 ⬆ ◫ ✓ 🔔 ✕ ⚠ ◷ …), not an SVG icon library —
 * so this module keeps that exact approach, just named and centralized
 * instead of literal strings scattered across components.
 */
export const Icon = {
  bell: '🔔',
  undo: '↩',
  redo: '↪',
  upload: '⤒',
  check: '✓',
  error: '✕',
  warning: '⚠',
  clock: '◷',
  calendar: '📅',
  chevronDown: '▾',
  close: '✕',
  more: '⋯',
  shield: '🛡',
  flask: '⚗',
  arrowRight: '→',
  menu: '☰',
} as const;

export type IconName = keyof typeof Icon;
