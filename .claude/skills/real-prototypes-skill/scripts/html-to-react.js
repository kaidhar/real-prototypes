#!/usr/bin/env node

/**
 * HTML-to-React Conversion Pipeline
 *
 * Converts captured HTML files into React/JSX components while
 * preserving exact class names, styles, and structure.
 *
 * Features:
 * - Parses HTML using jsdom
 * - Extracts component tree structure
 * - Converts HTML attributes to JSX (class→className, for→htmlFor)
 * - Preserves inline styles as objects
 * - Identifies semantic component boundaries
 * - Generates React component files
 *
 * Usage:
 *   node html-to-react.js --project <name> --page <page>
 *   node html-to-react.js --input ./html/page.html --output ./components
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// HTML attributes that need transformation for JSX
const JSX_ATTR_MAP = {
  'class': 'className',
  'for': 'htmlFor',
  'tabindex': 'tabIndex',
  'readonly': 'readOnly',
  'maxlength': 'maxLength',
  'minlength': 'minLength',
  'cellpadding': 'cellPadding',
  'cellspacing': 'cellSpacing',
  'rowspan': 'rowSpan',
  'colspan': 'colSpan',
  'usemap': 'useMap',
  'frameborder': 'frameBorder',
  'contenteditable': 'contentEditable',
  'crossorigin': 'crossOrigin',
  'datetime': 'dateTime',
  'enctype': 'encType',
  'formaction': 'formAction',
  'formenctype': 'formEncType',
  'formmethod': 'formMethod',
  'formnovalidate': 'formNoValidate',
  'formtarget': 'formTarget',
  'hreflang': 'hrefLang',
  'inputmode': 'inputMode',
  'srcdoc': 'srcDoc',
  'srcset': 'srcSet',
  'autocomplete': 'autoComplete',
  'autofocus': 'autoFocus',
  'autoplay': 'autoPlay'
};

// Self-closing tags in JSX
const SELF_CLOSING_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

// Tags to skip (scripts, etc.)
const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'link', 'meta']);

class HTMLToReactConverter {
  constructor(options = {}) {
    this.options = {
      preserveComments: false,
      generateTypeScript: true,
      componentPrefix: '',
      wrapWithFragment: true,
      extractComponents: true,
      minComponentDepth: 2,
      ...options
    };

    this.dom = null;
    this.document = null;
    this.extractedComponents = [];
    this.componentCounter = 0;
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
   * Parse inline style string to object
   */
  parseStyleString(styleStr) {
    if (!styleStr) return null;

    const styleObj = {};
    const rules = styleStr.split(';').filter(Boolean);

    for (const rule of rules) {
      const [property, value] = rule.split(':').map(s => s.trim());
      if (property && value) {
        // Convert CSS property to camelCase
        const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        styleObj[camelProperty] = value;
      }
    }

    return Object.keys(styleObj).length > 0 ? styleObj : null;
  }

  /**
   * Format style object as JSX string
   */
  formatStyleObject(styleObj) {
    if (!styleObj) return null;

    const entries = Object.entries(styleObj)
      .map(([key, value]) => {
        // Wrap string values in quotes, keep numbers as-is
        const formattedValue = typeof value === 'number' ? value : `"${value}"`;
        return `${key}: ${formattedValue}`;
      });

    return `{{ ${entries.join(', ')} }}`;
  }

  /**
   * Convert HTML element to JSX string
   */
  elementToJSX(element, indent = 0) {
    const indentStr = '  '.repeat(indent);

    // Handle text nodes
    if (element.nodeType === 3) { // TEXT_NODE
      const text = element.textContent.trim();
      if (!text) return '';
      // Escape JSX special characters
      return text
        .replace(/\{/g, '&#123;')
        .replace(/\}/g, '&#125;');
    }

    // Handle comment nodes
    if (element.nodeType === 8) { // COMMENT_NODE
      if (!this.options.preserveComments) return '';
      return `${indentStr}{/* ${element.textContent.trim()} */}`;
    }

    // Skip non-element nodes
    if (element.nodeType !== 1) return ''; // ELEMENT_NODE

    const tagName = element.tagName.toLowerCase();

    // Skip certain tags
    if (SKIP_TAGS.has(tagName)) return '';

    // Build attributes
    const attrs = this.buildAttributes(element);
    const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

    // Handle self-closing tags
    if (SELF_CLOSING_TAGS.has(tagName)) {
      return `${indentStr}<${tagName}${attrsStr} />`;
    }

    // Handle children
    const children = Array.from(element.childNodes)
      .map(child => this.elementToJSX(child, indent + 1))
      .filter(Boolean);

    // If no children
    if (children.length === 0) {
      // Check for text content
      const textContent = element.textContent.trim();
      if (textContent) {
        return `${indentStr}<${tagName}${attrsStr}>${textContent}</${tagName}>`;
      }
      return `${indentStr}<${tagName}${attrsStr} />`;
    }

    // If single text child
    if (children.length === 1 && !children[0].includes('\n') && children[0].length < 60) {
      return `${indentStr}<${tagName}${attrsStr}>${children[0].trim()}</${tagName}>`;
    }

    // Multi-line
    return [
      `${indentStr}<${tagName}${attrsStr}>`,
      ...children,
      `${indentStr}</${tagName}>`
    ].join('\n');
  }

  /**
   * Build JSX attributes from element
   */
  buildAttributes(element) {
    const attrs = [];

    for (const attr of element.attributes) {
      let name = attr.name.toLowerCase();
      let value = attr.value;

      // Skip event handlers
      if (name.startsWith('on')) continue;

      // Skip data attributes that look like framework-specific
      if (name.startsWith('data-react') || name.startsWith('data-v-')) continue;

      // Transform attribute name
      name = JSX_ATTR_MAP[name] || name;

      // Handle special attributes
      if (name === 'style') {
        const styleObj = this.parseStyleString(value);
        if (styleObj) {
          attrs.push(`style={${JSON.stringify(styleObj)}}`);
        }
        continue;
      }

      // Handle boolean attributes
      if (value === '' || value === name || value === 'true') {
        attrs.push(name);
        continue;
      }

      // Handle className (might have dynamic parts)
      if (name === 'className') {
        attrs.push(`className="${value}"`);
        continue;
      }

      // Regular attribute
      attrs.push(`${name}="${value}"`);
    }

    return attrs;
  }

  /**
   * Extract semantic component boundaries
   */
  extractComponentBoundaries() {
    const boundaries = [];

    // Look for semantic elements
    const semanticSelectors = [
      'header', 'nav', 'main', 'aside', 'footer', 'article', 'section',
      '[role="banner"]', '[role="navigation"]', '[role="main"]',
      '[role="complementary"]', '[role="contentinfo"]'
    ];

    for (const selector of semanticSelectors) {
      const elements = this.document.querySelectorAll(selector);
      for (const el of elements) {
        boundaries.push({
          type: el.tagName.toLowerCase(),
          role: el.getAttribute('role'),
          id: el.id,
          className: el.className,
          element: el,
          suggestedName: this.suggestComponentName(el)
        });
      }
    }

    // Also look for common class patterns
    const classPatterns = [
      { pattern: /header/i, name: 'Header' },
      { pattern: /nav(bar|igation)?/i, name: 'Navigation' },
      { pattern: /sidebar/i, name: 'Sidebar' },
      { pattern: /footer/i, name: 'Footer' },
      { pattern: /card/i, name: 'Card' },
      { pattern: /modal/i, name: 'Modal' },
      { pattern: /table/i, name: 'DataTable' },
      { pattern: /form/i, name: 'Form' },
      { pattern: /button/i, name: 'Button' },
      { pattern: /panel/i, name: 'Panel' },
      { pattern: /container/i, name: 'Container' }
    ];

    // Find elements by class patterns
    const allElements = this.document.querySelectorAll('*[class]');
    for (const el of allElements) {
      const className = el.className;
      if (typeof className !== 'string') continue;

      for (const { pattern, name } of classPatterns) {
        if (pattern.test(className)) {
          // Avoid duplicates
          const exists = boundaries.some(b =>
            b.element === el || (b.className === className && b.type === el.tagName.toLowerCase())
          );
          if (!exists) {
            boundaries.push({
              type: el.tagName.toLowerCase(),
              id: el.id,
              className: className,
              element: el,
              suggestedName: name
            });
          }
          break;
        }
      }
    }

    return boundaries;
  }

  /**
   * Suggest component name from element
   */
  suggestComponentName(element) {
    // Try ID first
    if (element.id) {
      return this.toPascalCase(element.id);
    }

    // Try main class
    const className = element.className;
    if (typeof className === 'string' && className) {
      const mainClass = className.split(' ')[0];
      return this.toPascalCase(mainClass);
    }

    // Try tag name
    const tagName = element.tagName.toLowerCase();
    const semanticMap = {
      'header': 'Header',
      'nav': 'Navigation',
      'main': 'MainContent',
      'aside': 'Sidebar',
      'footer': 'Footer',
      'article': 'Article',
      'section': 'Section'
    };

    return semanticMap[tagName] || `Component${++this.componentCounter}`;
  }

  /**
   * Convert string to PascalCase
   */
  toPascalCase(str) {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/^(.)/, c => c.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Convert full document body to JSX
   */
  convertBody() {
    const body = this.document.body;
    if (!body) return '';

    return this.elementToJSX(body, 0);
  }

  /**
   * Convert specific element to JSX
   */
  convertElement(selector) {
    const element = this.document.querySelector(selector);
    if (!element) return null;

    return this.elementToJSX(element, 0);
  }

  /**
   * Generate React component from element
   */
  generateComponent(element, componentName) {
    const jsx = this.elementToJSX(element, 2);
    const ext = this.options.generateTypeScript ? 'tsx' : 'jsx';
    const propsType = this.options.generateTypeScript ? ': React.FC' : '';

    const component = `import React from 'react';

export const ${componentName}${propsType} = () => {
  return (
${jsx}
  );
};

export default ${componentName};
`;

    return {
      name: componentName,
      filename: `${componentName}.${ext}`,
      content: component,
      jsx: jsx
    };
  }

  /**
   * Extract and generate all components
   */
  extractAllComponents() {
    const boundaries = this.extractComponentBoundaries();
    const components = [];

    for (const boundary of boundaries) {
      if (!boundary.element) continue;

      const componentName = boundary.suggestedName;
      const component = this.generateComponent(boundary.element, componentName);
      components.push(component);
    }

    return components;
  }

  /**
   * Generate page component that imports all extracted components
   */
  generatePageComponent(pageName, components) {
    const ext = this.options.generateTypeScript ? 'tsx' : 'jsx';
    const propsType = this.options.generateTypeScript ? ': React.FC' : '';

    const imports = components
      .map(c => `import { ${c.name} } from './${c.name}';`)
      .join('\n');

    const componentUsage = components
      .map(c => `      <${c.name} />`)
      .join('\n');

    const page = `import React from 'react';
${imports}

export const ${pageName}${propsType} = () => {
  return (
    <div>
${componentUsage}
    </div>
  );
};

export default ${pageName};
`;

    return {
      name: pageName,
      filename: `${pageName}.${ext}`,
      content: page
    };
  }

  /**
   * Get component tree structure
   */
  getComponentTree() {
    const body = this.document.body;
    if (!body) return null;

    const buildTree = (element, depth = 0) => {
      if (element.nodeType !== 1) return null;

      const tagName = element.tagName.toLowerCase();
      if (SKIP_TAGS.has(tagName)) return null;

      return {
        tag: tagName,
        id: element.id || null,
        className: typeof element.className === 'string' ? element.className : null,
        children: Array.from(element.children)
          .map(child => buildTree(child, depth + 1))
          .filter(Boolean)
      };
    };

    return buildTree(body);
  }
}

