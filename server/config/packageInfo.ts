import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

const packageSchema = z.object({
  name: z.string(),
  version: z.string(),
});

export interface PackageInfo {
  name: string;
  version: string;
}

export function loadPackageInfo(rootDir = process.cwd()): PackageInfo {
  const raw = readFileSync(join(rootDir, 'package.json'), 'utf8');
  return packageSchema.parse(JSON.parse(raw));
}
