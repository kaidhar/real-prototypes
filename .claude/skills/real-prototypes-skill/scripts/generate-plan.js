#!/usr/bin/env node

/**
 * Plan Generator Module
 *
 * Generates implementation plans with exact file paths, injection points,
 * validation checkpoints, and mode specifications (EXTEND vs CREATE).
 *
 * Features:
 * - Analyzes existing prototype structure
 * - Identifies files to modify vs create
 * - Specifies exact injection points with selectors
 * - Includes validation checkpoints
 * - Generates dependency graph for tasks
 *
 * Usage:
 *   node generate-plan.js --project <name> --feature <feature-description>
 */

const fs = require('fs');
const path = require('path');
const { detectPrototype } = require('./detect-prototype');
const { ProjectStructure } = require('./project-structure');

class PlanGenerator {
  constructor(projectDir, options = {}) {
    this.projectDir = path.resolve(projectDir);
    this.options = {
      featureDescription: '',
      targetPage: null,
      ...options
    };

    this.refsDir = path.join(this.projectDir, 'references');
    this.protoDir = path.join(this.projectDir, 'prototype');

    this.prototypeInfo = null;
    this.manifest = null;
    this.designTokens = null;
    this.plan = null;
  }

  /**
   * Validate that required captures exist - MANDATORY before generating plan
   * @throws {Error} if captures are missing
   */
  validateCapturesExist() {
    const errors = [];

    // Check design tokens
    const tokensPath = path.join(this.refsDir, 'design-tokens.json');
    if (!fs.existsSync(tokensPath)) {
      errors.push('design-tokens.json missing');
    }

    // Check manifest
    const manifestPath = path.join(this.refsDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      errors.push('manifest.json missing');
    }

    // Check screenshots
    const screenshotsDir = path.join(this.refsDir, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      errors.push('screenshots/ directory missing');
    } else {
      const screenshots = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));
      if (screenshots.length === 0) {
        errors.push('No screenshots found in screenshots/');
      }
    }

    if (errors.length > 0) {
      const projectName = path.basename(this.projectDir);
      throw new Error(
        `CAPTURES REQUIRED - Cannot generate plan without captures\n\n` +
        `Missing:\n  - ${errors.join('\n  - ')}\n\n` +
        `You MUST capture the existing platform first:\n` +
        `  node cli.js capture --project ${projectName} --url <PLATFORM_URL>\n\n` +
        `This skill is for adding features to EXISTING platforms.\n` +
        `It does NOT create new designs from scratch.`
      );
    }

    return true;
  }

  /**
   * Load project data
   */
  loadProjectData() {
    // Load manifest
    const manifestPath = path.join(this.refsDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      this.manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    }

    // Load design tokens
    const tokensPath = path.join(this.refsDir, 'design-tokens.json');
    if (fs.existsSync(tokensPath)) {
      this.designTokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    }

    // Detect prototype
    if (fs.existsSync(this.protoDir)) {
      this.prototypeInfo = detectPrototype(this.protoDir);
    }

    return this;
  }

  /**
   * Generate implementation plan
   */
  generate() {
    // MANDATORY: Validate captures exist before generating plan
    this.validateCapturesExist();

    this.loadProjectData();

    const mode = this.determineMode();
    const tasks = this.generateTasks();
    const validation = this.generateValidation();
    const dependencies = this.analyzeDependencies(tasks);

    this.plan = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      feature: this.options.featureDescription,
      mode,
      project: {
        path: this.projectDir,
        referencesPath: this.refsDir,
        prototypePath: this.protoDir
      },
      existingPrototype: this.prototypeInfo?.exists ? {
        framework: this.prototypeInfo.framework,
        frameworkVersion: this.prototypeInfo.frameworkVersion,
        styling: this.prototypeInfo.styling,
        pagesCount: this.prototypeInfo.pages?.length || 0,
        componentsCount: this.prototypeInfo.components?.length || 0
      } : null,
      designSystem: this.designTokens ? {
        primaryColor: this.designTokens.colors?.primary,
        totalColors: this.designTokens.totalColorsFound,
        hasTokens: true
      } : null,
      tasks,
      dependencies,
      validation,
      criticalRules: this.getCriticalRules()
    };

    return this.plan;
  }

  /**
   * Determine mode: EXTEND_EXISTING or CREATE_NEW
   */
  determineMode() {
    if (this.prototypeInfo?.exists) {
      return {
        type: 'EXTEND_EXISTING',
        reason: 'Existing prototype detected',
        recommendation: 'Modify existing files instead of creating new ones',
        existingFiles: this.prototypeInfo.pages?.length || 0
      };
    }

    return {
      type: 'CREATE_NEW',
      reason: 'No existing prototype found',
      recommendation: 'Create new prototype structure'
    };
  }

  /**
   * Generate task list
   */
  generateTasks() {
    const tasks = [];
    let taskId = 1;

    // Task 1: Setup/Verification
    tasks.push({
      id: taskId++,
      phase: 'setup',
      action: 'verify',
      description: 'Verify captured assets exist',
      checks: [
        {
          item: 'design-tokens.json',
          path: path.join(this.refsDir, 'design-tokens.json'),
          required: true,
          exists: this.designTokens !== null
        },
        {
          item: 'manifest.json',
          path: path.join(this.refsDir, 'manifest.json'),
          required: true,
          exists: this.manifest !== null
        },
        {
          item: 'screenshots',
          path: path.join(this.refsDir, 'screenshots'),
          required: true,
          exists: fs.existsSync(path.join(this.refsDir, 'screenshots'))
        }
      ]
    });

    // Mode-specific tasks
    if (this.plan?.mode?.type === 'EXTEND_EXISTING' || this.prototypeInfo?.exists) {
      tasks.push(...this.generateExtendTasks(taskId));
    } else {
      tasks.push(...this.generateCreateTasks(taskId));
    }

    return tasks;
  }

  /**
   * Generate tasks for extending existing prototype
   */
  generateExtendTasks(startId) {
    const tasks = [];
    let taskId = startId;

    // Task: Identify target file
    const targetPage = this.options.targetPage || this.findBestTargetPage();

    if (targetPage) {
      tasks.push({
        id: taskId++,
        phase: 'analysis',
        action: 'identify_target',
        description: 'Identify target file for modification',
        target: {
          file: targetPage.file,
          route: targetPage.route,
          name: targetPage.name
        }
      });

      // Task: Read and analyze existing file
      tasks.push({
        id: taskId++,
        phase: 'analysis',
        action: 'analyze_structure',
        description: 'Analyze existing file structure',
        file: targetPage.file,
        outputs: ['component_tree', 'existing_imports', 'injection_points']
      });

      // Task: Create new component
      tasks.push({
        id: taskId++,
        phase: 'implementation',
        action: 'create_component',
        description: `Create new component for ${this.options.featureDescription}`,
        output: {
          directory: path.join(this.protoDir, 'src', 'components'),
          suggestedName: this.generateComponentName(this.options.featureDescription),
          template: 'Use design tokens from design-tokens.json'
        },
        constraints: [
          'Use ONLY colors from design-tokens.json',
          'Match existing styling approach',
          'Follow existing naming conventions'
        ]
      });

      // Task: Inject component
      tasks.push({
        id: taskId++,
        phase: 'implementation',
        action: 'inject_component',
        description: 'Inject component into existing page',
        injection: {
          targetFile: targetPage.file,
          method: 'insert-after',
          selector: this.suggestInjectionPoint(targetPage),
          preserveExisting: true,
          addImport: true
        }
      });
    }

    // Task: Validate colors
    tasks.push({
      id: taskId++,
      phase: 'validation',
      action: 'validate_colors',
      description: 'Validate all colors against design tokens',
      command: `node cli.js validate-colors --project ${path.basename(this.projectDir)}`
    });

    // Task: Visual comparison
    tasks.push({
      id: taskId++,
      phase: 'validation',
      action: 'visual_diff',
      description: 'Compare generated output with reference',
      command: `node cli.js visual-diff --project ${path.basename(this.projectDir)} --page ${this.options.targetPage || 'homepage'}`,
      threshold: 95
    });

    return tasks;
  }

  /**
   * Generate tasks for creating new prototype
   */
  generateCreateTasks(startId) {
    const tasks = [];
    let taskId = startId;

    // Task: Initialize Next.js project
    tasks.push({
      id: taskId++,
      phase: 'setup',
      action: 'initialize_project',
      description: 'Initialize Next.js project',
      command: 'npx create-next-app@latest --typescript --tailwind --eslint --app --src-dir',
      output: this.protoDir
    });

    // Task: Configure Tailwind with design tokens
    tasks.push({
      id: taskId++,
      phase: 'setup',
      action: 'configure_styling',
      description: 'Configure Tailwind with design tokens',
      note: 'Use inline styles for colors, not Tailwind color classes'
    });

    // Task: Extract component library
    tasks.push({
      id: taskId++,
      phase: 'implementation',
      action: 'extract_components',
      description: 'Extract reusable components from captured HTML',
      command: `node cli.js extract-components --project ${path.basename(this.projectDir)}`
    });

    // Task: Convert HTML to React
    if (this.manifest?.pages) {
      for (const page of this.manifest.pages.slice(0, 5)) {
        tasks.push({
          id: taskId++,
          phase: 'implementation',
          action: 'convert_page',
          description: `Convert ${page.name} to React`,
          input: path.join(this.refsDir, 'html', `${page.name}.html`),
          output: path.join(this.protoDir, 'src', 'app', page.route || page.name, 'page.tsx')
        });
      }
    }

    // Task: Final validation
    tasks.push({
      id: taskId++,
      phase: 'validation',
      action: 'validate_all',
      description: 'Run all validations',
      command: `node cli.js validate --project ${path.basename(this.projectDir)} --phase post-gen`
    });

    return tasks;
  }

  /**
   * Find best target page for modification
   */
  findBestTargetPage() {
    if (!this.prototypeInfo?.pages?.length) return null;

    // Prefer pages matching feature description
    const featureWords = this.options.featureDescription.toLowerCase().split(/\s+/);

    for (const page of this.prototypeInfo.pages) {
      const pageName = page.name.toLowerCase();
      for (const word of featureWords) {
        if (pageName.includes(word)) {
          return page;
        }
      }
    }

    // Default to first page
    return this.prototypeInfo.pages[0];
  }

  /**
   * Suggest injection point for component
   */
  suggestInjectionPoint(targetPage) {
    // Common injection points
    const suggestions = [
      'Header',
      'header',
      '.header',
      '.page-header',
      'main',
      '.main-content',
      '.content'
    ];

    return {
      suggestions,
      recommended: suggestions[0],
      note: 'Verify injection point by reading the target file first'
    };
  }

  /**
   * Generate component name from feature description
   */
  generateComponentName(description) {
    const words = description
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3);

    return words
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Analyze task dependencies
   */
  analyzeDependencies(tasks) {
    const dependencies = {};

    for (const task of tasks) {
      dependencies[task.id] = {
        blockedBy: [],
        blocks: []
      };

      // Setup tasks block all others
      if (task.phase === 'setup') {
        for (const otherTask of tasks) {
          if (otherTask.phase !== 'setup' && otherTask.id !== task.id) {
            dependencies[task.id].blocks.push(otherTask.id);
          }
        }
      }

      // Analysis blocks implementation
      if (task.phase === 'analysis') {
        for (const otherTask of tasks) {
          if (otherTask.phase === 'implementation') {
            dependencies[task.id].blocks.push(otherTask.id);
            dependencies[otherTask.id] = dependencies[otherTask.id] || { blockedBy: [], blocks: [] };
            dependencies[otherTask.id].blockedBy.push(task.id);
          }
        }
      }

      // Implementation blocks validation
      if (task.phase === 'implementation') {
        for (const otherTask of tasks) {
          if (otherTask.phase === 'validation') {
            dependencies[task.id].blocks.push(otherTask.id);
            dependencies[otherTask.id] = dependencies[otherTask.id] || { blockedBy: [], blocks: [] };
            dependencies[otherTask.id].blockedBy.push(task.id);
          }
        }
      }
    }

    return dependencies;
  }

  /**
   * Generate validation rules
   */
  generateValidation() {
    return {
      preGeneration: [
        {
          check: 'design_tokens_exist',
          path: path.join(this.refsDir, 'design-tokens.json'),
          required: true
        },
        {
          check: 'manifest_exists',
          path: path.join(this.refsDir, 'manifest.json'),
          required: true
        },
        {
          check: 'screenshots_exist',
          path: path.join(this.refsDir, 'screenshots'),
          required: true
        }
      ],
      postGeneration: [
        {
          check: 'color_validation',
          command: 'validate-colors',
          description: 'All colors must be from design-tokens.json',
          blocking: true
        },
        {
          check: 'visual_diff',
          minSimilarity: 95,
          description: 'Visual output must match reference >95%',
          blocking: false
        },
        {
          check: 'no_tailwind_defaults',
          description: 'No Tailwind default colors (bg-blue-500, etc.)',
          blocking: true
        }
      ]
    };
  }

  /**
   * Get critical rules
   */
  getCriticalRules() {
    return {
      never: [
        'Create new design systems or color schemes',
        'Deviate from captured design tokens',
        'Use colors not in design-tokens.json',
        'Create new prototype if one exists',
        'Replace existing pages - always extend',
        'Introduce new styling paradigms (styled-components if using CSS modules, etc.)'
      ],
      always: [
        'Search for existing prototype first',
        'Parse captured HTML for exact structure',
        'Validate colors against design-tokens.json',
        'Use screenshot for visual reference',
        'Preserve 100% of existing functionality',
        'Match framework and styling of existing code',
        'Insert at exact location specified in plan',
        'Verify visual output matches reference >95%'
      ]
    };
  }

  /**
   * Write plan to file
   */
  writePlan(outputPath) {
    const plan = this.generate();
    const content = JSON.stringify(plan, null, 2);

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, content);
    return outputPath;
  }

  /**
   * Format plan for CLI output
   */
  formatPlan() {
    const plan = this.plan || this.generate();
    const lines = [];

    // Header
    lines.push('\x1b[1m═══════════════════════════════════════════════════════════\x1b[0m');
    lines.push('\x1b[1m                    IMPLEMENTATION PLAN                      \x1b[0m');
    lines.push('\x1b[1m═══════════════════════════════════════════════════════════\x1b[0m');
    lines.push('');

    // Project Paths - CRITICAL for Claude to know where to write files
    lines.push('\x1b[1mProject Paths:\x1b[0m');
    lines.push(`  \x1b[33mPrototype Directory:\x1b[0m ${plan.project.prototypePath}`);
    lines.push(`  References: ${plan.project.referencesPath}`);
    lines.push('');

    // Mode
    const modeColor = plan.mode.type === 'EXTEND_EXISTING' ? '\x1b[33m' : '\x1b[32m';
    lines.push(`\x1b[1mMode:\x1b[0m ${modeColor}${plan.mode.type}\x1b[0m`);
    lines.push(`  ${plan.mode.recommendation}`);
    lines.push('');

    // Feature
    if (plan.feature) {
      lines.push(`\x1b[1mFeature:\x1b[0m ${plan.feature}`);
      lines.push('');
    }

    // Existing Prototype
    if (plan.existingPrototype) {
      lines.push('\x1b[1mExisting Prototype:\x1b[0m');
      lines.push(`  Framework: ${plan.existingPrototype.framework}`);
      lines.push(`  Styling: ${plan.existingPrototype.styling.join(', ')}`);
      lines.push(`  Pages: ${plan.existingPrototype.pagesCount}`);
      lines.push(`  Components: ${plan.existingPrototype.componentsCount}`);
      lines.push('');
    }

    // Tasks
    lines.push('\x1b[1mTasks:\x1b[0m');
    for (const task of plan.tasks) {
      const phaseColors = {
        setup: '\x1b[36m',
        analysis: '\x1b[35m',
        implementation: '\x1b[33m',
        validation: '\x1b[32m'
      };
      const color = phaseColors[task.phase] || '';
      lines.push(`  ${color}[${task.phase.toUpperCase()}]\x1b[0m ${task.id}. ${task.description}`);

      if (task.target) {
        lines.push(`     Target: ${task.target.file}`);
      }
      if (task.injection) {
        lines.push(`     Inject: ${task.injection.method} ${task.injection.selector?.recommended || ''}`);
      }
      if (task.command) {
        lines.push(`     Command: ${task.command}`);
      }
    }
    lines.push('');

    // Validation
    lines.push('\x1b[1mValidation Checkpoints:\x1b[0m');
    for (const check of plan.validation.postGeneration) {
      const status = check.blocking ? '\x1b[31m[BLOCKING]\x1b[0m' : '\x1b[33m[WARNING]\x1b[0m';
      lines.push(`  ${status} ${check.description}`);
    }
    lines.push('');

    // Critical Rules
    lines.push('\x1b[1mCritical Rules:\x1b[0m');
    lines.push('  \x1b[31mNEVER:\x1b[0m');
    for (const rule of plan.criticalRules.never.slice(0, 3)) {
      lines.push(`    ✗ ${rule}`);
    }
    lines.push('  \x1b[32mALWAYS:\x1b[0m');
    for (const rule of plan.criticalRules.always.slice(0, 3)) {
      lines.push(`    ✓ ${rule}`);
    }

    return lines.join('\n');
  }
}

