#!/usr/bin/env node

/**
 * Component Injection Module
 *
 * Injects new React components into existing files using AST manipulation.
 * Preserves existing code structure and formatting while adding new imports
 * and component usage at specified locations.
 *
 * Features:
 * - AST-based injection using Babel
 * - Multiple injection position options (before, after, replace, wrap)
 * - Import statement injection (preserves existing imports)
 * - Backup/rollback capability
 * - Selector-based injection points
 *
 * Usage:
 *   node inject-component.js --target ./page.tsx --component HealthScore --position "after:.header"
 *   node inject-component.js --project my-app --target src/app/accounts/page.tsx --component Card --position "after:Header"
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// Injection position types
const POSITION_TYPES = {
  BEFORE: 'before',
  AFTER: 'after',
  REPLACE: 'replace',
  WRAP: 'wrap',
  FIRST_CHILD: 'first-child',
  LAST_CHILD: 'last-child'
};

class ComponentInjector {
  constructor(options = {}) {
    this.options = {
      createBackup: true,
      preserveFormatting: true,
      ...options
    };

    this.targetFile = null;
    this.originalCode = null;
    this.ast = null;
    this.injectionResult = null;
  }

  /**
   * Load target file
   */
  loadFile(filePath) {
    this.targetFile = path.resolve(filePath);

    if (!fs.existsSync(this.targetFile)) {
      throw new Error(`Target file not found: ${this.targetFile}`);
    }

    this.originalCode = fs.readFileSync(this.targetFile, 'utf-8');
    this.parseAST();

    return this;
  }

  /**
   * Parse code to AST
   */
  parseAST() {
    const isTypeScript = this.targetFile.endsWith('.tsx') || this.targetFile.endsWith('.ts');

    this.ast = parser.parse(this.originalCode, {
      sourceType: 'module',
      plugins: [
        'jsx',
        isTypeScript ? 'typescript' : 'flow',
        'classProperties',
        'decorators-legacy',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'dynamicImport',
        'optionalChaining',
        'nullishCoalescingOperator'
      ]
    });

    return this;
  }

  /**
   * Create backup of original file
   */
  createBackup() {
    if (!this.options.createBackup) return null;

    const backupPath = this.targetFile + '.backup';
    fs.writeFileSync(backupPath, this.originalCode);
    return backupPath;
  }

  /**
   * Restore from backup
   */
  restoreBackup() {
    const backupPath = this.targetFile + '.backup';
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, this.targetFile);
      return true;
    }
    return false;
  }

  /**
   * Add import statement for component
   */
  addImport(componentName, importPath, isDefault = false) {
    const importDeclaration = isDefault
      ? t.importDeclaration(
          [t.importDefaultSpecifier(t.identifier(componentName))],
          t.stringLiteral(importPath)
        )
      : t.importDeclaration(
          [t.importSpecifier(t.identifier(componentName), t.identifier(componentName))],
          t.stringLiteral(importPath)
        );

    // Find the last import statement
    let lastImportIndex = -1;
    for (let i = 0; i < this.ast.program.body.length; i++) {
      if (t.isImportDeclaration(this.ast.program.body[i])) {
        lastImportIndex = i;
      }
    }

    // Check if import already exists
    const importExists = this.ast.program.body.some(node => {
      if (!t.isImportDeclaration(node)) return false;
      if (node.source.value !== importPath) return false;
      return node.specifiers.some(spec => {
        if (t.isImportSpecifier(spec)) {
          return spec.imported.name === componentName;
        }
        if (t.isImportDefaultSpecifier(spec)) {
          return spec.local.name === componentName;
        }
        return false;
      });
    });

    if (!importExists) {
      // Insert after last import or at the beginning
      const insertIndex = lastImportIndex >= 0 ? lastImportIndex + 1 : 0;
      this.ast.program.body.splice(insertIndex, 0, importDeclaration);
    }

    return this;
  }

  /**
   * Find JSX element by selector
   * Supports: component name, className, id
   */
  findJSXElement(selector) {
    let found = null;

    const selectorType = this.parseSelector(selector);

    traverse(this.ast, {
      JSXElement(path) {
        if (found) return;

        const openingElement = path.node.openingElement;
        const elementName = openingElement.name.name ||
          (openingElement.name.object && openingElement.name.property ?
            `${openingElement.name.object.name}.${openingElement.name.property.name}` : null);

        // Match by component name
        if (selectorType.type === 'component' && elementName === selectorType.value) {
          found = path;
          return;
        }

        // Match by className
        if (selectorType.type === 'class') {
          const classAttr = openingElement.attributes.find(attr =>
            t.isJSXAttribute(attr) && attr.name.name === 'className'
          );
          if (classAttr && t.isStringLiteral(classAttr.value)) {
            const classes = classAttr.value.value.split(' ');
            if (classes.includes(selectorType.value)) {
              found = path;
              return;
            }
          }
        }

        // Match by id
        if (selectorType.type === 'id') {
          const idAttr = openingElement.attributes.find(attr =>
            t.isJSXAttribute(attr) && attr.name.name === 'id'
          );
          if (idAttr && t.isStringLiteral(idAttr.value) && idAttr.value.value === selectorType.value) {
            found = path;
            return;
          }
        }
      }
    });

    return found;
  }

  /**
   * Parse selector string
   */
  parseSelector(selector) {
    if (selector.startsWith('.')) {
      return { type: 'class', value: selector.substring(1) };
    }
    if (selector.startsWith('#')) {
      return { type: 'id', value: selector.substring(1) };
    }
    return { type: 'component', value: selector };
  }

  /**
   * Create JSX element for component
   */
  createJSXElement(componentName, props = {}) {
    const attributes = Object.entries(props).map(([key, value]) => {
      if (typeof value === 'boolean') {
        return value ? t.jsxAttribute(t.jsxIdentifier(key)) : null;
      }
      if (typeof value === 'string') {
        return t.jsxAttribute(t.jsxIdentifier(key), t.stringLiteral(value));
      }
      return t.jsxAttribute(
        t.jsxIdentifier(key),
        t.jsxExpressionContainer(t.identifier(String(value)))
      );
    }).filter(Boolean);

    return t.jsxElement(
      t.jsxOpeningElement(
        t.jsxIdentifier(componentName),
        attributes,
        true // self-closing
      ),
      null,
      [],
      true
    );
  }

  /**
   * Inject component at position relative to selector
   */
  injectComponent(componentName, selector, position = POSITION_TYPES.AFTER, props = {}) {
    const targetPath = this.findJSXElement(selector);

    if (!targetPath) {
      throw new Error(`Could not find element matching selector: ${selector}`);
    }

    const newElement = this.createJSXElement(componentName, props);

    switch (position) {
      case POSITION_TYPES.BEFORE:
        this.insertBefore(targetPath, newElement);
        break;
      case POSITION_TYPES.AFTER:
        this.insertAfter(targetPath, newElement);
        break;
      case POSITION_TYPES.REPLACE:
        targetPath.replaceWith(newElement);
        break;
      case POSITION_TYPES.WRAP:
        this.wrapElement(targetPath, componentName, props);
        break;
      case POSITION_TYPES.FIRST_CHILD:
        this.insertFirstChild(targetPath, newElement);
        break;
      case POSITION_TYPES.LAST_CHILD:
        this.insertLastChild(targetPath, newElement);
        break;
      default:
        throw new Error(`Unknown position type: ${position}`);
    }

    this.injectionResult = {
      componentName,
      selector,
      position,
      success: true
    };

    return this;
  }

  /**
   * Insert element before target
   */
  insertBefore(targetPath, newElement) {
    const parent = targetPath.parentPath;
    if (t.isJSXElement(parent.node) || t.isJSXFragment(parent.node)) {
      const children = parent.node.children;
      const index = children.indexOf(targetPath.node);
      if (index !== -1) {
        children.splice(index, 0, newElement, t.jsxText('\n'));
      }
    } else if (targetPath.inList) {
      targetPath.insertBefore(newElement);
    }
  }

  /**
   * Insert element after target
   */
  insertAfter(targetPath, newElement) {
    const parent = targetPath.parentPath;
    if (t.isJSXElement(parent.node) || t.isJSXFragment(parent.node)) {
      const children = parent.node.children;
      const index = children.indexOf(targetPath.node);
      if (index !== -1) {
        children.splice(index + 1, 0, t.jsxText('\n'), newElement);
      }
    } else if (targetPath.inList) {
      targetPath.insertAfter(newElement);
    }
  }

  /**
   * Wrap element with new component
   */
  wrapElement(targetPath, componentName, props = {}) {
    const originalElement = t.cloneNode(targetPath.node, true);

    const attributes = Object.entries(props).map(([key, value]) => {
      if (typeof value === 'string') {
        return t.jsxAttribute(t.jsxIdentifier(key), t.stringLiteral(value));
      }
      return t.jsxAttribute(
        t.jsxIdentifier(key),
        t.jsxExpressionContainer(t.identifier(String(value)))
      );
    });

    const wrapperElement = t.jsxElement(
      t.jsxOpeningElement(t.jsxIdentifier(componentName), attributes, false),
      t.jsxClosingElement(t.jsxIdentifier(componentName)),
      [t.jsxText('\n'), originalElement, t.jsxText('\n')],
      false
    );

    targetPath.replaceWith(wrapperElement);
  }

  /**
   * Insert as first child
   */
  insertFirstChild(targetPath, newElement) {
    if (t.isJSXElement(targetPath.node)) {
      targetPath.node.children.unshift(t.jsxText('\n'), newElement);
    }
  }

  /**
   * Insert as last child
   */
  insertLastChild(targetPath, newElement) {
    if (t.isJSXElement(targetPath.node)) {
      targetPath.node.children.push(newElement, t.jsxText('\n'));
    }
  }

  /**
   * Generate code from AST
   */
  generateCode() {
    const output = generate(this.ast, {
      retainLines: this.options.preserveFormatting,
      compact: false,
      jsescapeOption: { minimal: true }
    });

    return output.code;
  }

  /**
   * Write modified code to file
   */
  writeFile() {
    if (this.options.createBackup) {
      this.createBackup();
    }

    const newCode = this.generateCode();
    fs.writeFileSync(this.targetFile, newCode);

    return this.targetFile;
  }

  /**
   * Get diff between original and modified code
   */
  getDiff() {
    const newCode = this.generateCode();
    const originalLines = this.originalCode.split('\n');
    const newLines = newCode.split('\n');

    const diff = [];
    const maxLines = Math.max(originalLines.length, newLines.length);

    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const newLine = newLines[i] || '';

      if (originalLine !== newLine) {
        if (originalLine && !newLine) {
          diff.push({ line: i + 1, type: 'removed', content: originalLine });
        } else if (!originalLine && newLine) {
          diff.push({ line: i + 1, type: 'added', content: newLine });
        } else {
          diff.push({ line: i + 1, type: 'modified', original: originalLine, new: newLine });
        }
      }
    }

    return diff;
  }
}

