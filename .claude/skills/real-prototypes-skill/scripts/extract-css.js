#!/usr/bin/env node

/**
 * CSS Extraction Module
 *
 * Extracts styles from captured HTML files to understand the
 * styling approach used by the original platform.
 *
 * Features:
 * - Parses <style> tags from HTML
 * - Extracts inline styles from elements
 * - Identifies styling paradigm (CSS modules, Tailwind, SLDS, etc.)
 * - Generates CSS module files
 * - Maps CSS classes to their definitions
 *
 * Usage:
 *   node extract-css.js --project <name> --page <page>
 *   node extract-css.js --input ./html/page.html --output ./styles
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Common CSS frameworks/libraries patterns
const FRAMEWORK_PATTERNS = {
  tailwind: {
    patterns: [
      /\b(flex|grid|block|inline|hidden)\b/,
      /\b(p|m|w|h|gap|space)-(\d+|auto|full|screen|px)\b/,
      /\b(bg|text|border)-(gray|blue|red|green|yellow|purple|pink|indigo|white|black|transparent)-?\d*/,
      /\btext-(xs|sm|base|lg|xl|2xl|3xl)\b/,
      /\b(rounded|shadow|opacity|transition|duration)-?\w*/
    ],
    confidence: 0
  },
  slds: {
    patterns: [
      /\bslds-[\w-]+/,
      /\bsf-[\w-]+/
    ],
    confidence: 0
  },
  bootstrap: {
    patterns: [
      /\bbtn-[\w-]+/,
      /\bcol-[\w-]+/,
      /\brow\b/,
      /\bcontainer(-fluid)?\b/,
      /\bcard-[\w-]+/,
      /\bform-[\w-]+/
    ],
    confidence: 0
  },
  materialUI: {
    patterns: [
      /\bMui[\w-]+/,
      /\bmdc-[\w-]+/
    ],
    confidence: 0
  },
  antd: {
    patterns: [
      /\bant-[\w-]+/
    ],
    confidence: 0
  },
  custom: {
    patterns: [],
    confidence: 0
  }
};

class CSSExtractor {
  constructor(options = {}) {
    this.options = {
      generateModules: true,
      analyzeFramework: true,
      extractInline: true,
      ...options
    };

    this.dom = null;
    this.document = null;
    this.styleSheets = [];
    this.inlineStyles = [];
    this.classUsage = new Map();
    this.detectedFramework = null;
  }

