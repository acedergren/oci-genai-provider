import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PackageJson {
  name: string;
  version: string;
  description: string;
  license: string;
  author: string;
  types: string;
  exports: Record<string, unknown>;
  repository: {
    type: string;
    url: string;
    directory?: string;
  };
  publishConfig: {
    access: string;
    registry: string;
  };
}

describe('Package validation', () => {
  const packagesDir = path.join(__dirname, '../packages');
  const packages = ['oci-genai-provider', 'opencode-integration'];

  packages.forEach((pkg) => {
    describe(`@acedergren/${pkg}`, () => {
      const pkgPath = path.join(packagesDir, pkg);
      const pkgJsonPath = path.join(pkgPath, 'package.json');
      const pkgJson: PackageJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8')) as PackageJson;

      it('should have correct package name', () => {
        expect(pkgJson.name).toMatch(/^@acedergren\//);
      });

      it('should have required metadata', () => {
        expect(pkgJson.version).toBeDefined();
        expect(pkgJson.description).toBeDefined();
        expect(pkgJson.license).toBe('MIT');
        expect(pkgJson.author).toBeDefined();
      });

      it('should have repository information', () => {
        expect(pkgJson.repository).toBeDefined();
        expect(pkgJson.repository.type).toBe('git');
        expect(pkgJson.repository.url).toContain('github.com');
      });

      it('should have publishConfig for GitHub Packages', () => {
        expect(pkgJson.publishConfig).toBeDefined();
        expect(pkgJson.publishConfig.registry).toBe('https://npm.pkg.github.com');
      });

      it('should have exports field', () => {
        expect(pkgJson.exports).toBeDefined();
      });

      it('should have types field', () => {
        expect(pkgJson.types).toBeDefined();
      });

      it('should include required files', () => {
        const readmePath = path.join(pkgPath, 'README.md');
        expect(fs.existsSync(readmePath)).toBe(true);
      });
    });
  });
});