/**
 * Inject component into file
 */
function injectComponent(targetFile, componentName, importPath, selector, position, props = {}) {
  const injector = new ComponentInjector();

  injector.loadFile(targetFile);
  injector.addImport(componentName, importPath);
  injector.injectComponent(componentName, selector, position, props);

  return {
    injector,
    code: injector.generateCode(),
    diff: injector.getDiff(),
    result: injector.injectionResult
  };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  let targetFile = null;
  let componentName = null;
  let importPath = null;
  let selector = null;
  let position = POSITION_TYPES.AFTER;
  let projectName = null;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--target':
      case '-t':
        targetFile = args[++i];
        break;
      case '--component':
      case '-c':
        componentName = args[++i];
        break;
      case '--import':
      case '-i':
        importPath = args[++i];
        break;
      case '--position':
      case '-p':
        const posStr = args[++i];
        // Parse position string like "after:.header" or "before:Header"
        const [pos, sel] = posStr.includes(':') ? posStr.split(':') : ['after', posStr];
        position = pos;
        selector = sel;
        break;
      case '--project':
        projectName = args[++i];
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node inject-component.js [options]

Options:
  --target, -t <path>      Target file to modify
  --component, -c <name>   Component name to inject
  --import, -i <path>      Import path for component
  --position, -p <pos>     Position string (e.g., "after:.header", "before:Header")
  --project <name>         Project name
  --dry-run                Show changes without writing
  --help, -h               Show this help

Position formats:
  after:<selector>         Insert after matching element
  before:<selector>        Insert before matching element
  replace:<selector>       Replace matching element
  wrap:<selector>          Wrap matching element
  first-child:<selector>   Insert as first child
  last-child:<selector>    Insert as last child

Selectors:
  ComponentName            Match by React component name
  .className               Match by CSS class
  #id                      Match by element id

Examples:
  node inject-component.js \\
    --target src/app/page.tsx \\
    --component HealthScore \\
    --import "@/components/HealthScore" \\
    --position "after:Header"

  node inject-component.js \\
    --target src/app/accounts/page.tsx \\
    --component DataCard \\
    --import "./DataCard" \\
    --position "last-child:.main-content" \\
    --dry-run
        `);
        process.exit(0);
    }
  }

  // Handle project-based paths
  if (projectName && targetFile) {
    const SKILL_DIR = path.dirname(__dirname);
    const PROJECTS_DIR = path.resolve(SKILL_DIR, '../../../projects');
    targetFile = path.join(PROJECTS_DIR, projectName, 'prototype', targetFile);
  }

  // Set default import path if not specified
  if (!importPath && componentName) {
    importPath = `@/components/${componentName}`;
  }

  // Validation
  if (!targetFile || !componentName || !selector) {
    console.error('\x1b[31mError:\x1b[0m --target, --component, and --position (with selector) are required');
    process.exit(1);
  }

  try {
    console.log(`\n\x1b[1mComponent Injection\x1b[0m`);
    console.log(`Target: ${targetFile}`);
    console.log(`Component: ${componentName}`);
    console.log(`Import: ${importPath}`);
    console.log(`Position: ${position}`);
    console.log(`Selector: ${selector}`);
    console.log('');

    const result = injectComponent(targetFile, componentName, importPath, selector, position);

    // Show diff
    if (result.diff.length > 0) {
      console.log('\x1b[1mChanges:\x1b[0m');
      for (const change of result.diff.slice(0, 20)) {
        if (change.type === 'added') {
          console.log(`\x1b[32m+ Line ${change.line}: ${change.content}\x1b[0m`);
        } else if (change.type === 'removed') {
          console.log(`\x1b[31m- Line ${change.line}: ${change.content}\x1b[0m`);
        } else if (change.type === 'modified') {
          console.log(`\x1b[33m~ Line ${change.line}:\x1b[0m`);
          console.log(`  \x1b[31m- ${change.original}\x1b[0m`);
          console.log(`  \x1b[32m+ ${change.new}\x1b[0m`);
        }
      }
      if (result.diff.length > 20) {
        console.log(`... and ${result.diff.length - 20} more changes`);
      }
    }

    if (dryRun) {
      console.log('\n\x1b[33mDry run - no changes written\x1b[0m');
    } else {
      result.injector.writeFile();
      console.log('\n\x1b[32m✓ Changes written successfully\x1b[0m');
      console.log(`Backup: ${targetFile}.backup`);
    }

  } catch (error) {
    console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  ComponentInjector,
  injectComponent,
  POSITION_TYPES
};
