#!/usr/bin/env node

/**
 * Component Library Extractor
 *
 * Analyzes captured HTML files to identify common UI patterns and
 * generates a reusable component library from the captured platform.
 *
 * Features:
 * - Identifies common UI patterns (buttons, cards, inputs, tables)
 * - Extracts component variants (primary, secondary, destructive)
 * - Generates React component files with exact styling
 * - Creates component registry for easy lookup
 * - Tracks component source for reference
 *
 * Usage:
 *   node extract-components.js --project <name>
 *   node extract-components.js --input ./html --output ./components
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Component detection patterns
const COMPONENT_PATTERNS = {
  Button: {
    selectors: [
      'button',
      '[role="button"]',
      'a.btn',
      'a.button',
      '[class*="btn"]',
      '[class*="button"]'
    ],
    excludeSelectors: ['[type="submit"]', '[type="reset"]'],
    variants: {
      primary: [/primary/i, /btn-primary/i, /bg-blue/i, /bg-primary/i],
      secondary: [/secondary/i, /btn-secondary/i, /btn-outline/i, /btn-ghost/i],
      destructive: [/danger/i, /destructive/i, /btn-danger/i, /btn-red/i, /delete/i],
      disabled: [/disabled/i, /btn-disabled/i]
    }
  },
  Card: {
    selectors: [
      '[class*="card"]',
      '[class*="panel"]',
      '[class*="tile"]',
      '[class*="box"]',
      'article'
    ],
    variants: {
      default: [/card(?!-)/i],
      elevated: [/shadow/i, /elevated/i],
      bordered: [/border/i, /outlined/i]
    }
  },
  Input: {
    selectors: [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="password"]',
      'input[type="search"]',
      'input[type="tel"]',
      'input[type="url"]',
      'input:not([type])',
      'textarea',
      '[class*="input"]',
      '[class*="text-field"]'
    ],
    variants: {
      default: [/input(?!-)/i],
      error: [/error/i, /invalid/i, /danger/i],
      success: [/success/i, /valid/i],
      disabled: [/disabled/i]
    }
  },
  Select: {
    selectors: [
      'select',
      '[class*="select"]',
      '[class*="dropdown"]',
      '[role="listbox"]'
    ],
    variants: {
      default: [/select(?!-)/i],
      multiple: [/multiple/i]
    }
  },
  Table: {
    selectors: [
      'table',
      '[class*="table"]',
      '[class*="data-grid"]',
      '[role="grid"]'
    ],
    variants: {
      default: [/table(?!-)/i],
      striped: [/striped/i, /zebra/i],
      bordered: [/bordered/i]
    }
  },
  Badge: {
    selectors: [
      '[class*="badge"]',
      '[class*="tag"]',
      '[class*="chip"]',
      '[class*="label"]',
      '[class*="pill"]'
    ],
    variants: {
      default: [/badge(?!-)/i],
      success: [/success/i, /green/i],
      warning: [/warning/i, /yellow/i, /orange/i],
      error: [/error/i, /danger/i, /red/i],
      info: [/info/i, /blue/i]
    }
  },
  Avatar: {
    selectors: [
      '[class*="avatar"]',
      '[class*="profile-image"]',
      '[class*="user-image"]',
      'img[class*="rounded-full"]'
    ],
    variants: {
      default: [/avatar(?!-)/i],
      small: [/sm/i, /small/i, /xs/i],
      large: [/lg/i, /large/i, /xl/i]
    }
  },
  Modal: {
    selectors: [
      '[class*="modal"]',
      '[class*="dialog"]',
      '[role="dialog"]',
      '[aria-modal="true"]'
    ],
    variants: {
      default: [/modal(?!-)/i]
    }
  },
  Alert: {
    selectors: [
      '[class*="alert"]',
      '[class*="notification"]',
      '[class*="toast"]',
      '[role="alert"]'
    ],
    variants: {
      success: [/success/i, /green/i],
      warning: [/warning/i, /yellow/i],
      error: [/error/i, /danger/i, /red/i],
      info: [/info/i, /blue/i]
    }
  },
  Tabs: {
    selectors: [
      '[class*="tabs"]',
      '[role="tablist"]',
      '[class*="tab-list"]'
    ],
    variants: {
      default: [/tabs(?!-)/i]
    }
  },
  Navigation: {
    selectors: [
      'nav',
      '[class*="nav"]',
      '[class*="sidebar"]',
      '[class*="menu"]',
      '[role="navigation"]'
    ],
    variants: {
      horizontal: [/horizontal/i, /navbar/i, /topnav/i],
      vertical: [/vertical/i, /sidebar/i, /sidenav/i]
    }
  }
};

class ComponentExtractor {
  constructor(options = {}) {
    this.options = {
      minOccurrences: 1,
      generateTypeScript: true,
      ...options
    };

    this.components = new Map();
    this.registry = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      components: {}
    };
  }

  /**
   * Load and analyze an HTML file
   */
  analyzeFile(htmlPath) {
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`HTML file not found: ${htmlPath}`);
    }

    const html = fs.readFileSync(htmlPath, 'utf-8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const fileName = path.basename(htmlPath, '.html');

    for (const [componentType, config] of Object.entries(COMPONENT_PATTERNS)) {
      this.extractComponent(document, componentType, config, fileName);
    }

    return this;
  }

  /**
   * Analyze multiple HTML files in a directory
   */
  analyzeDirectory(htmlDir) {
    if (!fs.existsSync(htmlDir)) {
      throw new Error(`Directory not found: ${htmlDir}`);
    }

    const files = fs.readdirSync(htmlDir)
      .filter(f => f.endsWith('.html'));

    for (const file of files) {
      this.analyzeFile(path.join(htmlDir, file));
    }

    return this;
  }

  /**
   * Extract a specific component type from document
   */
  extractComponent(document, componentType, config, sourceFile) {
    for (const selector of config.selectors) {
      try {
        const elements = document.querySelectorAll(selector);

        for (const element of elements) {
          // Skip if matches exclude selector
          if (config.excludeSelectors) {
            const shouldExclude = config.excludeSelectors.some(excl => {
              try {
                return element.matches(excl);
              } catch {
                return false;
              }
            });
            if (shouldExclude) continue;
          }

          // Determine variant
          const variant = this.detectVariant(element, config.variants);

          // Extract component data
          const componentData = {
            type: componentType,
            variant,
            className: element.className || '',
            tagName: element.tagName.toLowerCase(),
            html: element.outerHTML.substring(0, 500), // Limit HTML size
            styles: this.extractStyles(element),
            attributes: this.extractAttributes(element),
            sourceFile,
            selector
          };

          // Add to components map
          const key = `${componentType}-${variant}`;
          if (!this.components.has(key)) {
            this.components.set(key, []);
          }
          this.components.get(key).push(componentData);
        }
      } catch (e) {
        // Invalid selector, skip
      }
    }
  }

  /**
   * Detect variant from element classes
   */
  detectVariant(element, variants) {
    const className = element.className || '';

    for (const [variant, patterns] of Object.entries(variants)) {
      for (const pattern of patterns) {
        if (pattern.test(className)) {
          return variant;
        }
      }
    }

    return 'default';
  }

  /**
   * Extract inline styles
   */
  extractStyles(element) {
    const styleAttr = element.getAttribute('style');
    if (!styleAttr) return {};

    const styles = {};
    const rules = styleAttr.split(';').filter(Boolean);

    for (const rule of rules) {
      const [prop, value] = rule.split(':').map(s => s.trim());
      if (prop && value) {
        const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        styles[camelProp] = value;
      }
    }

    return styles;
  }

  /**
   * Extract relevant attributes
   */
  extractAttributes(element) {
    const attrs = {};
    const relevantAttrs = ['type', 'role', 'aria-label', 'placeholder', 'disabled'];

    for (const attr of relevantAttrs) {
      const value = element.getAttribute(attr);
      if (value !== null) {
        attrs[attr] = value;
      }
    }

    return attrs;
  }

  /**
   * Generate React component file
   */
  generateComponent(componentType, variants) {
    const ext = this.options.generateTypeScript ? 'tsx' : 'jsx';
    const propsType = this.options.generateTypeScript ? 'Props' : '';

    // Get unique classes across all variants
    const allClasses = new Set();
    const variantClasses = {};

    for (const [key, instances] of this.components.entries()) {
      if (!key.startsWith(componentType)) continue;

      const variant = key.split('-').slice(1).join('-');
      variantClasses[variant] = new Set();

      for (const instance of instances) {
        const classes = instance.className.split(/\s+/).filter(Boolean);
        classes.forEach(c => {
          allClasses.add(c);
          variantClasses[variant].add(c);
        });
      }
    }

    // Get most common base classes
    const baseClasses = this.getMostCommonClasses(componentType);

    // Generate component
    const variantNames = Object.keys(variantClasses).filter(v => variantClasses[v].size > 0);

    let component = '';

    if (this.options.generateTypeScript) {
      component += `import React from 'react';\n\n`;

      // Generate props interface
      component += `interface ${componentType}Props {\n`;
      component += `  variant?: ${variantNames.map(v => `'${v}'`).join(' | ') || "'default'"};\n`;
      component += `  className?: string;\n`;
      component += `  children?: React.ReactNode;\n`;

      // Add specific props based on component type
      if (componentType === 'Button') {
        component += `  onClick?: () => void;\n`;
        component += `  disabled?: boolean;\n`;
        component += `  type?: 'button' | 'submit' | 'reset';\n`;
      } else if (componentType === 'Input') {
        component += `  value?: string;\n`;
        component += `  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;\n`;
        component += `  placeholder?: string;\n`;
        component += `  disabled?: boolean;\n`;
      }

      component += `}\n\n`;
    }

    // Generate variant classes map
    component += `const variantClasses = {\n`;
    for (const [variant, classes] of Object.entries(variantClasses)) {
      const classArray = Array.from(classes).slice(0, 10);
      component += `  ${variant}: '${classArray.join(' ')}',\n`;
    }
    component += `};\n\n`;

    // Generate component function
    const funcDef = this.options.generateTypeScript
      ? `export const ${componentType}: React.FC<${componentType}Props>`
      : `export const ${componentType}`;

    component += `${funcDef} = ({\n`;
    component += `  variant = 'default',\n`;
    component += `  className = '',\n`;
    component += `  children,\n`;

    if (componentType === 'Button') {
      component += `  onClick,\n`;
      component += `  disabled = false,\n`;
      component += `  type = 'button',\n`;
    } else if (componentType === 'Input') {
      component += `  value,\n`;
      component += `  onChange,\n`;
      component += `  placeholder,\n`;
      component += `  disabled = false,\n`;
    }

    component += `  ...props\n`;
    component += `}) => {\n`;
    component += `  const baseClasses = '${baseClasses.join(' ')}';\n`;
    component += `  const variantClass = variantClasses[variant] || variantClasses.default;\n`;
    component += `  const combinedClasses = \`\${baseClasses} \${variantClass} \${className}\`.trim();\n\n`;

    // Generate JSX based on component type
    if (componentType === 'Button') {
      component += `  return (\n`;
      component += `    <button\n`;
      component += `      type={type}\n`;
      component += `      className={combinedClasses}\n`;
      component += `      onClick={onClick}\n`;
      component += `      disabled={disabled}\n`;
      component += `      {...props}\n`;
      component += `    >\n`;
      component += `      {children}\n`;
      component += `    </button>\n`;
      component += `  );\n`;
    } else if (componentType === 'Input') {
      component += `  return (\n`;
      component += `    <input\n`;
      component += `      className={combinedClasses}\n`;
      component += `      value={value}\n`;
      component += `      onChange={onChange}\n`;
      component += `      placeholder={placeholder}\n`;
      component += `      disabled={disabled}\n`;
      component += `      {...props}\n`;
      component += `    />\n`;
      component += `  );\n`;
    } else if (componentType === 'Card') {
      component += `  return (\n`;
      component += `    <div className={combinedClasses} {...props}>\n`;
      component += `      {children}\n`;
      component += `    </div>\n`;
      component += `  );\n`;
    } else {
      component += `  return (\n`;
      component += `    <div className={combinedClasses} {...props}>\n`;
      component += `      {children}\n`;
      component += `    </div>\n`;
      component += `  );\n`;
    }

    component += `};\n\n`;
    component += `export default ${componentType};\n`;

    return {
      name: componentType,
      filename: `${componentType}.${ext}`,
      content: component,
      variants: variantNames
    };
  }

  /**
   * Get most common classes for a component type
   */
  getMostCommonClasses(componentType) {
    const classCounts = new Map();

    for (const [key, instances] of this.components.entries()) {
      if (!key.startsWith(componentType)) continue;

      for (const instance of instances) {
        const classes = instance.className.split(/\s+/).filter(Boolean);
        for (const cls of classes) {
          classCounts.set(cls, (classCounts.get(cls) || 0) + 1);
        }
      }
    }

    // Get classes that appear in most instances
    const sorted = Array.from(classCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cls]) => cls);

    return sorted;
  }

  /**
   * Generate all components
   */
  generateAll() {
    const generated = [];
    const componentTypes = new Set();

    // Get unique component types
    for (const key of this.components.keys()) {
      const type = key.split('-')[0];
      componentTypes.add(type);
    }

    // Generate each component
    for (const type of componentTypes) {
      const variants = {};
      for (const [key, instances] of this.components.entries()) {
        if (key.startsWith(type)) {
          const variant = key.split('-').slice(1).join('-');
          variants[variant] = instances;
        }
      }

      if (Object.keys(variants).length > 0) {
        const component = this.generateComponent(type, variants);
        generated.push(component);

        // Add to registry
        this.registry.components[type] = {
          path: `components/extracted/${component.filename}`,
          variants: component.variants,
          instances: Object.values(variants).flat().length
        };
      }
    }

    return generated;
  }

  /**
   * Write components to output directory
   */
  writeComponents(outputDir) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const components = this.generateAll();
    const written = [];

    for (const component of components) {
      const filePath = path.join(outputDir, component.filename);
      fs.writeFileSync(filePath, component.content);
      written.push(filePath);
    }

    // Write registry
    const registryPath = path.join(outputDir, 'registry.json');
    fs.writeFileSync(registryPath, JSON.stringify(this.registry, null, 2));
    written.push(registryPath);

    // Write index file
    const indexContent = this.generateIndex(components);
    const indexPath = path.join(outputDir, `index.${this.options.generateTypeScript ? 'ts' : 'js'}`);
    fs.writeFileSync(indexPath, indexContent);
    written.push(indexPath);

    return written;
  }

  /**
   * Generate index file
   */
  generateIndex(components) {
    let content = '// Auto-generated component library index\n\n';

    for (const component of components) {
      const name = component.name;
      content += `export { ${name} } from './${name}';\n`;
    }

    return content;
  }

  /**
   * Get extraction summary
   */
  getSummary() {
    const summary = {
      totalComponents: this.components.size,
      byType: {}
    };

    for (const [key, instances] of this.components.entries()) {
      const type = key.split('-')[0];
      if (!summary.byType[type]) {
        summary.byType[type] = { variants: [], instances: 0 };
      }
      const variant = key.split('-').slice(1).join('-');
      if (!summary.byType[type].variants.includes(variant)) {
        summary.byType[type].variants.push(variant);
      }
      summary.byType[type].instances += instances.length;
    }

    return summary;
  }

  /**
   * Format summary for CLI output
   */
  formatSummary() {
    const summary = this.getSummary();
    const lines = [];

    lines.push('\x1b[1mComponent Library Extraction Summary\x1b[0m\n');
    lines.push(`Total component types found: ${Object.keys(summary.byType).length}\n`);

    for (const [type, data] of Object.entries(summary.byType)) {
      lines.push(`\x1b[1m${type}\x1b[0m`);
      lines.push(`  Variants: ${data.variants.join(', ')}`);
      lines.push(`  Instances: ${data.instances}`);
      lines.push('');
    }

    return lines.join('\n');
  }
}