/**
 * Generate plan for project
 */
function generatePlan(projectDir, options = {}) {
  const generator = new PlanGenerator(projectDir, options);
  return generator.generate();
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  let projectName = null;
  let projectDir = null;
  let feature = '';
  let targetPage = null;
  let outputPath = null;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project':
        projectName = args[++i];
        break;
      case '--path':
        projectDir = args[++i];
        break;
      case '--feature':
        feature = args[++i];
        break;
      case '--target':
        targetPage = args[++i];
        break;
      case '--output':
      case '-o':
        outputPath = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node generate-plan.js [options]

Options:
  --project <name>     Project name
  --path <path>        Project directory path
  --feature <desc>     Feature description
  --target <page>      Target page for modification
  --output, -o <path>  Output path for plan JSON
  --help, -h           Show this help

Examples:
  node generate-plan.js --project my-app --feature "Add health score widget"
  node generate-plan.js --path ./projects/my-app --feature "User profile section" --target accounts
        `);
        process.exit(0);
    }
  }

  // Handle project-based path
  if (projectName && !projectDir) {
    const SKILL_DIR = path.dirname(__dirname);
    const PROJECTS_DIR = path.resolve(SKILL_DIR, '../../../projects');
    projectDir = path.join(PROJECTS_DIR, projectName);
  }

  if (!projectDir) {
    console.error('\x1b[31mError:\x1b[0m --project or --path is required');
    process.exit(1);
  }

  try {
    const generator = new PlanGenerator(projectDir, {
      featureDescription: feature,
      targetPage
    });

    const plan = generator.generate();

    console.log(generator.formatPlan());

    if (outputPath) {
      generator.writePlan(outputPath);
      console.log(`\n\x1b[32m✓ Plan written to: ${outputPath}\x1b[0m`);
    }

  } catch (error) {
    console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  PlanGenerator,
  generatePlan
};
