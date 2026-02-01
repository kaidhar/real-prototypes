#!/usr/bin/env node

/**
 * Color Validator Module
 *
 * Validates that all colors used in generated prototype files
 * match the design tokens extracted from the captured platform.
 *
 * Features:
 * - Scans TSX/JSX/CSS files for color values
 * - Extracts hex colors from inline styles, CSS, and Tailwind arbitrary values
 * - Finds closest matching color in design tokens
 * - Reports violations with line numbers and suggestions
 *
 * Usage:
 *   node color-validator.js --project <name>
 *   node color-validator.js --proto ./prototype --tokens ./references/design-tokens.json
 */

const fs = require('fs');
const path = require('path');

// Patterns to find colors
const COLOR_PATTERNS = {
  // Hex colors (#fff, #ffffff, #ffffffff)
  hex: /#([0-9a-fA-F]{3,8})\b/g,

  // RGB/RGBA
  rgb: /rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+)?\s*\)/g,

  // HSL/HSLA
  hsl: /hsla?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*(?:,\s*[\d.]+)?\s*\)/g,

  // Tailwind default colors (not allowed)
  tailwindDefault: /\b(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(\d{2,3})\b/g,

  // Tailwind arbitrary values
  tailwindArbitrary: /\[(#[0-9a-fA-F]{3,8})\]/g
};

// Named colors to avoid
const NAMED_COLORS = [
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
  'gray', 'grey', 'black', 'white', 'cyan', 'magenta', 'lime',
  'maroon', 'navy', 'olive', 'teal', 'aqua', 'fuchsia', 'silver'
];

class ColorValidator {
  constructor(options = {}) {
    this.designTokens = options.designTokens || null;
    this.prototypeDir = options.prototypeDir || './prototype';
    this.violations = [];
    this.validColors = new Set();
    this.colorMap = new Map(); // hex -> token name mapping
  }

  /**
   * Load design tokens from file
   */
  loadDesignTokens(tokensPath) {
    if (!fs.existsSync(tokensPath)) {
      throw new Error(`Design tokens file not found: ${tokensPath}`);
    }

    this.designTokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    this.buildColorMap();
  }

  /**
   * Build a map of valid colors from design tokens
   */
  buildColorMap() {
    if (!this.designTokens) return;

    const extractColors = (obj, prefix = '') => {
      if (!obj || typeof obj !== 'object') return;

      for (const [key, value] of Object.entries(obj)) {
        const tokenName = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'string' && value.startsWith('#')) {
          const normalizedHex = this.normalizeHex(value);
          this.validColors.add(normalizedHex);
          this.colorMap.set(normalizedHex, tokenName);
        } else if (typeof value === 'object') {
          extractColors(value, tokenName);
        }
      }
    };

    // Extract from colors section
    if (this.designTokens.colors) {
      extractColors(this.designTokens.colors);
    }

    // Extract from raw colors if available
    if (this.designTokens.rawColors) {
      for (const color of this.designTokens.rawColors) {
        const normalizedHex = this.normalizeHex(color.hex || color);
        this.validColors.add(normalizedHex);
        if (!this.colorMap.has(normalizedHex)) {
          this.colorMap.set(normalizedHex, `raw.${normalizedHex}`);
        }
      }
    }

    // Also add black and white as they're always valid
    this.validColors.add('#000000');
    this.validColors.add('#ffffff');
    this.colorMap.set('#000000', 'black');
    this.colorMap.set('#ffffff', 'white');
  }

  /**
   * Normalize hex color to 6-digit lowercase format
   */
  normalizeHex(hex) {
    if (!hex) return null;

    let cleaned = hex.toLowerCase().replace('#', '');

    // Convert 3-digit to 6-digit
    if (cleaned.length === 3) {
      cleaned = cleaned.split('').map(c => c + c).join('');
    }

    // Handle 8-digit (with alpha)
    if (cleaned.length === 8) {
      cleaned = cleaned.substring(0, 6);
    }

    return '#' + cleaned;
  }

  /**
   * Convert RGB to hex
   */
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = parseInt(x, 10).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  /**
   * Calculate color distance (simple Euclidean in RGB space)
   */
  colorDistance(hex1, hex2) {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);

    if (!rgb1 || !rgb2) return Infinity;

    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }

  /**
   * Convert hex to RGB object
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Find closest matching color from design tokens
   */
  findClosestColor(hex) {
    const normalizedHex = this.normalizeHex(hex);
    let closestColor = null;
    let closestDistance = Infinity;
    let closestName = null;

    for (const [validHex, tokenName] of this.colorMap.entries()) {
      const distance = this.colorDistance(normalizedHex, validHex);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestColor = validHex;
        closestName = tokenName;
      }
    }

    return {
      hex: closestColor,
      name: closestName,
      distance: closestDistance,
      isExact: closestDistance === 0
    };
  }

  /**
   * Validate a single file
   */
  validateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = path.relative(this.prototypeDir, filePath);
    const fileViolations = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for hex colors
      const hexMatches = [...line.matchAll(COLOR_PATTERNS.hex)];
      for (const match of hexMatches) {
        const hex = this.normalizeHex(match[0]);
        if (!this.validColors.has(hex)) {
          const closest = this.findClosestColor(hex);
          fileViolations.push({
            file: relativePath,
            line: lineNumber,
            column: match.index + 1,
            type: 'invalid-hex',
            value: match[0],
            normalized: hex,
            suggestion: closest.hex,
            suggestionName: closest.name,
            distance: closest.distance,
            context: line.trim().substring(0, 80)
          });
        }
      }

      // Check for RGB colors
      const rgbMatches = [...line.matchAll(COLOR_PATTERNS.rgb)];
      for (const match of rgbMatches) {
        const hex = this.rgbToHex(match[1], match[2], match[3]);
        const normalized = this.normalizeHex(hex);
        if (!this.validColors.has(normalized)) {
          const closest = this.findClosestColor(hex);
          fileViolations.push({
            file: relativePath,
            line: lineNumber,
            column: match.index + 1,
            type: 'invalid-rgb',
            value: match[0],
            normalized: normalized,
            suggestion: closest.hex,
            suggestionName: closest.name,
            distance: closest.distance,
            context: line.trim().substring(0, 80)
          });
        }
      }

      // Check for Tailwind default colors (always a violation)
      const tailwindMatches = [...line.matchAll(COLOR_PATTERNS.tailwindDefault)];
      for (const match of tailwindMatches) {
        fileViolations.push({
          file: relativePath,
          line: lineNumber,
          column: match.index + 1,
          type: 'tailwind-default',
          value: match[0],
          suggestion: 'Use inline style={{ }} with design token hex color',
          context: line.trim().substring(0, 80)
        });
      }

      // Check for Tailwind arbitrary values
      const arbitraryMatches = [...line.matchAll(COLOR_PATTERNS.tailwindArbitrary)];
      for (const match of arbitraryMatches) {
        const hex = this.normalizeHex(match[1]);
        if (!this.validColors.has(hex)) {
          const closest = this.findClosestColor(hex);
          fileViolations.push({
            file: relativePath,
            line: lineNumber,
            column: match.index + 1,
            type: 'invalid-arbitrary',
            value: match[0],
            normalized: hex,
            suggestion: `[${closest.hex}]`,
            suggestionName: closest.name,
            distance: closest.distance,
            context: line.trim().substring(0, 80)
          });
        }
      }
    });

    this.violations.push(...fileViolations);
    return fileViolations;
  }

  /**
   * Recursively scan directory for files
   */
  scanDirectory(dir, extensions = ['.tsx', '.jsx', '.ts', '.js', '.css', '.scss']) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        this.scanDirectory(fullPath, extensions);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          this.validateFile(fullPath);
        }
      }
    }
  }

  /**
   * Run validation on prototype directory
   */
  validate() {
    this.violations = [];
    this.scanDirectory(this.prototypeDir);
    return this.violations;
  }

  /**
   * Get validation summary
   */
  getSummary() {
    const byType = {};
    const byFile = {};

    for (const violation of this.violations) {
      byType[violation.type] = (byType[violation.type] || 0) + 1;
      byFile[violation.file] = (byFile[violation.file] || 0) + 1;
    }

    return {
      total: this.violations.length,
      byType,
      byFile,
      validColorsCount: this.validColors.size,
      passed: this.violations.length === 0
    };
  }

  /**
   * Format violations for CLI output
   */
  formatViolations() {
    if (this.violations.length === 0) {
      return '\x1b[32m✓ No color violations found\x1b[0m';
    }

    const lines = [
      `\x1b[31m✗ Found ${this.violations.length} color violation(s)\x1b[0m\n`
    ];

    // Group by file
    const byFile = {};
    for (const v of this.violations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }

    for (const [file, violations] of Object.entries(byFile)) {
      lines.push(`\x1b[1m${file}\x1b[0m`);

      for (const v of violations) {
        lines.push(`  Line ${v.line}: \x1b[33m${v.value}\x1b[0m`);

        if (v.type === 'tailwind-default') {
          lines.push(`    \x1b[31mError:\x1b[0m Tailwind default colors are not allowed`);
          lines.push(`    \x1b[32mFix:\x1b[0m Use style={{ backgroundColor: "#hexcolor" }} with design token`);
        } else {
          lines.push(`    \x1b[31mError:\x1b[0m Color ${v.normalized} not found in design-tokens.json`);
          if (v.suggestion && v.suggestionName) {
            lines.push(`    \x1b[32mSuggestion:\x1b[0m Use ${v.suggestion} (${v.suggestionName})`);
          }
        }

        if (v.context) {
          lines.push(`    \x1b[90mContext: ${v.context}\x1b[0m`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate JSON report
   */
  toJSON() {
    return {
      timestamp: new Date().toISOString(),
      prototypeDir: this.prototypeDir,
      summary: this.getSummary(),
      validColors: Array.from(this.validColors),
      violations: this.violations
    };
  }
}

/**
 * Validate colors in prototype against design tokens
 */
function validateColors(prototypeDir, tokensPath) {
  const validator = new ColorValidator({ prototypeDir });
  validator.loadDesignTokens(tokensPath);
  validator.validate();
  return validator;
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  let prototypeDir = './prototype';
  let tokensPath = './references/design-tokens.json';
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--proto':
      case '-p':
        prototypeDir = args[++i];
        break;
      case '--tokens':
      case '-t':
        tokensPath = args[++i];
        break;
      case '--project':
        const projectName = args[++i];
        const SKILL_DIR = path.dirname(__dirname);
        const PROJECTS_DIR = path.resolve(SKILL_DIR, '../../../projects');
        prototypeDir = path.join(PROJECTS_DIR, projectName, 'prototype');
        tokensPath = path.join(PROJECTS_DIR, projectName, 'references', 'design-tokens.json');
        break;
      case '--json':
        jsonOutput = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node color-validator.js [options]

Options:
  --proto, -p <path>     Path to prototype directory
  --tokens, -t <path>    Path to design-tokens.json
  --project <name>       Project name (sets proto and tokens paths)
  --json                 Output as JSON
  --help, -h             Show this help

Examples:
  node color-validator.js --project my-app
  node color-validator.js --proto ./prototype --tokens ./references/design-tokens.json
        `);
        process.exit(0);
    }
  }

  try {
    const validator = validateColors(prototypeDir, tokensPath);

    if (jsonOutput) {
      console.log(JSON.stringify(validator.toJSON(), null, 2));
    } else {
      console.log(`\n\x1b[1mColor Validation Report\x1b[0m`);
      console.log(`Prototype: ${prototypeDir}`);
      console.log(`Design Tokens: ${tokensPath}`);
      console.log(`Valid Colors: ${validator.validColors.size}`);
      console.log('');
      console.log(validator.formatViolations());

      const summary = validator.getSummary();
      if (!summary.passed) {
        console.log(`\n\x1b[1mSummary by Type:\x1b[0m`);
        for (const [type, count] of Object.entries(summary.byType)) {
          console.log(`  ${type}: ${count}`);
        }
      }
    }

    process.exit(validator.violations.length === 0 ? 0 : 1);
  } catch (error) {
    console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  ColorValidator,
  validateColors
};