  /**
   * Load HTML from file
   */
  loadFromFile(htmlPath) {
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`HTML file not found: ${htmlPath}`);
    }
    const html = fs.readFileSync(htmlPath, 'utf-8');
    return this.loadFromString(html);
  }

  /**
   * Load HTML from string
   */
  loadFromString(html) {
    this.dom = new JSDOM(html);
    this.document = this.dom.window.document;
    return this;
  }

  /**
   * Extract all <style> tags
   */
  extractStyleTags() {
    const styleTags = this.document.querySelectorAll('style');
    this.styleSheets = [];

    for (const style of styleTags) {
      const css = style.textContent.trim();
      if (css) {
        this.styleSheets.push({
          type: 'embedded',
          content: css,
          rules: this.parseCSS(css)
        });
      }
    }

    return this.styleSheets;
  }

  /**
   * Parse CSS string into rules
   */
  parseCSS(css) {
    const rules = [];

    // Remove comments
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');

    // Simple regex-based parser (not comprehensive but works for most cases)
    const rulePattern = /([^{}]+)\{([^{}]+)\}/g;
    let match;

    while ((match = rulePattern.exec(css)) !== null) {
      const selector = match[1].trim();
      const declarations = match[2].trim();

      const properties = {};
      const propPattern = /([\w-]+)\s*:\s*([^;]+)/g;
      let propMatch;

      while ((propMatch = propPattern.exec(declarations)) !== null) {
        properties[propMatch[1].trim()] = propMatch[2].trim();
      }

      rules.push({
        selector,
        properties,
        raw: `${selector} { ${declarations} }`
      });
    }

    return rules;
  }

  /**
   * Extract inline styles from all elements
   */
  extractInlineStyles() {
    const elements = this.document.querySelectorAll('[style]');
    this.inlineStyles = [];

    for (const el of elements) {
      const styleAttr = el.getAttribute('style');
      if (styleAttr) {
        const properties = this.parseInlineStyle(styleAttr);
        const tagName = el.tagName.toLowerCase();
        const className = el.className || '';
        const id = el.id || '';

        this.inlineStyles.push({
          element: tagName,
          className,
          id,
          style: styleAttr,
          properties,
          selector: this.generateSelector(el)
        });
      }
    }

    return this.inlineStyles;
  }

  /**
   * Parse inline style string to object
   */
  parseInlineStyle(styleStr) {
    const properties = {};
    const rules = styleStr.split(';').filter(Boolean);

    for (const rule of rules) {
      const [property, value] = rule.split(':').map(s => s.trim());
      if (property && value) {
        properties[property] = value;
      }
    }

    return properties;
  }

  /**
   * Generate CSS selector for element
   */
  generateSelector(el) {
    const tagName = el.tagName.toLowerCase();

    if (el.id) {
      return `#${el.id}`;
    }

    if (el.className && typeof el.className === 'string') {
      const firstClass = el.className.split(' ')[0];
      return `.${firstClass}`;
    }

    return tagName;
  }

  /**
   * Analyze class usage across all elements
   */
  analyzeClassUsage() {
    const elements = this.document.querySelectorAll('[class]');

    for (const el of elements) {
      const className = el.className;
      if (typeof className !== 'string') continue;

      const classes = className.split(/\s+/).filter(Boolean);

      for (const cls of classes) {
        if (!this.classUsage.has(cls)) {
          this.classUsage.set(cls, { count: 0, elements: [] });
        }

        const usage = this.classUsage.get(cls);
        usage.count++;
        if (usage.elements.length < 3) {
          usage.elements.push(el.tagName.toLowerCase());
        }
      }
    }

    return this.classUsage;
  }

  /**
   * Detect CSS framework/library used
   */
  detectFramework() {
    this.analyzeClassUsage();

    const allClasses = Array.from(this.classUsage.keys()).join(' ');

    for (const [name, config] of Object.entries(FRAMEWORK_PATTERNS)) {
      let matches = 0;
      for (const pattern of config.patterns) {
        const matchResult = allClasses.match(pattern);
        if (matchResult) {
          matches += matchResult.length;
        }
      }
      config.confidence = matches;
    }

    // Find framework with highest confidence
    let bestFramework = 'custom';
    let bestConfidence = 0;

    for (const [name, config] of Object.entries(FRAMEWORK_PATTERNS)) {
      if (config.confidence > bestConfidence) {
        bestFramework = name;
        bestConfidence = config.confidence;
      }
    }

    this.detectedFramework = {
      name: bestFramework,
      confidence: bestConfidence,
      allScores: Object.fromEntries(
        Object.entries(FRAMEWORK_PATTERNS).map(([k, v]) => [k, v.confidence])
      )
    };

    return this.detectedFramework;
  }

  /**
   * Generate CSS module from extracted styles
   */
  generateCSSModule() {
    const moduleContent = [];

    // Add extracted stylesheet rules
    for (const sheet of this.styleSheets) {
      for (const rule of sheet.rules) {
        moduleContent.push(rule.raw);
        moduleContent.push('');
      }
    }

    // Add inline styles as classes
    if (this.inlineStyles.length > 0) {
      moduleContent.push('/* Inline styles extracted as classes */');

      for (let i = 0; i < this.inlineStyles.length; i++) {
        const style = this.inlineStyles[i];
        const className = style.className ?
          style.className.split(' ')[0] :
          `inline-${i}`;

        const declarations = Object.entries(style.properties)
          .map(([prop, val]) => `  ${prop}: ${val};`)
          .join('\n');

        moduleContent.push(`.${className} {`);
        moduleContent.push(declarations);
        moduleContent.push('}');
        moduleContent.push('');
      }
    }

    return moduleContent.join('\n');
  }

  /**
   * Get most used classes
   */
  getMostUsedClasses(limit = 20) {
    const sorted = Array.from(this.classUsage.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit);

    return sorted.map(([cls, usage]) => ({
      class: cls,
      count: usage.count,
      elements: usage.elements
    }));
  }

  /**
   * Get styling recommendation
   */
  getStylingRecommendation() {
    const framework = this.detectFramework();

    const recommendations = {
      tailwind: 'Use Tailwind utility classes. Match exact class combinations.',
      slds: 'Use Salesforce Lightning Design System (SLDS) classes. Import @salesforce-ux/design-system.',
      bootstrap: 'Use Bootstrap classes. Import bootstrap CSS.',
      materialUI: 'Use Material-UI components and styling. Import @mui/material.',
      antd: 'Use Ant Design components. Import antd.',
      custom: 'Use CSS modules or inline styles to match the custom styling.'
    };

    return {
      framework: framework.name,
      confidence: framework.confidence,
      recommendation: recommendations[framework.name] || recommendations.custom,
      approach: framework.confidence > 10 ? 'framework' : 'inline-styles'
    };
  }

  /**
   * Extract all data
   */
  extract() {
    this.extractStyleTags();
    this.extractInlineStyles();
    this.analyzeClassUsage();
    this.detectFramework();

    return {
      styleSheets: this.styleSheets,
      inlineStyles: this.inlineStyles,
      classUsage: Object.fromEntries(this.classUsage),
      framework: this.detectedFramework,
      recommendation: this.getStylingRecommendation(),
      mostUsedClasses: this.getMostUsedClasses()
    };
  }

  /**
   * Format results for CLI output
   */
  formatResults() {
    const lines = [];
    const data = this.extract();

    lines.push('\x1b[1mCSS Extraction Results\x1b[0m\n');

    // Framework detection
    lines.push('\x1b[1mDetected Framework:\x1b[0m');
    lines.push(`  ${data.framework.name} (confidence: ${data.framework.confidence})`);
    lines.push('');

    // Recommendation
    lines.push('\x1b[1mRecommendation:\x1b[0m');
    lines.push(`  ${data.recommendation.recommendation}`);
    lines.push(`  Approach: ${data.recommendation.approach}`);
    lines.push('');

    // Style sheets
    lines.push(`\x1b[1mEmbedded Style Tags:\x1b[0m ${data.styleSheets.length}`);
    for (const sheet of data.styleSheets.slice(0, 3)) {
      lines.push(`  ${sheet.rules.length} rules`);
    }
    lines.push('');

    // Inline styles
    lines.push(`\x1b[1mInline Styles:\x1b[0m ${data.inlineStyles.length}`);
    lines.push('');

    // Most used classes
    lines.push('\x1b[1mMost Used Classes:\x1b[0m');
    for (const cls of data.mostUsedClasses.slice(0, 10)) {
      lines.push(`  ${cls.class} (${cls.count}x)`);
    }

    return lines.join('\n');
  }
}