/**
 * Extract components from HTML directory
 */
function extractComponents(htmlDir, options = {}) {
  const extractor = new ComponentExtractor(options);
  extractor.analyzeDirectory(htmlDir);
  return extractor;
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  let inputDir = null;
  let outputDir = null;
  let projectName = null;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
      case '-i':
        inputDir = args[++i];
        break;
      case '--output':
      case '-o':
        outputDir = args[++i];
        break;
      case '--project':
        projectName = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node extract-components.js [options]

Options:
  --input, -i <path>   Input directory containing HTML files
  --output, -o <path>  Output directory for generated components
  --project <name>     Project name
  --help, -h           Show this help

Examples:
  node extract-components.js --project my-app
  node extract-components.js -i ./html -o ./components/extracted
        `);
        process.exit(0);
    }
  }

  // Handle project-based paths
  if (projectName) {
    const SKILL_DIR = path.dirname(__dirname);
    const PROJECTS_DIR = path.resolve(SKILL_DIR, '../../../projects');
    const projectDir = path.join(PROJECTS_DIR, projectName);

    inputDir = inputDir || path.join(projectDir, 'references', 'html');
    outputDir = outputDir || path.join(projectDir, 'prototype', 'src', 'components', 'extracted');
  }

  if (!inputDir) {
    console.error('\x1b[31mError:\x1b[0m --input or --project is required');
    process.exit(1);
  }

  try {
    console.log(`\n\x1b[1mComponent Library Extractor\x1b[0m`);
    console.log(`Input: ${inputDir}`);

    const extractor = extractComponents(inputDir);

    console.log('');
    console.log(extractor.formatSummary());

    if (outputDir) {
      console.log(`\x1b[1mWriting to:\x1b[0m ${outputDir}`);
      const written = extractor.writeComponents(outputDir);
      console.log(`\n\x1b[32m✓ Wrote ${written.length} files:\x1b[0m`);
      for (const file of written) {
        console.log(`  ${path.basename(file)}`);
      }
    } else {
      console.log('\x1b[33mTip:\x1b[0m Use --output <dir> to generate component files');
    }

  } catch (error) {
    console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  ComponentExtractor,
  extractComponents,
  COMPONENT_PATTERNS
};
