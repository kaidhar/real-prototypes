#!/usr/bin/env node

/**
 * Prototype Detection Module
 *
 * Detects existing prototypes in a project directory to prevent creating
 * new projects when one already exists. Also maps captured pages to
 * existing prototype files.
 *
 * Usage:
 *   node detect-prototype.js --project <name>
 *   node detect-prototype.js --path /path/to/project
 */

const fs = require('fs');
const path = require('path');

// Framework detection patterns
const FRAMEWORK_PATTERNS = {
  'next.js-app-router': {
    markers: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
    structure: ['app/', 'src/app/'],
    pagePattern: /page\.(tsx?|jsx?)$/,
    layoutPattern: /layout\.(tsx?|jsx?)$/
  },
  'next.js-pages-router': {
    markers: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
    structure: ['pages/', 'src/pages/'],
    pagePattern: /\.(tsx?|jsx?)$/
  },
  'react-vite': {
    markers: ['vite.config.js', 'vite.config.ts'],
    structure: ['src/'],
    pagePattern: /\.(tsx?|jsx?)$/
  },
  'react-cra': {
    markers: ['react-scripts'],
    structure: ['src/'],
    pagePattern: /\.(tsx?|jsx?)$/
  },
  'vue': {
    markers: ['vue.config.js', 'vite.config.js'],
    structure: ['src/'],
    pagePattern: /\.vue$/
  },
  'angular': {
    markers: ['angular.json'],
    structure: ['src/app/'],
    pagePattern: /\.component\.ts$/
  },
  'svelte': {
    markers: ['svelte.config.js'],
    structure: ['src/'],
    pagePattern: /\.svelte$/
  }
};

