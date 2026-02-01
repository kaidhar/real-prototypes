#!/usr/bin/env node

/**
 * Project Structure Handler
 *
 * Handles project root detection, monorepo support, and path resolution
 * to prevent working directory confusion and file path issues.
 *
 * Features:
 * - Project root detection (finds package.json)
 * - Monorepo support (lerna, nx, turborepo, pnpm workspaces)
 * - Absolute path resolution
 * - File existence verification
 * - Path utilities for consistent file operations
 *
 * Usage:
 *   const { ProjectStructure } = require('./project-structure');
 *   const ps = new ProjectStructure('/path/to/project');
 *   ps.resolve('src/components/Button.tsx');
 */

const fs = require('fs');
const path = require('path');

// Monorepo configuration files
const MONOREPO_MARKERS = {
  lerna: 'lerna.json',
  nx: 'nx.json',
  turborepo: 'turbo.json',
  pnpm: 'pnpm-workspace.yaml',
  yarn: 'yarn.lock', // Check for workspaces in package.json
  rush: 'rush.json'
};

// Common project structure patterns
const PROJECT_PATTERNS = {
  nextjs: {
    markers: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
    srcDirs: ['src', 'app', 'pages'],
    configFiles: ['next.config.js', 'next.config.mjs', 'next.config.ts']
  },
  react: {
    markers: ['package.json'],
    srcDirs: ['src'],
    configFiles: ['vite.config.js', 'vite.config.ts', 'webpack.config.js']
  },
  vue: {
    markers: ['vue.config.js', 'vite.config.js'],
    srcDirs: ['src'],
    configFiles: ['vue.config.js', 'vite.config.js']
  }
};

class ProjectStructure {
  constructor(startPath = process.cwd()) {
    this.startPath = path.resolve(startPath);
    this.projectRoot = null;
    this.srcRoot = null;
    this.packageJson = null;
    this.isMonorepo = false;
    this.monorepoType = null;
    this.workspaces = [];

    this.detect();
  }

  /**
   * Detect project structure
   */
  detect() {
    this.findProjectRoot();
    this.detectMonorepo();
    this.findSrcRoot();
    return this;
  }

  /**
   * Find project root by looking for package.json
   */
  findProjectRoot() {
    let currentDir = this.startPath;
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      const pkgPath = path.join(currentDir, 'package.json');

      if (fs.existsSync(pkgPath)) {
        try {
          this.packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          this.projectRoot = currentDir;
          return currentDir;
        } catch (e) {
          // Continue searching
        }
      }

      currentDir = path.dirname(currentDir);
    }