/**
 * Extract CSS from HTML file
 */
function extractCSS(htmlPath) {
  const extractor = new CSSExtractor();
  extractor.loadFromFile(htmlPath);
  return extractor.extract();
}

/**
 * Write CSS module to file
 */
function writeCSSModule(extractor, outputPath) {
  const content = extractor.generateCSSModule();
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, content);
  return outputPath;
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  let inputPath = null;
  let outputPath = null;
  let projectName = null;
  let pageName = null;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
      case '-i':
        inputPath = args[++i];
        break;
      case '--output':
      case '-o':
        outputPath = args[++i];
        break;
      case '--project':
        projectName = args[++i];
        break;
      case '--page':
        pageName = args[++i];
        break;
      case '--json':
        jsonOutput = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node extract-css.js [options]

Options:
  --input, -i <path>     Path to HTML file
  --output, -o <path>    Output path for CSS module
  --project <name>       Project name
  --page <name>          Page name (used with --project)
  --json                 Output as JSON
  --help, -h             Show this help

Examples:
  node extract-css.js --input ./html/page.html
  node extract-css.js --project my-app --page homepage
  node extract-css.js -i ./page.html -o ./styles/page.module.css
        `);
        process.exit(0);
    }
  }

  // Handle project-based paths
  if (projectName) {
    const SKILL_DIR = path.dirname(__dirname);
    const PROJECTS_DIR = path.resolve(SKILL_DIR, '../../../projects');
    const projectDir = path.join(PROJECTS_DIR, projectName);

    if (pageName) {
      inputPath = path.join(projectDir, 'references', 'html', `${pageName}.html`);
      outputPath = outputPath || path.join(projectDir, 'prototype', 'src', 'styles', `${pageName}.module.css`);
    }
  }

  if (!inputPath) {
    console.error('\x1b[31mError:\x1b[0m --input is required');
    process.exit(1);
  }

  try {
    const extractor = new CSSExtractor();
    extractor.loadFromFile(inputPath);

    if (jsonOutput) {
      console.log(JSON.stringify(extractor.extract(), null, 2));
    } else {
      console.log(`\nInput: ${inputPath}`);
      if (outputPath) {
        console.log(`Output: ${outputPath}`);
      }
      console.log('');
      console.log(extractor.formatResults());

      if (outputPath) {
        writeCSSModule(extractor, outputPath);
        console.log(`\n\x1b[32m✓ CSS module written to: ${outputPath}\x1b[0m`);
      }
    }

  } catch (error) {
    console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  CSSExtractor,
  extractCSS,
  writeCSSModule
};