// Styling approach detection
const STYLING_PATTERNS = {
  'tailwind': {
    markers: ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs'],
    imports: ['tailwindcss', 'tailwind']
  },
  'css-modules': {
    patterns: [/\.module\.css$/, /\.module\.scss$/]
  },
  'styled-components': {
    imports: ['styled-components']
  },
  'emotion': {
    imports: ['@emotion/react', '@emotion/styled']
  },
  'sass': {
    markers: [],
    patterns: [/\.scss$/, /\.sass$/]
  },
  'inline-styles': {
    patterns: [/style\s*=\s*\{\{/]
  }
};

class PrototypeDetector {
  constructor(projectPath) {
    this.projectPath = path.resolve(projectPath);
    this.result = {
      exists: false,
      framework: null,
      frameworkVersion: null,
      styling: [],
      projectRoot: null,
      srcRoot: null,
      pages: [],
      components: [],
      mappedPages: {},
      packageJson: null
    };
  }

  /**
   * Run full detection
   */
  detect() {
    // Step 1: Find package.json
    this.findPackageJson();

    if (!this.result.exists) {
      return this.result;
    }

    // Step 2: Detect framework
    this.detectFramework();

    // Step 3: Find source root
    this.findSourceRoot();

    // Step 4: Detect styling approach
    this.detectStyling();

    // Step 5: Find existing pages
    this.findPages();

    // Step 6: Find existing components
    this.findComponents();

    return this.result;
  }

  /**
   * Find package.json in project directory
   */
  findPackageJson() {
    const possiblePaths = [
      path.join(this.projectPath, 'package.json'),
      path.join(this.projectPath, 'prototype', 'package.json'),
      path.join(this.projectPath, 'src', 'package.json')
    ];

    for (const pkgPath of possiblePaths) {
      if (fs.existsSync(pkgPath)) {
        try {
          this.result.packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          this.result.projectRoot = path.dirname(pkgPath);
          this.result.exists = true;
          return;
        } catch (e) {
          // Continue to next path
        }
      }
    }
  }

  /**
   * Detect framework from markers and dependencies
   */
  detectFramework() {
    if (!this.result.packageJson) return;

    const deps = {
      ...this.result.packageJson.dependencies,
      ...this.result.packageJson.devDependencies
    };

    // Check for Next.js
    if (deps['next']) {
      const version = deps['next'].replace(/[\^~]/, '');
      this.result.frameworkVersion = version;

      // Check if using App Router or Pages Router
      const appDir = this.checkDir('app') || this.checkDir('src/app');
      const pagesDir = this.checkDir('pages') || this.checkDir('src/pages');

      if (appDir) {
        this.result.framework = 'next.js-app-router';
      } else if (pagesDir) {
        this.result.framework = 'next.js-pages-router';
      } else {
        // Default to app router for Next.js 13+
        const majorVersion = parseInt(version.split('.')[0], 10);
        this.result.framework = majorVersion >= 13 ? 'next.js-app-router' : 'next.js-pages-router';
      }
      return;
    }

    // Check for Vite + React
    if (deps['vite'] && deps['react']) {
      this.result.framework = 'react-vite';
      this.result.frameworkVersion = deps['vite'].replace(/[\^~]/, '');
      return;
    }

    // Check for CRA
    if (deps['react-scripts']) {
      this.result.framework = 'react-cra';
      this.result.frameworkVersion = deps['react-scripts'].replace(/[\^~]/, '');
      return;
    }

    // Check for Vue
    if (deps['vue']) {
      this.result.framework = 'vue';
      this.result.frameworkVersion = deps['vue'].replace(/[\^~]/, '');
      return;
    }

    // Check for Angular
    if (deps['@angular/core']) {
      this.result.framework = 'angular';
      this.result.frameworkVersion = deps['@angular/core'].replace(/[\^~]/, '');
      return;
    }

    // Check for Svelte
    if (deps['svelte']) {
      this.result.framework = 'svelte';
      this.result.frameworkVersion = deps['svelte'].replace(/[\^~]/, '');
      return;
    }

    // Default to React if react is present
    if (deps['react']) {
      this.result.framework = 'react';
      this.result.frameworkVersion = deps['react'].replace(/[\^~]/, '');
    }
  }

  /**
   * Check if directory exists relative to project root
   */
  checkDir(relativePath) {
    const fullPath = path.join(this.result.projectRoot, relativePath);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory() ? fullPath : null;
  }

  /**
   * Find the source root directory
   */
  findSourceRoot() {
    const candidates = ['src', 'app', 'pages', 'lib'];

    for (const candidate of candidates) {
      const candidatePath = path.join(this.result.projectRoot, candidate);
      if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
        this.result.srcRoot = candidatePath;
        return;
      }
    }

    // Default to project root
    this.result.srcRoot = this.result.projectRoot;
  }

  /**
   * Detect styling approach used in the project
   */
  detectStyling() {
    if (!this.result.packageJson) return;

    const deps = {
      ...this.result.packageJson.dependencies,
      ...this.result.packageJson.devDependencies
    };

    // Check for Tailwind
    if (deps['tailwindcss'] || this.fileExists('tailwind.config.js') ||
        this.fileExists('tailwind.config.ts') || this.fileExists('tailwind.config.mjs')) {
      this.result.styling.push('tailwind');
    }

    // Check for styled-components
    if (deps['styled-components']) {
      this.result.styling.push('styled-components');
    }

    // Check for Emotion
    if (deps['@emotion/react'] || deps['@emotion/styled']) {
      this.result.styling.push('emotion');
    }

    // Check for Sass
    if (deps['sass'] || deps['node-sass']) {
      this.result.styling.push('sass');
    }

    // Scan for CSS modules
    if (this.result.srcRoot) {
      const hasModules = this.scanForPattern(this.result.srcRoot, /\.module\.(css|scss)$/);
      if (hasModules) {
        this.result.styling.push('css-modules');
      }
    }

    // Default to inline styles if nothing detected
    if (this.result.styling.length === 0) {
      this.result.styling.push('inline-styles');
    }
  }

  /**
   * Check if file exists relative to project root
   */
  fileExists(relativePath) {
    return fs.existsSync(path.join(this.result.projectRoot, relativePath));
  }

  /**
   * Scan directory for files matching pattern
   */
  scanForPattern(dir, pattern, maxDepth = 3, currentDepth = 0) {
    if (currentDepth > maxDepth) return false;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isFile() && pattern.test(entry.name)) {
          return true;
        }

        if (entry.isDirectory()) {
          if (this.scanForPattern(fullPath, pattern, maxDepth, currentDepth + 1)) {
            return true;
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }

    return false;
  }

  /**
   * Find existing page files
   */
  findPages() {
    const framework = this.result.framework;

    if (!framework || !this.result.projectRoot) return;

    let pageRoots = [];
    let pagePattern = /\.(tsx?|jsx?)$/;

    if (framework === 'next.js-app-router') {
      pageRoots = [
        path.join(this.result.projectRoot, 'app'),
        path.join(this.result.projectRoot, 'src', 'app')
      ];
      pagePattern = /page\.(tsx?|jsx?)$/;
    } else if (framework === 'next.js-pages-router') {
      pageRoots = [
        path.join(this.result.projectRoot, 'pages'),
        path.join(this.result.projectRoot, 'src', 'pages')
      ];
    } else if (framework === 'vue') {
      pageRoots = [
        path.join(this.result.projectRoot, 'src', 'views'),
        path.join(this.result.projectRoot, 'src', 'pages')
      ];
      pagePattern = /\.vue$/;
    }

    for (const pageRoot of pageRoots) {
      if (fs.existsSync(pageRoot)) {
        this.scanPages(pageRoot, pageRoot, pagePattern);
      }
    }
  }

  /**
   * Recursively scan for page files
   */
  scanPages(dir, rootDir, pattern, currentPath = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(currentPath, entry.name);

        if (entry.isFile() && pattern.test(entry.name)) {
          // Convert file path to route
          const route = this.filePathToRoute(relativePath, pattern);

          this.result.pages.push({
            file: fullPath,
            relativePath: relativePath,
            route: route,
            name: this.routeToName(route)
          });
        }

        if (entry.isDirectory()) {
          this.scanPages(fullPath, rootDir, pattern, relativePath);
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Convert file path to route
   */
  filePathToRoute(filePath, pattern) {
    let route = filePath
      .replace(pattern, '')
      .replace(/\\/g, '/')
      .replace(/\/index$/, '')
      .replace(/\/page$/, '');

    // Handle dynamic routes [param]
    route = route.replace(/\[([^\]]+)\]/g, ':$1');

    return '/' + route || '/';
  }

  /**
   * Convert route to human-readable name
   */
  routeToName(route) {
    return route
      .split('/')
      .filter(Boolean)
      .map(part => part.replace(/^:/, ''))
      .join('-') || 'home';
  }

  /**
   * Find existing component files
   */
  findComponents() {
    const componentDirs = [
      path.join(this.result.projectRoot, 'components'),
      path.join(this.result.projectRoot, 'src', 'components'),
      path.join(this.result.srcRoot || this.result.projectRoot, 'components')
    ];

    for (const dir of componentDirs) {
      if (fs.existsSync(dir)) {
        this.scanComponents(dir, dir);
      }
    }
  }

  /**
   * Recursively scan for component files
   */
  scanComponents(dir, rootDir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isFile() && /\.(tsx?|jsx?|vue|svelte)$/.test(entry.name)) {
          const relativePath = path.relative(rootDir, fullPath);
          const name = entry.name.replace(/\.(tsx?|jsx?|vue|svelte)$/, '');

          this.result.components.push({
            file: fullPath,
            relativePath: relativePath,
            name: name
          });
        }

        if (entry.isDirectory()) {
          this.scanComponents(fullPath, rootDir);
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Map captured pages from manifest to existing prototype files
   */
  mapCapturedPages(manifest) {
    if (!manifest || !manifest.pages || !this.result.pages.length) {
      return this.result.mappedPages;
    }

    for (const capturedPage of manifest.pages) {
      const capturedName = capturedPage.name.toLowerCase()
        .replace(/[_-]/g, '')
        .replace(/\s+/g, '');

      // Try to find matching prototype page
      for (const prototypePage of this.result.pages) {
        const protoName = prototypePage.name.toLowerCase()
          .replace(/[_-]/g, '')
          .replace(/\s+/g, '');

        if (capturedName.includes(protoName) || protoName.includes(capturedName)) {
          this.result.mappedPages[capturedPage.name] = {
            captured: capturedPage,
            prototype: prototypePage,
            similarity: this.calculateSimilarity(capturedName, protoName)
          };
          break;
        }
      }
    }

    return this.result.mappedPages;
  }

  /**
   * Calculate string similarity (simple Jaccard)
   */
  calculateSimilarity(str1, str2) {
    const set1 = new Set(str1.split(''));
    const set2 = new Set(str2.split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }
}

/**
 * Detect existing prototype in project directory
 */
function detectPrototype(projectPath) {
  const detector = new PrototypeDetector(projectPath);
  return detector.detect();
}

/**
 * Map captured pages to prototype files
 */
function mapPages(projectPath, manifest) {
  const detector = new PrototypeDetector(projectPath);
  detector.detect();
  return detector.mapCapturedPages(manifest);
}

/**
 * Format detection result for CLI output
 */
function formatResult(result) {
  const lines = [];

  if (!result.exists) {
    lines.push('\x1b[33m⚠ No existing prototype found\x1b[0m');
    return lines.join('\n');
  }

  lines.push('\x1b[32m✓ Existing prototype found\x1b[0m');
  lines.push(`  Framework: ${result.framework || 'Unknown'}${result.frameworkVersion ? ` v${result.frameworkVersion}` : ''}`);
  lines.push(`  Project root: ${result.projectRoot}`);
  lines.push(`  Styling: ${result.styling.join(', ') || 'Unknown'}`);

  if (result.pages.length > 0) {
    lines.push(`\n  \x1b[1mExisting Pages (${result.pages.length}):\x1b[0m`);
    for (const page of result.pages.slice(0, 10)) {
      lines.push(`    ${page.route} → ${path.basename(page.file)}`);
    }
    if (result.pages.length > 10) {
      lines.push(`    ... and ${result.pages.length - 10} more`);
    }
  }

  if (result.components.length > 0) {
    lines.push(`\n  \x1b[1mExisting Components (${result.components.length}):\x1b[0m`);
    for (const comp of result.components.slice(0, 10)) {
      lines.push(`    ${comp.name}`);
    }
    if (result.components.length > 10) {
      lines.push(`    ... and ${result.components.length - 10} more`);
    }
  }

  if (Object.keys(result.mappedPages).length > 0) {
    lines.push(`\n  \x1b[1mMapped Pages:\x1b[0m`);
    for (const [captured, mapping] of Object.entries(result.mappedPages)) {
      lines.push(`    ${captured} → ${mapping.prototype.file}`);
    }
  }

  return lines.join('\n');
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  let projectPath = '.';
  let manifestPath = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--path' || args[i] === '-p') {
      projectPath = args[++i];
    } else if (args[i] === '--project') {
      const projectName = args[++i];
      const SKILL_DIR = __dirname;
      const PROJECTS_DIR = path.resolve(SKILL_DIR, '../../../../projects');
      projectPath = path.join(PROJECTS_DIR, projectName, 'prototype');
    } else if (args[i] === '--manifest' || args[i] === '-m') {
      manifestPath = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: node detect-prototype.js [options]

Options:
  --path, -p <path>      Path to project directory
  --project <name>       Project name (looks in projects/<name>/prototype)
  --manifest, -m <path>  Path to manifest.json for page mapping
  --help, -h             Show this help

Examples:
  node detect-prototype.js --project my-app
  node detect-prototype.js --path ./projects/my-app/prototype
  node detect-prototype.js --path ./prototype --manifest ./references/manifest.json
      `);
      process.exit(0);
    }
  }

  const result = detectPrototype(projectPath);

  // Load manifest if provided
  if (manifestPath && fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const detector = new PrototypeDetector(projectPath);
      detector.detect();
      detector.mapCapturedPages(manifest);
      result.mappedPages = detector.result.mappedPages;
    } catch (e) {
      console.error(`Failed to load manifest: ${e.message}`);
    }
  }

  console.log(formatResult(result));

  // Exit with code 0 if prototype exists, 1 if not
  process.exit(result.exists ? 0 : 1);
}

module.exports = {
  PrototypeDetector,
  detectPrototype,
  mapPages,
  formatResult
};
