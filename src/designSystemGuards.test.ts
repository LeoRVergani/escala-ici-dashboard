import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC_DIR = join(process.cwd(), 'src');

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const SOURCE_FILES = walk(SRC_DIR).filter((file) => !/\.test\.tsx?$/.test(file));

// The exact glyphs `src/design-system/icons.ts` used to export before checkpoint 1C —
// every one of these was migrated to a real lucide-react icon via AppIcon.
const FORBIDDEN_ICON_GLYPHS = [
  '🔔',
  '↩',
  '↪',
  '⤒',
  '✓',
  '✕',
  '⚠',
  '◷',
  '📅',
  '▾',
  '⋯',
  '🛡',
  '⚗',
  '☰',
  '🏢',
  '⇄',
  '⚙',
  '∅',
  '🔍',
];

// Emoji block used by pictographic glyphs (bell, calendar, shield, building, magnifier, …).
const EMOJI_BLOCK = /[\u{1F300}-\u{1FAFF}]/u;

describe('Design system guard rails (checkpoint 1C — ícones únicos e neutros)', () => {
  it('no source file imports lucide-react directly except AppIcon.tsx itself', () => {
    const offenders = SOURCE_FILES.filter((file) => {
      if (file.endsWith('AppIcon.tsx')) return false;
      return /from ['"]lucide-react['"]/.test(readFileSync(file, 'utf8'));
    });
    expect(offenders).toEqual([]);
  });

  it('no source file contains a legacy emoji/glyph icon character', () => {
    const offenders: string[] = [];
    for (const file of SOURCE_FILES) {
      const content = readFileSync(file, 'utf8');
      const hit = FORBIDDEN_ICON_GLYPHS.find((glyph) => content.includes(glyph));
      if (hit) offenders.push(`${file} contains "${hit}"`);
    }
    expect(offenders).toEqual([]);
  });

  it('no source file contains a raw emoji-block pictograph (U+1F300–U+1FAFF)', () => {
    const offenders: string[] = [];
    for (const file of SOURCE_FILES) {
      const content = readFileSync(file, 'utf8');
      if (EMOJI_BLOCK.test(content)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it('the old emoji-based icon registry (src/design-system/icons.ts) was removed, not just emptied', () => {
    const stillExists = SOURCE_FILES.some((file) => file.endsWith(join('design-system', 'icons.ts')));
    expect(stillExists).toBe(false);
  });
});