    // If no package.json found, use start path
    this.projectRoot = this.startPath;
    return this.startPath;
  }

  /**
   * Detect if project is part of a monorepo
   */
  detectMonorepo() {
    if (!this.projectRoot) return;

    // Check for monorepo markers going up from project root
    let currentDir = this.projectRoot;
    const root = path.parse(currentDir).root;
    let levelsUp = 0;
    const maxLevels = 5;

    while (currentDir !== root && levelsUp < maxLevels) {
      for (const [type, marker] of Object.entries(MONOREPO_MARKERS)) {
        const markerPath = path.join(currentDir, marker);

        if (fs.existsSync(markerPath)) {
          this.isMonorepo = true;
          this.monorepoType = type;
          this.monorepoRoot = currentDir;

          // Try to find workspaces
          this.detectWorkspaces(currentDir, type);
          return;
        }
      }

      // Also check for yarn/npm workspaces in package.json
      const pkgPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          if (pkg.workspaces) {
            this.isMonorepo = true;
            this.monorepoType = 'npm/yarn-workspaces';
            this.monorepoRoot = currentDir;
            this.workspaces = Array.isArray(pkg.workspaces)
              ? pkg.workspaces
              : pkg.workspaces.packages || [];
            return;
          }
        } catch (e) {
          // Continue
        }
      }

      currentDir = path.dirname(currentDir);
      levelsUp++;
    }
  }

  /**
   * Detect workspace packages
   */
  detectWorkspaces(monorepoRoot, type) {
    switch (type) {
      case 'lerna':
        this.detectLernaWorkspaces(monorepoRoot);
        break;
      case 'pnpm':
        this.detectPnpmWorkspaces(monorepoRoot);
        break;
      case 'nx':
        this.detectNxWorkspaces(monorepoRoot);
        break;
      case 'turborepo':
        this.detectTurboWorkspaces(monorepoRoot);
        break;
    }
  }

  /**
   * Detect Lerna workspaces
   */
  detectLernaWorkspaces(monorepoRoot) {
    const lernaPath = path.join(monorepoRoot, 'lerna.json');
    try {
      const lerna = JSON.parse(fs.readFileSync(lernaPath, 'utf-8'));
      this.workspaces = lerna.packages || ['packages/*'];
    } catch (e) {
      this.workspaces = ['packages/*'];
    }
  }

  /**
   * Detect pnpm workspaces
   */
  detectPnpmWorkspaces(monorepoRoot) {
    const pnpmPath = path.join(monorepoRoot, 'pnpm-workspace.yaml');
    try {
      const content = fs.readFileSync(pnpmPath, 'utf-8');
      // Simple YAML parsing for packages array
      const match = content.match(/packages:\s*\n((?:\s+-\s+.+\n?)+)/);
      if (match) {
        this.workspaces = match[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^\s*-\s*['"]?/, '').replace(/['"]?\s*$/, ''));
      }
    } catch (e) {
      this.workspaces = ['packages/*'];
    }
  }

  /**
   * Detect Nx workspaces
   */
  detectNxWorkspaces(monorepoRoot) {
    // Nx uses apps/ and libs/ by default
    this.workspaces = ['apps/*', 'libs/*', 'packages/*'];
  }

  /**
   * Detect Turborepo workspaces
   */
  detectTurboWorkspaces(monorepoRoot) {
    // Turborepo reads from package.json workspaces
    const pkgPath = path.join(monorepoRoot, 'package.json');
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      this.workspaces = pkg.workspaces || ['packages/*', 'apps/*'];
    } catch (e) {
      this.workspaces = ['packages/*', 'apps/*'];
    }
  }

  /**
   * Find source root directory
   */
  findSrcRoot() {
    if (!this.projectRoot) return;

    const candidates = ['src', 'app', 'lib', 'source'];

    for (const candidate of candidates) {
      const candidatePath = path.join(this.projectRoot, candidate);
      if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
        this.srcRoot = candidatePath;
        return candidatePath;
      }
    }

    // Default to project root
    this.srcRoot = this.projectRoot;
    return this.projectRoot;
  }

  /**
   * Resolve a path relative to project root (always returns absolute path)
   */
  resolve(...pathSegments) {
    const relativePath = path.join(...pathSegments);

    // If already absolute, return as-is
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }

    return path.join(this.projectRoot, relativePath);
  }

  /**
   * Resolve a path relative to src root
   */
  resolveSrc(...pathSegments) {
    const relativePath = path.join(...pathSegments);

    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }

    return path.join(this.srcRoot, relativePath);
  }

  /**
   * Check if a file exists
   */
  exists(filePath) {
    const absolutePath = this.resolve(filePath);
    return fs.existsSync(absolutePath);
  }

  /**
   * Verify a file exists after creation
   */
  verify(filePath) {
    const absolutePath = this.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File verification failed: ${absolutePath} does not exist`);
    }

    const stats = fs.statSync(absolutePath);
    return {
      exists: true,
      path: absolutePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }

  /**
   * Create directory if it doesn't exist
   */
  ensureDir(dirPath) {
    const absolutePath = this.resolve(dirPath);

    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true });
    }

    return absolutePath;
  }

  /**
   * Write file with verification
   */
  writeFile(filePath, content) {
    const absolutePath = this.resolve(filePath);
    const dirPath = path.dirname(absolutePath);

    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write file
    fs.writeFileSync(absolutePath, content, 'utf-8');

    // Verify
    return this.verify(filePath);
  }

  /**
   * Read file with absolute path handling
   */
  readFile(filePath) {
    const absolutePath = this.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    return fs.readFileSync(absolutePath, 'utf-8');
  }

  /**
   * Get relative path from project root
   */
  relative(absolutePath) {
    return path.relative(this.projectRoot, absolutePath);
  }

  /**
   * Get project info summary
   */
  getInfo() {
    return {
      projectRoot: this.projectRoot,
      srcRoot: this.srcRoot,
      isMonorepo: this.isMonorepo,
      monorepoType: this.monorepoType,
      monorepoRoot: this.monorepoRoot,
      workspaces: this.workspaces,
      packageName: this.packageJson?.name,
      packageVersion: this.packageJson?.version
    };
  }

  /**
   * Format info for CLI output
   */
  formatInfo() {
    const info = this.getInfo();
    const lines = [];

    lines.push('\x1b[1mProject Structure\x1b[0m');
    lines.push(`  Project Root: ${info.projectRoot}`);
    lines.push(`  Source Root: ${info.srcRoot}`);

    if (info.packageName) {
      lines.push(`  Package: ${info.packageName}@${info.packageVersion || 'unknown'}`);
    }

    if (info.isMonorepo) {
      lines.push(`\n\x1b[1mMonorepo Detected\x1b[0m`);
      lines.push(`  Type: ${info.monorepoType}`);
      lines.push(`  Root: ${info.monorepoRoot}`);
      lines.push(`  Workspaces: ${info.workspaces.join(', ')}`);
    }

    return lines.join('\n');
  }
}

/**
 * Create project structure instance for a path
 */
function createProjectStructure(startPath) {
  return new ProjectStructure(startPath);
}

/**
 * Find project root from any starting path
 */
function findProjectRoot(startPath) {
  const ps = new ProjectStructure(startPath);
  return ps.projectRoot;
}

/**
 * Check if path is within a monorepo
 */
function isInMonorepo(startPath) {
  const ps = new ProjectStructure(startPath);
  return ps.isMonorepo;
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  let startPath = process.cwd();

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--path' || args[i] === '-p') {
      startPath = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: node project-structure.js [options]

Options:
  --path, -p <path>  Starting path to analyze
  --help, -h         Show this help

Examples:
  node project-structure.js
  node project-structure.js --path ./projects/my-app/prototype
      `);
      process.exit(0);
    }
  }

  const ps = new ProjectStructure(startPath);
  console.log(ps.formatInfo());
}

module.exports = {
  ProjectStructure,
  createProjectStructure,
  findProjectRoot,
  isInMonorepo
};