/**
 * Convert HTML file to React components
 */
function convertHTMLToReact(htmlPath, options = {}) {
  const converter = new HTMLToReactConverter(options);
  converter.loadFromFile(htmlPath);

  return {
    fullJSX: converter.convertBody(),
    components: converter.extractAllComponents(),
    tree: converter.getComponentTree(),
    boundaries: converter.extractComponentBoundaries()
  };
}

/**
 * Write components to output directory
 */
function writeComponents(components, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const written = [];

  for (const component of components) {
    const filePath = path.join(outputDir, component.filename);
    fs.writeFileSync(filePath, component.content);
    written.push(filePath);
  }

  return written;
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  let inputPath = null;
  let outputDir = null;
  let projectName = null;
  let pageName = null;
  let showTree = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
      case '-i':
        inputPath = args[++i];
        break;
      case '--output':
      case '-o':
        outputDir = args[++i];
        break;
      case '--project':
        projectName = args[++i];
        break;
      case '--page':
        pageName = args[++i];
        break;
      case '--tree':
        showTree = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node html-to-react.js [options]

Options:
  --input, -i <path>     Path to HTML file
  --output, -o <path>    Output directory for components
  --project <name>       Project name
  --page <name>          Page name (used with --project)
  --tree                 Show component tree only
  --help, -h             Show this help

Examples:
  node html-to-react.js --input ./html/page.html --output ./components
  node html-to-react.js --project my-app --page account-detail
  node html-to-react.js --input ./page.html --tree
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
    }

    outputDir = outputDir || path.join(projectDir, 'prototype', 'src', 'components', 'extracted');
  }

  if (!inputPath) {
    console.error('\x1b[31mError:\x1b[0m --input is required');
    process.exit(1);
  }

  try {
    console.log(`\n\x1b[1mHTML to React Converter\x1b[0m`);
    console.log(`Input: ${inputPath}`);

    const result = convertHTMLToReact(inputPath);

    if (showTree) {
      console.log(`\n\x1b[1mComponent Tree:\x1b[0m`);
      console.log(JSON.stringify(result.tree, null, 2));
      process.exit(0);
    }

    console.log(`\n\x1b[1mDetected Component Boundaries (${result.boundaries.length}):\x1b[0m`);
    for (const boundary of result.boundaries.slice(0, 10)) {
      console.log(`  ${boundary.suggestedName} (${boundary.type}${boundary.className ? '.' + boundary.className.split(' ')[0] : ''})`);
    }
    if (result.boundaries.length > 10) {
      console.log(`  ... and ${result.boundaries.length - 10} more`);
    }

    console.log(`\n\x1b[1mExtracted Components (${result.components.length}):\x1b[0m`);
    for (const component of result.components) {
      console.log(`  ${component.name} (${component.filename})`);
    }

    if (outputDir) {
      console.log(`\n\x1b[1mWriting to:\x1b[0m ${outputDir}`);
      const written = writeComponents(result.components, outputDir);
      console.log(`\x1b[32m✓ Wrote ${written.length} component files\x1b[0m`);

      for (const file of written) {
        console.log(`  ${path.basename(file)}`);
      }
    } else {
      console.log(`\n\x1b[33mTip:\x1b[0m Use --output <dir> to write component files`);
    }

  } catch (error) {
    console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  HTMLToReactConverter,
  convertHTMLToReact,
  writeComponents
};
