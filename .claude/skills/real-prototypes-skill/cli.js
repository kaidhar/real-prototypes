#!/usr/bin/env node

/**
 * Platform Prototype CLI
 *
 * Enterprise-grade tool for capturing web platforms and generating prototypes.
 *
 * Commands:
 *   capture   - Capture a web platform (screenshots, HTML, design tokens)
 *   validate  - Validate capture or prototype
 *   generate  - Generate prototype from capture
 *   pipeline  - Run full capture-validate-generate pipeline
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check for required dependencies
function checkDependencies() {
  const required = ['jsdom'];
  const missing = [];

  for (const dep of required) {
    try {
      require.resolve(dep);
    } catch (e) {
      missing.push(dep);
    }
  }

  if (missing.length > 0) {
    console.log(`
\x1b[31m════════════════════════════════════════════════════════════\x1b[0m
\x1b[31m  MISSING DEPENDENCIES\x1b[0m
\x1b[31m════════════════════════════════════════════════════════════\x1b[0m

The following required packages are not installed:
  ${missing.join(', ')}

\x1b[1mTo fix, run:\x1b[0m
  cd ${__dirname} && npm install

\x1b[1mOr reinstall the skill:\x1b[0m
  npx real-prototypes-skill@latest --force
`);
    process.exit(1);
  }
}

// Run dependency check before anything else
checkDependencies();

const SKILL_DIR = __dirname;
const PROJECTS_DIR = path.resolve(SKILL_DIR, '../../../projects');
const VERSION = '1.5.0';

/**
 * Cross-platform browser opening
 */
function openBrowser(url) {
  const commands = {
    win32: `start "" "${url}"`,
    darwin: `open "${url}"`,
    linux: `xdg-open "${url}"`
  };

  const cmd = commands[process.platform] || commands.linux;

  try {
    execSync(cmd, { stdio: 'ignore', shell: true });
    return true;
  } catch (e) {
    log(`Could not open browser automatically. Open this URL manually: ${url}`, 'info');
    return false;
  }
}

/**
 * Parse YAML-like config from CLAUDE.md
 */
function parseClaudeMdConfig(projectDir) {
  const claudeMdPath = path.join(projectDir, 'CLAUDE.md');
  const rootClaudeMd = path.resolve(SKILL_DIR, '../../../CLAUDE.md');

  let configPath = null;
  if (fs.existsSync(claudeMdPath)) {
    configPath = claudeMdPath;
  } else if (fs.existsSync(rootClaudeMd)) {
    configPath = rootClaudeMd;
  }

  if (!configPath) return null;

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = { platform: {} };

    // Simple YAML-like parsing for our specific format
    const lines = content.split('\n');
    let currentSection = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed) continue;

      // Section headers
      if (trimmed === 'platform:') {
        currentSection = 'platform';
        continue;
      }
      if (trimmed === 'capture:') {
        currentSection = 'capture';
        config.capture = {};
        continue;
      }

      // Key-value pairs
      if (currentSection && trimmed.includes(':')) {
        const colonIdx = trimmed.indexOf(':');
        const key = trimmed.substring(0, colonIdx).trim();
        let value = trimmed.substring(colonIdx + 1).trim();

        // Remove inline comments
        const commentIdx = value.indexOf('#');
        if (commentIdx > 0) {
          value = value.substring(0, commentIdx).trim();
        }

        if (currentSection === 'platform') {
          config.platform[key] = value;
        } else if (currentSection === 'capture') {
          config.capture[key] = value;
        }
      }
    }

    return config;
  } catch (e) {
    return null;
  }
}

/**
 * Get hostname from URL for project naming
 */
function getHostnameFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/\./g, '-').replace(/^www-/, '');
  } catch (e) {
    return 'unknown-platform';
  }
}

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
  try {
    const net = require('net');
    const server = net.createServer();
    return new Promise((resolve) => {
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(port);
    });
  } catch (e) {
    return Promise.resolve(false);
  }
}

/**
 * Wait for server to be ready
 */
async function waitForServer(url, maxAttempts = 30, intervalMs = 1000) {
  const http = url.startsWith('https') ? require('https') : require('http');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          resolve(res.statusCode);
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('timeout'));
        });
      });
      return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }
  return false;
}

// Import new modules
const { detectPrototype, formatResult } = require('./scripts/detect-prototype');
const { ColorValidator, validateColors } = require('./validation/color-validator');
const { HTMLToReactConverter, convertHTMLToReact, writeComponents } = require('./scripts/html-to-react');
const { CSSExtractor, extractCSS } = require('./scripts/extract-css');
const { VisualDiffComparator } = require('./scripts/visual-diff');
const { ComponentExtractor, extractComponents } = require('./scripts/extract-components');
const { PlanGenerator, generatePlan } = require('./scripts/generate-plan');
const { ProjectStructure } = require('./scripts/project-structure');

function log(message, type = 'info') {
  const styles = {
    info: '\x1b[36m→\x1b[0m',
    success: '\x1b[32m✓\x1b[0m',
    warning: '\x1b[33m⚠\x1b[0m',
    error: '\x1b[31m✗\x1b[0m',
    title: '\x1b[1m\x1b[35m'
  };
  console.log(`${styles[type] || ''} ${message}${type === 'title' ? '\x1b[0m' : ''}`);
}

function showBanner() {
  console.log(`
\x1b[35m╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   \x1b[1mPlatform Prototype\x1b[0m\x1b[35m                                      ║
║   Capture any platform. Generate pixel-perfect prototypes.║
║                                                           ║
║   Version: ${VERSION}                                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝\x1b[0m
  `);
}

function showHelp() {
  showBanner();
  console.log(`
\x1b[1mUSAGE\x1b[0m
  real-prototypes-skill <command> [options]

\x1b[1mQUICK START COMMANDS\x1b[0m
  quickstart       One command: capture → extract → scaffold → serve → open browser
  serve            Start dev server and open browser
  add-feature      Add a feature to a page (conversational)

\x1b[1mCORE COMMANDS\x1b[0m
  new              Create a new project
  detect           Detect existing prototype in project
  capture          Capture a web platform
  validate         Validate capture or prototype
  validate-colors  Validate colors against design tokens
  convert          Convert captured HTML to React components
  extract-css      Extract and analyze CSS from captured HTML
  extract-lib      Extract reusable component library from HTML
  visual-diff      Compare screenshots for visual accuracy
  plan             Generate implementation plan
  checklist        Create/update pre-generation checklist (MANDATORY)
  inventory        Create element inventory (MANDATORY before coding)
  generate         Generate prototype from capture
  pipeline         Run full capture → validate → generate pipeline
  init             Initialize a new capture configuration
  list             List all projects

\x1b[1mPROJECT OPTIONS\x1b[0m
  --project   Project name (required for capture/validate/generate/pipeline)

\x1b[1mNEW PROJECT OPTIONS\x1b[0m
  --force-create  Required flag to create new project (blocks by default)

\x1b[1mCAPTURE OPTIONS\x1b[0m
  --url       Platform URL (required)
  --email     Login email
  --password  Login password
  --output    Output directory (default: ./references)
  --config    Path to config file
  --mode      Capture mode: auto, manual, hybrid (default: auto)

\x1b[1mVALIDATE OPTIONS\x1b[0m
  --phase     Validation phase: pre-capture, post-capture, pre-gen, post-gen, all
  --refs      References directory (default: ./references)
  --proto     Prototype directory (default: ./prototype)

\x1b[1mGENERATE OPTIONS\x1b[0m
  --refs      References directory (default: ./references)
  --output    Output directory (default: ./prototype)
  --feature   Feature to add (can be used multiple times)

\x1b[1mQUICKSTART OPTIONS\x1b[0m
  --url       Platform URL (required)
  --email     Login email (optional, for auto-login)
  --password  Login password (optional, for auto-login)
  --port      Dev server port (default: 3000)
  --no-open   Don't auto-open browser

\x1b[1mSERVE OPTIONS\x1b[0m
  --project   Project name (required)
  --port      Dev server port (default: 3000)
  --no-open   Don't auto-open browser

\x1b[1mADD-FEATURE OPTIONS\x1b[0m
  --project      Project name (required)
  --page         Target page name (required)
  --description  Feature description (required)

\x1b[1mEXAMPLES\x1b[0m
  # QUICKSTART: One command does everything
  real-prototypes-skill quickstart --url https://app.example.com

  # With auto-login
  real-prototypes-skill quickstart --url https://app.example.com --email user@test.com --password secret

  # Start dev server and open browser
  real-prototypes-skill serve --project my-app

  # Add a feature to a page
  real-prototypes-skill add-feature --project my-app --page homepage --description "chatbot widget"

  # Create a new project (manual flow)
  real-prototypes-skill new --project my-app --force-create

  # Capture a platform (manual flow)
  real-prototypes-skill capture --project my-app --url https://app.example.com

  # List all projects
  real-prototypes-skill list

\x1b[1mENVIRONMENT VARIABLES\x1b[0m
  PLATFORM_EMAIL     Login email (alternative to --email)
  PLATFORM_PASSWORD  Login password (alternative to --password)
  `);
}

function parseArgs(args) {
  const options = {
    command: args[0],
    project: null,
    url: null,
    email: process.env.PLATFORM_EMAIL,
    password: process.env.PLATFORM_PASSWORD,
    output: null,
    config: null,
    mode: 'auto',
    phase: 'all',
    refs: null,
    proto: null,
    features: [],
    forceCreate: false,
    port: 3000,
    page: null,
    description: null,
    open: true
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--project':
        options.project = args[++i];
        break;
      case '--url':
        options.url = args[++i];
        break;
      case '--email':
        options.email = args[++i];
        break;
      case '--password':
        options.password = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--config':
        options.config = args[++i];
        break;
      case '--mode':
        options.mode = args[++i];
        break;
      case '--phase':
        options.phase = args[++i];
        break;
      case '--refs':
        options.refs = args[++i];
        break;
      case '--proto':
        options.proto = args[++i];
        break;
      case '--feature':
        options.features.push(args[++i]);
        break;
      case '--force-create':
        options.forceCreate = true;
        break;
      case '--port':
        options.port = parseInt(args[++i], 10);
        break;
      case '--page':
        options.page = args[++i];
        break;
      case '--description':
        options.description = args[++i];
        break;
      case '--no-open':
        options.open = false;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
    }
  }

  // Set project-based paths if project is specified
  if (options.project) {
    const projectDir = path.join(PROJECTS_DIR, options.project);
    options.refs = options.refs || path.join(projectDir, 'references');
    options.proto = options.proto || path.join(projectDir, 'prototype');
  } else {
    options.refs = options.refs || './references';
    options.proto = options.proto || './prototype';
  }

  return options;
}

function requireProject(options, command) {
  if (!options.project) {
    log(`--project is required for ${command} command`, 'error');
    log('Example: real-prototypes-skill ' + command + ' --project my-app', 'info');
    process.exit(1);
  }
}

function getProjectDir(projectName) {
  return path.join(PROJECTS_DIR, projectName);
}

function runNew(options) {
  showBanner();

  if (!options.project) {
    log('--project is required for new command', 'error');
    log('Example: real-prototypes-skill new --project my-app', 'info');
    process.exit(1);
  }

  // Block project creation by default - require explicit flag
  if (!options.forceCreate) {
    console.log('');
    log('═══════════════════════════════════════════', 'warning');
    log('PROJECT CREATION BLOCKED', 'warning');
    log('═══════════════════════════════════════════', 'warning');
    console.log('');
    log('This skill is for capturing EXISTING platforms, not creating new designs.', 'info');
    console.log('');
    log('If you have an existing platform to capture:', 'info');
    log(`  1. Create project: node cli.js new --project ${options.project} --force-create`, 'info');
    log(`  2. Capture it: node cli.js capture --project ${options.project} --url <URL>`, 'info');
    console.log('');
    log('Use --force-create only if you understand this creates an EMPTY project', 'warning');
    log('that must be populated by capturing an existing platform.', 'warning');
    process.exit(1);
  }

  const projectDir = getProjectDir(options.project);
  const refsDir = path.join(projectDir, 'references');
  const protoDir = path.join(projectDir, 'prototype');

  if (fs.existsSync(projectDir)) {
    log(`Project "${options.project}" already exists at ${projectDir}`, 'error');
    process.exit(1);
  }

  log(`Creating project: ${options.project}`, 'title');

  // Create directories
  fs.mkdirSync(refsDir, { recursive: true });
  fs.mkdirSync(path.join(refsDir, 'screenshots'), { recursive: true });
  fs.mkdirSync(path.join(refsDir, 'html'), { recursive: true });
  fs.mkdirSync(protoDir, { recursive: true });

  // Create project config
  const projectConfig = {
    name: options.project,
    created: new Date().toISOString(),
    platform: {
      name: '',
      baseUrl: ''
    }
  };
  fs.writeFileSync(path.join(projectDir, 'project.json'), JSON.stringify(projectConfig, null, 2));

  log(`Project created: ${projectDir}`, 'success');
  console.log(`
\x1b[1mProject Structure:\x1b[0m
  ${projectDir}/
  ├── project.json      # Project configuration
  ├── references/       # Captured platform assets
  │   ├── screenshots/
  │   └── html/
  └── prototype/        # Generated prototype

\x1b[1mNext Steps:\x1b[0m
  1. Capture a platform:
     real-prototypes-skill capture --project ${options.project} --url https://your-platform.com

  2. Or run the full pipeline:
     real-prototypes-skill pipeline --project ${options.project} --url https://your-platform.com
  `);
}

function runList() {
  showBanner();
  log('Projects:', 'title');

  if (!fs.existsSync(PROJECTS_DIR)) {
    log('No projects found. Create one with: real-prototypes-skill new --project <name>', 'info');
    return;
  }

  const projects = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => {
      const projectDir = path.join(PROJECTS_DIR, dirent.name);
      const configPath = path.join(projectDir, 'project.json');
      const manifestPath = path.join(projectDir, 'references', 'manifest.json');

      let config = { name: dirent.name };
      let manifest = null;

      if (fs.existsSync(configPath)) {
        try { config = JSON.parse(fs.readFileSync(configPath, 'utf-8')); } catch {}
      }
      if (fs.existsSync(manifestPath)) {
        try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')); } catch {}
      }

      return {
        name: dirent.name,
        platform: config.platform?.baseUrl || 'Not configured',
        pages: manifest?.pages?.length || 0,
        created: config.created || 'Unknown'
      };
    });

  if (projects.length === 0) {
    log('No projects found. Create one with: real-prototypes-skill new --project <name>', 'info');
    return;
  }

  console.log('');
  console.log('  \x1b[1mName\x1b[0m                 \x1b[1mPlatform\x1b[0m                    \x1b[1mPages\x1b[0m');
  console.log('  ' + '-'.repeat(70));

  projects.forEach(p => {
    const name = p.name.padEnd(20);
    const platform = (p.platform || '').substring(0, 27).padEnd(27);
    const pages = String(p.pages).padStart(5);
    console.log(`  ${name} ${platform} ${pages}`);
  });
  console.log('');
}

async function runCapture(options) {
  requireProject(options, 'capture');
  log(`Starting platform capture for project: ${options.project}`, 'title');

  // Build config
  const config = options.config
    ? JSON.parse(fs.readFileSync(options.config, 'utf-8'))
    : {
        platform: {
          name: options.url ? new URL(options.url).hostname : 'unknown',
          baseUrl: options.url
        },
        auth: {
          type: options.email ? 'form' : 'none',
          loginUrl: '/login',
          credentials: {
            email: options.email,
            password: options.password
          }
        },
        capture: {
          mode: options.mode,
          maxPages: 100,
          maxDepth: 5,
          viewports: [
            { name: 'desktop', width: 1920, height: 1080 }
          ],
          interactions: {
            clickButtons: true,
            clickDropdowns: true,
            clickTabs: true,
            clickTableRows: true
          }
        },
        output: {
          directory: options.output || options.refs,
          screenshots: true,
          html: true,
          designTokens: true
        },
        validation: {
          minPages: 5,
          minColors: 10,
          requireDetailPages: true
        }
      };

  if (!config.platform.baseUrl) {
    log('Missing --url parameter', 'error');
    process.exit(1);
  }

  // Write temp config
  const configPath = path.join(SKILL_DIR, '.temp-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  // Run capture engine
  try {
    const enginePath = path.join(SKILL_DIR, 'capture', 'capture-engine.js');
    execSync(`node "${enginePath}" --config "${configPath}"`, { stdio: 'inherit' });
    log('Capture completed successfully!', 'success');
    return true;
  } catch (error) {
    log('Capture failed', 'error');
    return false;
  } finally {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }
}

async function runValidate(options) {
  requireProject(options, 'validate');
  log(`Running ${options.phase} validation for project: ${options.project}`, 'title');

  const validatorPath = path.join(SKILL_DIR, 'validation', 'validation-engine.js');

  try {
    execSync(`node "${validatorPath}" ${options.phase} "${options.refs}" "${options.proto}"`, {
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Pre-flight check - MANDATORY before any generation
 * Validates that required captures AND extraction exist before proceeding
 */
function runPreflight(options) {
  const errors = [];
  const warnings = [];

  // Required capture files
  const requiredCaptures = [
    { path: path.join(options.refs, 'design-tokens.json'), name: 'design-tokens.json' },
    { path: path.join(options.refs, 'manifest.json'), name: 'manifest.json' }
  ];

  for (const { path: filePath, name } of requiredCaptures) {
    if (!fs.existsSync(filePath)) {
      errors.push(`BLOCKED: ${name} missing - run capture first`);
    }
  }

  // Screenshots directory
  const screenshotsDir = path.join(options.refs, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    errors.push('BLOCKED: screenshots/ directory missing - run capture first');
  } else {
    const screenshots = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));
    if (screenshots.length === 0) {
      errors.push('BLOCKED: No screenshots found - run capture first');
    }
  }

  // MANDATORY: Check if extract-lib was run (registry.json)
  const registryPath = path.join(options.proto, 'src', 'components', 'extracted', 'registry.json');
  if (!fs.existsSync(registryPath)) {
    errors.push('BLOCKED: Run `extract-lib` first to parse captured HTML');
    errors.push(`         Expected: ${registryPath}`);
  }

  // MANDATORY: Check if HTML was analyzed (parsed-structure.json)
  const analysisPath = path.join(options.refs, 'parsed-structure.json');
  if (!fs.existsSync(analysisPath)) {
    warnings.push('WARNING: Run `analyze` command to parse HTML structure first');
    warnings.push(`         Expected: ${analysisPath}`);
  }

  // Check for element inventory
  const inventoryPath = path.join(options.refs, 'element-inventory.md');
  if (!fs.existsSync(inventoryPath)) {
    warnings.push('WARNING: element-inventory.md not found');
    warnings.push('         Run `inventory` command to create element checklist');
  }

  // Check for generation checklist
  const checklistPath = path.join(getProjectDir(options.project), 'generation-checklist.json');
  if (fs.existsSync(checklistPath)) {
    try {
      const checklist = JSON.parse(fs.readFileSync(checklistPath, 'utf-8'));
      if (!checklist.generationAllowed) {
        const incomplete = checklist.checklist.filter(c => c.required && !c.completed);
        if (incomplete.length > 0) {
          errors.push('BLOCKED: Generation checklist incomplete');
          incomplete.forEach(item => {
            errors.push(`         - ${item.step} not completed`);
          });
        }
      }
    } catch (e) {
      warnings.push('WARNING: Could not read generation-checklist.json');
    }
  }

  if (errors.length > 0 || warnings.length > 0) {
    console.log('');
    log('═══════════════════════════════════════════', 'error');
    log('PRE-GENERATION CHECKS', 'error');
    log('═══════════════════════════════════════════', 'error');
    console.log('');

    if (errors.length > 0) {
      log('❌ BLOCKING ERRORS:', 'error');
      errors.forEach(e => console.log(`   ${e}`));
      console.log('');
    }

    if (warnings.length > 0) {
      log('⚠️  WARNINGS:', 'warning');
      warnings.forEach(w => console.log(`   ${w}`));
      console.log('');
    }

    if (errors.length > 0) {
      log('GENERATION BLOCKED - Fix errors above before proceeding', 'error');
      console.log('');
      log('Required steps before generation:', 'info');
      log(`  1. node cli.js capture --project ${options.project} --url <PLATFORM_URL>`, 'info');
      log(`  2. node cli.js extract-lib --project ${options.project}`, 'info');
      log(`  3. node cli.js checklist --project ${options.project} --page <page>`, 'info');
      log(`  4. node cli.js inventory --project ${options.project} --page <page>`, 'info');
      console.log('');
      log('This skill is for adding features to EXISTING platforms.', 'info');
      log('It does NOT create new designs from scratch.', 'info');
      process.exit(1);
    }
  }

  log('Pre-flight check passed', 'success');
  return true;
}

async function runGenerate(options) {
  requireProject(options, 'generate');

  // MANDATORY: Pre-flight check before ANY generation
  runPreflight(options);

  // Auto-detect existing prototype
  const protoInfo = detectPrototype(options.proto);
  if (protoInfo.exists) {
    console.log('');
    log('═══════════════════════════════════════════', 'warning');
    log('EXTEND MODE ACTIVE - Existing prototype detected', 'warning');
    log('═══════════════════════════════════════════', 'warning');
    log(`Framework: ${protoInfo.framework}`, 'info');
    log('All changes MUST modify existing files only', 'warning');
    console.log('');
  }

  log(`Generating prototype for project: ${options.project}`, 'title');

  // This would integrate with your prototype generation logic
  // For now, we'll provide guidance

  const manifestPath = path.join(options.refs, 'manifest.json');
  const tokensPath = path.join(options.refs, 'design-tokens.json');

  if (!fs.existsSync(manifestPath)) {
    log('manifest.json not found - run capture first', 'error');
    return false;
  }

  if (!fs.existsSync(tokensPath)) {
    log('design-tokens.json not found - run capture first', 'error');
    return false;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));

  console.log(`
\x1b[1m════════════════════════════════════════════════════════════\x1b[0m
\x1b[1m                    PROJECT PATHS                            \x1b[0m
\x1b[1m════════════════════════════════════════════════════════════\x1b[0m

\x1b[1mPrototype Output Directory:\x1b[0m
  ${options.proto}

\x1b[1mReference Files:\x1b[0m
  Screenshots: ${path.join(options.refs, 'screenshots')}
  HTML:        ${path.join(options.refs, 'html')}
  Tokens:      ${tokensPath}
  Manifest:    ${manifestPath}

\x1b[1m════════════════════════════════════════════════════════════\x1b[0m
\x1b[1m                    CAPTURE SUMMARY                          \x1b[0m
\x1b[1m════════════════════════════════════════════════════════════\x1b[0m

  Platform: ${manifest.platform.name}
  Pages: ${manifest.pages.length}
  Colors: ${tokens.totalColorsFound}
  Primary Color: ${tokens.colors?.primary || 'Not identified'}

\x1b[1mRequired Colors (from design-tokens.json):\x1b[0m
  Primary: ${tokens.colors?.primary || 'N/A'}
  Text: ${tokens.colors?.text?.primary || 'N/A'}
  Background: ${tokens.colors?.background?.white || 'N/A'}
  Border: ${tokens.colors?.border?.default || 'N/A'}

\x1b[1m════════════════════════════════════════════════════════════\x1b[0m
\x1b[1m                    INSTRUCTIONS                             \x1b[0m
\x1b[1m════════════════════════════════════════════════════════════\x1b[0m

\x1b[33mALL prototype files MUST be created in:\x1b[0m
  ${options.proto}

\x1b[1mGeneration Rules:\x1b[0m
  1. Use ONLY colors from design-tokens.json
  2. Match layout from screenshots exactly
  3. Use inline styles for colors (Tailwind custom colors may not work)
  4. Validate with: node cli.js validate-colors --project ${options.project}

\x1b[1mFeatures to add:\x1b[0m
${options.features.length > 0 ? options.features.map(f => `  - ${f}`).join('\n') : '  (none specified)'}
  `);

  return true;
}

async function runPipeline(options) {
  requireProject(options, 'pipeline');
  showBanner();
  log(`Running full pipeline for project: ${options.project}`, 'title');

  console.log(`
\x1b[1mPipeline Steps:\x1b[0m
  1. Pre-capture validation
  2. Platform capture
  3. Post-capture validation
  4. Pre-generation validation
  5. Prototype generation
  6. Post-generation validation
  `);

  // Step 1: Pre-capture validation
  log('Step 1: Pre-capture validation', 'info');
  // Simplified - would normally run validator

  // Step 2: Capture
  log('Step 2: Platform capture', 'info');
  const captureSuccess = await runCapture(options);
  if (!captureSuccess) {
    log('Pipeline failed at capture step', 'error');
    process.exit(1);
  }

  // Step 3: Post-capture validation
  log('Step 3: Post-capture validation', 'info');
  options.phase = 'post-capture';
  const postCaptureValid = await runValidate(options);
  if (!postCaptureValid) {
    log('Pipeline failed at post-capture validation', 'error');
    process.exit(1);
  }

  // Step 4: Pre-generation validation
  log('Step 4: Pre-generation validation', 'info');
  options.phase = 'pre-generation';
  const preGenValid = await runValidate(options);
  if (!preGenValid) {
    log('Pipeline failed at pre-generation validation', 'error');
    process.exit(1);
  }

  // Step 5: Generate
  log('Step 5: Prototype generation', 'info');
  await runGenerate(options);

  log('Pipeline completed!', 'success');
  console.log(`
\x1b[1mNext Steps:\x1b[0m
  1. Review screenshots in ${options.refs}/screenshots/
  2. Check design-tokens.json for color palette
  3. Generate prototype using the captured references
  4. Run: real-prototypes-skill validate --phase post-gen
  `);
}

function runValidateColors(options) {
  requireProject(options, 'validate-colors');
  showBanner();
  log(`Validating colors for project: ${options.project}`, 'title');

  const tokensPath = path.join(options.refs, 'design-tokens.json');

  if (!fs.existsSync(tokensPath)) {
    log('design-tokens.json not found - run capture first', 'error');
    process.exit(1);
  }

  if (!fs.existsSync(options.proto)) {
    log('Prototype directory not found', 'error');
    process.exit(1);
  }

  try {
    const validator = validateColors(options.proto, tokensPath);
    console.log('');
    console.log(validator.formatViolations());

    const summary = validator.getSummary();
    if (summary.passed) {
      log('All colors validated successfully!', 'success');
    } else {
      log(`Found ${summary.total} color violation(s)`, 'error');
      process.exit(1);
    }
  } catch (error) {
    log(`Validation failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

function runConvert(options, args) {
  requireProject(options, 'convert');
  showBanner();

  // Get page name from args
  let pageName = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--page') {
      pageName = args[++i];
    }
  }

  if (!pageName) {
    log('--page is required for convert command', 'error');
    log('Example: real-prototypes-skill convert --project my-app --page homepage', 'info');
    process.exit(1);
  }

  log(`Converting HTML to React for: ${pageName}`, 'title');

  const htmlPath = path.join(options.refs, 'html', `${pageName}.html`);
  const outputDir = path.join(options.proto, 'src', 'components', 'extracted');

  if (!fs.existsSync(htmlPath)) {
    log(`HTML file not found: ${htmlPath}`, 'error');
    process.exit(1);
  }

  try {
    const result = convertHTMLToReact(htmlPath);

    console.log(`\n\x1b[1mDetected Components (${result.boundaries.length}):\x1b[0m`);
    for (const boundary of result.boundaries.slice(0, 10)) {
      console.log(`  ${boundary.suggestedName} (${boundary.type})`);
    }

    console.log(`\n\x1b[1mExtracted Components (${result.components.length}):\x1b[0m`);
    for (const comp of result.components) {
      console.log(`  ${comp.name}`);
    }

    // Write components
    const written = writeComponents(result.components, outputDir);
    console.log(`\n\x1b[32m✓ Wrote ${written.length} components to: ${outputDir}\x1b[0m`);

  } catch (error) {
    log(`Conversion failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

function runExtractCSS(options, args) {
  requireProject(options, 'extract-css');
  showBanner();

  let pageName = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--page') {
      pageName = args[++i];
    }
  }

  if (!pageName) {
    log('--page is required for extract-css command', 'error');
    log('Example: real-prototypes-skill extract-css --project my-app --page homepage', 'info');
    process.exit(1);
  }

  log(`Extracting CSS from: ${pageName}`, 'title');

  const htmlPath = path.join(options.refs, 'html', `${pageName}.html`);

  if (!fs.existsSync(htmlPath)) {
    log(`HTML file not found: ${htmlPath}`, 'error');
    process.exit(1);
  }

  try {
    const extractor = new CSSExtractor();
    extractor.loadFromFile(htmlPath);

    console.log('');
    console.log(extractor.formatResults());

  } catch (error) {
    log(`Extraction failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

function runVisualDiff(options, args) {
  requireProject(options, 'visual-diff');
  showBanner();

  let pageName = null;
  let listMode = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--page') {
      pageName = args[++i];
    }
    if (args[i] === '--list') {
      listMode = true;
    }
  }

  const screenshotsDir = path.join(options.refs, 'screenshots');

  if (listMode) {
    log('Available reference screenshots:', 'title');
    if (fs.existsSync(screenshotsDir)) {
      const files = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));
      for (const file of files) {
        console.log(`  ${file.replace('.png', '')}`);
      }
    } else {
      log('No screenshots found', 'warning');
    }
    return;
  }

  if (!pageName) {
    log('--page is required (or use --list to see available)', 'error');
    log('Example: real-prototypes-skill visual-diff --project my-app --page homepage', 'info');
    process.exit(1);
  }

  log(`Visual diff for: ${pageName}`, 'title');

  // Find reference screenshot
  const refScreenshots = fs.existsSync(screenshotsDir)
    ? fs.readdirSync(screenshotsDir).filter(f => f.toLowerCase().includes(pageName.toLowerCase()) && f.endsWith('.png'))
    : [];

  if (refScreenshots.length === 0) {
    log(`No reference screenshot found for: ${pageName}`, 'error');
    log('Use --list to see available screenshots', 'info');
    process.exit(1);
  }

  const refPath = path.join(screenshotsDir, refScreenshots[0]);
  console.log(`  Reference: ${refScreenshots[0]}`);

  // Look for generated screenshot
  const genScreenshotsDir = path.join(options.proto, 'screenshots');
  const genScreenshots = fs.existsSync(genScreenshotsDir)
    ? fs.readdirSync(genScreenshotsDir).filter(f => f.toLowerCase().includes(pageName.toLowerCase()) && f.endsWith('.png'))
    : [];

  if (genScreenshots.length === 0) {
    log('No generated screenshot found to compare', 'warning');
    console.log(`
\x1b[1mTo generate a screenshot:\x1b[0m
  1. Start your prototype: npm run dev
  2. Take a screenshot of the page
  3. Save it to: ${genScreenshotsDir}/${pageName}.png
    `);
    return;
  }

  const genPath = path.join(genScreenshotsDir, genScreenshots[0]);
  console.log(`  Generated: ${genScreenshots[0]}`);

  // Run comparison
  (async () => {
    try {
      const comparator = new VisualDiffComparator({ minSimilarity: 95 });
      const diffPath = path.join(options.refs, 'diff', `${pageName}-diff.png`);

      const result = await comparator.compare(refPath, genPath, diffPath);

      console.log('');
      console.log(comparator.formatResults());

    } catch (error) {
      log(`Visual diff failed: ${error.message}`, 'error');
      process.exit(1);
    }
  })();
}

function runDetect(options) {
  requireProject(options, 'detect');
  showBanner();
  log(`Detecting existing prototype for project: ${options.project}`, 'title');

  const projectDir = getProjectDir(options.project);
  const protoDir = path.join(projectDir, 'prototype');
  const manifestPath = path.join(projectDir, 'references', 'manifest.json');

  // First check if prototype directory exists
  if (!fs.existsSync(protoDir)) {
    log('No prototype directory found', 'warning');
    log(`Expected at: ${protoDir}`, 'info');
    console.log(`
\x1b[1mTo create a prototype:\x1b[0m
  1. Run capture first: real-prototypes-skill capture --project ${options.project} --url <URL>
  2. Then generate: real-prototypes-skill generate --project ${options.project}
    `);
    return { exists: false };
  }

  // Run detection
  const result = detectPrototype(protoDir);

  // Try to map pages if manifest exists
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const { mapPages } = require('./scripts/detect-prototype');
      result.mappedPages = mapPages(protoDir, manifest);
    } catch (e) {
      log(`Could not load manifest: ${e.message}`, 'warning');
    }
  }

  console.log('');
  console.log(formatResult(result));
  console.log('');

  if (result.exists) {
    log('Existing prototype detected - use EXTEND mode', 'success');
    console.log(`
\x1b[1mRecommendation:\x1b[0m
  When generating new features, modify existing files instead of creating new ones.

\x1b[1mExisting prototype details:\x1b[0m
  Framework: ${result.framework || 'Unknown'}
  Styling: ${result.styling.join(', ')}
  Pages: ${result.pages.length}
  Components: ${result.components.length}
    `);
  } else {
    log('No existing prototype found - safe to CREATE new', 'info');
  }

  return result;
}

function runExtractLib(options) {
  requireProject(options, 'extract-lib');
  showBanner();
  log(`Extracting component library for project: ${options.project}`, 'title');

  const htmlDir = path.join(options.refs, 'html');
  const outputDir = path.join(options.proto, 'src', 'components', 'extracted');

  if (!fs.existsSync(htmlDir)) {
    log('HTML directory not found - run capture first', 'error');
    process.exit(1);
  }

  try {
    const extractor = new ComponentExtractor();
    extractor.analyzeDirectory(htmlDir);

    console.log('');
    console.log(extractor.formatSummary());

    // Write components
    const written = extractor.writeComponents(outputDir);
    console.log(`\n\x1b[32m✓ Wrote ${written.length} files to: ${outputDir}\x1b[0m`);
    for (const file of written) {
      console.log(`  ${path.basename(file)}`);
    }

  } catch (error) {
    log(`Extraction failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

function runPlan(options, args) {
  requireProject(options, 'plan');
  showBanner();

  let feature = '';
  let targetPage = null;
  let outputPath = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--feature') {
      feature = args[++i];
    } else if (args[i] === '--target') {
      targetPage = args[++i];
    } else if (args[i] === '--output' || args[i] === '-o') {
      outputPath = args[++i];
    }
  }

  log(`Generating implementation plan for project: ${options.project}`, 'title');

  const projectDir = getProjectDir(options.project);

  try {
    const generator = new PlanGenerator(projectDir, {
      featureDescription: feature,
      targetPage
    });

    generator.generate();
    console.log('');
    console.log(generator.formatPlan());

    if (outputPath) {
      generator.writePlan(outputPath);
      console.log(`\n\x1b[32m✓ Plan written to: ${outputPath}\x1b[0m`);
    } else {
      // Write to project directory by default
      const defaultPath = path.join(projectDir, 'plan.json');
      generator.writePlan(defaultPath);
      console.log(`\n\x1b[32m✓ Plan written to: ${defaultPath}\x1b[0m`);
    }

  } catch (error) {
    log(`Plan generation failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

/**
 * Generate pre-code checklist for a specific page
 * This checklist MUST be completed before code generation
 */
function runChecklist(options, args) {
  requireProject(options, 'checklist');
  showBanner();

  let pageName = null;
  let updateStep = null;
  let markComplete = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--page') {
      pageName = args[++i];
    } else if (args[i] === '--complete') {
      updateStep = args[++i];
      markComplete = true;
    } else if (args[i] === '--reset') {
      updateStep = args[++i];
      markComplete = false;
    }
  }

  if (!pageName) {
    log('--page is required for checklist command', 'error');
    log('Example: node cli.js checklist --project my-app --page homepage', 'info');
    process.exit(1);
  }

  log(`Generation checklist for: ${pageName}`, 'title');

  const projectDir = getProjectDir(options.project);
  const checklistPath = path.join(projectDir, 'generation-checklist.json');

  // Default checklist structure
  const defaultChecklist = {
    page: pageName,
    createdAt: new Date().toISOString(),
    checklist: [
      { step: 'extract-lib', description: 'Run extract-lib to parse captured HTML', completed: false, required: true },
      { step: 'convert', description: 'Run convert to generate React components', completed: false, required: true },
      { step: 'read-screenshot', description: 'Read and analyze screenshot using Read tool', completed: false, required: true },
      { step: 'read-html', description: 'Read captured HTML file', completed: false, required: true },
      { step: 'list-all-elements', description: 'Create element inventory listing ALL visible elements', completed: false, required: true }
    ],
    generationAllowed: false
  };

  let checklist = defaultChecklist;

  // Load existing or create new
  if (fs.existsSync(checklistPath)) {
    try {
      checklist = JSON.parse(fs.readFileSync(checklistPath, 'utf-8'));
      // Update page if different
      if (checklist.page !== pageName) {
        checklist = defaultChecklist;
      }
    } catch (e) {
      checklist = defaultChecklist;
    }
  }

  // Update step if requested
  if (updateStep) {
    const item = checklist.checklist.find(c => c.step === updateStep);
    if (item) {
      item.completed = markComplete;
      item.completedAt = markComplete ? new Date().toISOString() : null;
      log(`${markComplete ? '✓' : '○'} ${updateStep} marked as ${markComplete ? 'complete' : 'incomplete'}`, markComplete ? 'success' : 'info');
    } else {
      log(`Unknown step: ${updateStep}`, 'error');
    }
  }

  // Check auto-completion based on file existence
  const registryPath = path.join(options.proto, 'src', 'components', 'extracted', 'registry.json');
  const extractedDir = path.join(options.proto, 'src', 'components', 'extracted');
  const htmlPath = path.join(options.refs, 'html', `${pageName}.html`);
  const screenshotDir = path.join(options.refs, 'screenshots');
  const inventoryPath = path.join(options.refs, 'element-inventory.md');

  // Auto-detect completed steps
  if (fs.existsSync(registryPath)) {
    const item = checklist.checklist.find(c => c.step === 'extract-lib');
    if (item && !item.completed) {
      item.completed = true;
      item.completedAt = new Date().toISOString();
      item.autoDetected = true;
    }
  }

  if (fs.existsSync(extractedDir) && fs.readdirSync(extractedDir).some(f => f.endsWith('.tsx'))) {
    const item = checklist.checklist.find(c => c.step === 'convert');
    if (item && !item.completed) {
      item.completed = true;
      item.completedAt = new Date().toISOString();
      item.autoDetected = true;
    }
  }

  if (fs.existsSync(inventoryPath)) {
    const item = checklist.checklist.find(c => c.step === 'list-all-elements');
    if (item && !item.completed) {
      item.completed = true;
      item.completedAt = new Date().toISOString();
      item.autoDetected = true;
    }
  }

  // Calculate if generation is allowed
  const requiredItems = checklist.checklist.filter(c => c.required);
  const completedRequired = requiredItems.filter(c => c.completed);
  checklist.generationAllowed = completedRequired.length === requiredItems.length;

  // Save checklist
  fs.writeFileSync(checklistPath, JSON.stringify(checklist, null, 2));

  // Display checklist
  console.log('');
  console.log('\x1b[1m═══════════════════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[1m                 GENERATION CHECKLIST                       \x1b[0m');
  console.log('\x1b[1m═══════════════════════════════════════════════════════════\x1b[0m');
  console.log('');

  for (const item of checklist.checklist) {
    const status = item.completed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m○\x1b[0m';
    const required = item.required ? '\x1b[33m(required)\x1b[0m' : '';
    console.log(`  ${status} ${item.step.padEnd(20)} ${required}`);
    console.log(`      ${item.description}`);
  }

  console.log('');
  console.log(`  Progress: ${completedRequired.length}/${requiredItems.length} required steps complete`);
  console.log('');

  if (checklist.generationAllowed) {
    log('✓ All required steps complete - generation ALLOWED', 'success');
  } else {
    log('✗ Complete all required steps before generating code', 'error');
    console.log('');
    log('To mark a step complete:', 'info');
    log(`  node cli.js checklist --project ${options.project} --page ${pageName} --complete <step>`, 'info');
  }

  console.log(`\n  Checklist saved to: ${checklistPath}`);
}

/**
 * Generate element inventory for a specific page
 * Forces listing of ALL visible elements before code generation
 */
function runInventory(options, args) {
  requireProject(options, 'inventory');
  showBanner();

  let pageName = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--page') {
      pageName = args[++i];
    }
  }

  if (!pageName) {
    log('--page is required for inventory command', 'error');
    log('Example: node cli.js inventory --project my-app --page homepage', 'info');
    process.exit(1);
  }

  log(`Creating element inventory for: ${pageName}`, 'title');

  const inventoryPath = path.join(options.refs, 'element-inventory.md');
  const htmlPath = path.join(options.refs, 'html', `${pageName}.html`);
  const screenshotPath = path.join(options.refs, 'screenshots');

  // Find related screenshot
  let screenshotFile = 'N/A';
  if (fs.existsSync(screenshotPath)) {
    const screenshots = fs.readdirSync(screenshotPath).filter(f =>
      f.toLowerCase().includes(pageName.toLowerCase()) && f.endsWith('.png')
    );
    if (screenshots.length > 0) {
      screenshotFile = screenshots[0];
    }
  }

  // Try to analyze HTML if available
  let detectedElements = [];
  if (fs.existsSync(htmlPath)) {
    try {
      const { JSDOM } = require('jsdom');
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      // Detect common element types
      const elementTypes = [
        { selector: 'header, [role="banner"]', category: 'Header' },
        { selector: 'nav, [role="navigation"]', category: 'Navigation' },
        { selector: 'main, [role="main"]', category: 'Main Content' },
        { selector: 'aside, [role="complementary"]', category: 'Sidebar' },
        { selector: 'footer, [role="contentinfo"]', category: 'Footer' },
        { selector: 'button, [role="button"]', category: 'Buttons' },
        { selector: 'input, textarea, select', category: 'Form Fields' },
        { selector: 'table, [role="grid"]', category: 'Tables' },
        { selector: 'img, [role="img"]', category: 'Images' },
        { selector: 'a[href]', category: 'Links' },
        { selector: '[class*="card"], [class*="Card"]', category: 'Cards' },
        { selector: '[class*="modal"], [class*="Modal"], [role="dialog"]', category: 'Modals' },
        { selector: '[class*="tab"], [role="tab"]', category: 'Tabs' },
        { selector: '[class*="dropdown"], [class*="menu"]', category: 'Dropdowns' }
      ];

      for (const { selector, category } of elementTypes) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
          detectedElements.push({ category, count: elements.length });
        }
      }
    } catch (e) {
      log(`Could not analyze HTML: ${e.message}`, 'warning');
    }
  }

  // Generate inventory template
  const inventoryContent = `# Element Inventory: ${pageName}

Generated: ${new Date().toISOString()}
Screenshot: ${screenshotFile}
HTML: ${fs.existsSync(htmlPath) ? `${pageName}.html` : 'N/A'}

---

## ⚠️ MANDATORY: Complete This Before Writing Code

**You MUST read the screenshot and list EVERY visible element below.**
**Generation is BLOCKED until this inventory is complete.**

---

## Auto-Detected Elements

${detectedElements.length > 0 ? detectedElements.map(e => `- ${e.category}: ${e.count} found`).join('\n') : '(Run on a page with captured HTML to auto-detect)'}

---

## Manual Element Inventory

**Instructions:** Look at the screenshot and list EVERY visible element in these sections.

### HEADER
- [ ] Logo
- [ ] Navigation items
- [ ] User menu
- [ ] Search bar
- [ ] (add more...)

### LEFT COLUMN / SIDEBAR
- [ ] Section 1
  - [ ] Field 1
  - [ ] Field 2
- [ ] Section 2
- [ ] (add more...)

### CENTER / MAIN CONTENT
- [ ] Main heading
- [ ] Content area
- [ ] (add more...)

### RIGHT COLUMN
- [ ] Widget 1
- [ ] Widget 2
- [ ] (add more...)

### FOOTER
- [ ] Footer content
- [ ] (add more...)

---

## Element Count Summary

| Section | Count | Verified |
|---------|-------|----------|
| Header | | [ ] |
| Left Column | | [ ] |
| Center | | [ ] |
| Right Column | | [ ] |
| Footer | | [ ] |
| **Total** | | |

---

## Completion Checklist

- [ ] I have read the screenshot using the Read tool
- [ ] I have listed ALL visible elements above
- [ ] I have verified counts are accurate
- [ ] I understand I must replicate ALL these elements in the prototype

**Signature:** _________________ **Date:** _________________

---

*This inventory was generated by: \`node cli.js inventory --project ${options.project} --page ${pageName}\`*
`;

  fs.writeFileSync(inventoryPath, inventoryContent);

  console.log('');
  log(`Element inventory template created: ${inventoryPath}`, 'success');
  console.log('');
  console.log('\x1b[1m════════════════════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[1m                    NEXT STEPS                              \x1b[0m');
  console.log('\x1b[1m════════════════════════════════════════════════════════════\x1b[0m');
  console.log('');
  log('1. READ the screenshot using the Read tool', 'info');
  log(`   File: ${path.join(screenshotPath, screenshotFile)}`, 'info');
  console.log('');
  log('2. COMPLETE the element inventory in:', 'info');
  log(`   ${inventoryPath}`, 'info');
  console.log('');
  log('3. LIST every single visible element', 'info');
  console.log('');
  log('4. RUN checklist to verify completion:', 'info');
  log(`   node cli.js checklist --project ${options.project} --page ${pageName}`, 'info');
  console.log('');
  log('Generation is BLOCKED until inventory is complete', 'warning');
}

/**
 * QUICKSTART: One command does everything
 * capture → extract → scaffold → serve → open browser
 */
async function runQuickstart(options) {
  showBanner();

  if (!options.url) {
    log('--url is required for quickstart', 'error');
    log('Example: node cli.js quickstart --url https://app.example.com', 'info');
    process.exit(1);
  }

  const projectName = options.project || getHostnameFromUrl(options.url);
  const projectDir = getProjectDir(projectName);
  const protoDir = path.join(projectDir, 'prototype');
  const port = options.port || 3000;
  const serverUrl = `http://localhost:${port}`;

  console.log(`
\x1b[1m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1m                    QUICKSTART                              \x1b[0m
\x1b[1m═══════════════════════════════════════════════════════════\x1b[0m

  Platform: ${options.url}
  Project:  ${projectName}
  Port:     ${port}
  `);

  // Step 1: Create project if it doesn't exist
  if (!fs.existsSync(projectDir)) {
    log('Step 1/6: Creating project...', 'info');
    options.project = projectName;
    options.forceCreate = true;
    runNew(options);
  } else {
    log('Step 1/6: Project exists, skipping creation', 'success');
  }

  // Step 2: Capture (if not already captured)
  const manifestPath = path.join(projectDir, 'references', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    log('Step 2/6: Capturing platform...', 'info');
    options.project = projectName;
    const captureSuccess = await runCapture(options);
    if (!captureSuccess) {
      log('Capture failed - check if agent-browser is installed', 'error');
      log('Run: npm install -g agent-browser && agent-browser install', 'info');
      process.exit(1);
    }
  } else {
    log('Step 2/6: Capture exists, skipping', 'success');
  }

  // Step 3: Extract component library
  const registryPath = path.join(protoDir, 'src', 'components', 'extracted', 'registry.json');
  if (!fs.existsSync(registryPath)) {
    log('Step 3/6: Extracting component library...', 'info');
    options.project = projectName;
    try {
      runExtractLib(options);
    } catch (e) {
      log('Extract-lib failed, continuing anyway...', 'warning');
    }
  } else {
    log('Step 3/6: Component library exists, skipping', 'success');
  }

  // Step 4: Scaffold prototype if it doesn't exist
  const packageJsonPath = path.join(protoDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('Step 4/6: Scaffolding Next.js prototype...', 'info');
    try {
      // Create minimal Next.js structure
      fs.mkdirSync(path.join(protoDir, 'src', 'app'), { recursive: true });
      fs.mkdirSync(path.join(protoDir, 'src', 'components'), { recursive: true });
      fs.mkdirSync(path.join(protoDir, 'public'), { recursive: true });

      // Create package.json
      const packageJson = {
        name: projectName,
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start'
        },
        dependencies: {
          next: '^14.0.0',
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0',
          '@types/react': '^18.2.0',
          '@types/node': '^20.0.0',
          tailwindcss: '^3.3.0',
          postcss: '^8.4.0',
          autoprefixer: '^10.4.0'
        }
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      // Create next.config.js
      fs.writeFileSync(path.join(protoDir, 'next.config.js'), `/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
`);

      // Create tsconfig.json
      fs.writeFileSync(path.join(protoDir, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
          target: 'es5',
          lib: ['dom', 'dom.iterable', 'esnext'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          plugins: [{ name: 'next' }],
          paths: { '@/*': ['./src/*'] }
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
        exclude: ['node_modules']
      }, null, 2));

      // Create tailwind.config.js
      fs.writeFileSync(path.join(protoDir, 'tailwind.config.js'), `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: {} },
  plugins: [],
}
`);

      // Create postcss.config.js
      fs.writeFileSync(path.join(protoDir, 'postcss.config.js'), `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`);

      // Create basic layout and page
      fs.writeFileSync(path.join(protoDir, 'src', 'app', 'layout.tsx'), `import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '${projectName} Prototype',
  description: 'Generated prototype',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`);

      fs.writeFileSync(path.join(protoDir, 'src', 'app', 'globals.css'), `@tailwind base;
@tailwind components;
@tailwind utilities;
`);

      fs.writeFileSync(path.join(protoDir, 'src', 'app', 'page.tsx'), `export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">${projectName} Prototype</h1>
      <p className="text-gray-600">
        Platform captured successfully. Add features by describing them to Claude.
      </p>
    </main>
  )
}
`);

      log('Scaffolded Next.js prototype', 'success');
    } catch (e) {
      log(`Scaffold failed: ${e.message}`, 'error');
      process.exit(1);
    }
  } else {
    log('Step 4/6: Prototype scaffold exists, skipping', 'success');
  }

  // Step 5: Install dependencies
  const nodeModulesPath = path.join(protoDir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log('Step 5/6: Installing dependencies...', 'info');
    try {
      execSync('npm install', { cwd: protoDir, stdio: 'inherit' });
      log('Dependencies installed', 'success');
    } catch (e) {
      log(`npm install failed: ${e.message}`, 'error');
      process.exit(1);
    }
  } else {
    log('Step 5/6: Dependencies already installed', 'success');
  }

  // Step 6: Start dev server and open browser
  log('Step 6/6: Starting dev server...', 'info');

  // Start the dev server
  const { spawn } = require('child_process');
  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';

  const devServer = spawn(npmCmd, ['run', 'dev', '--', '-p', String(port)], {
    cwd: protoDir,
    detached: !isWin,
    stdio: 'ignore'
  });

  if (!isWin) {
    devServer.unref();
  }

  // Wait for server to be ready
  log(`Waiting for server at ${serverUrl}...`, 'info');
  const ready = await waitForServer(serverUrl, 30, 1000);

  if (ready) {
    log(`Server is running at ${serverUrl}`, 'success');

    // Open browser
    if (options.open !== false) {
      log('Opening browser...', 'info');
      openBrowser(serverUrl);
    }
  } else {
    log('Server may still be starting. Check manually.', 'warning');
  }

  // Show captured pages
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      console.log(`
\x1b[1m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1m                    QUICKSTART COMPLETE                     \x1b[0m
\x1b[1m═══════════════════════════════════════════════════════════\x1b[0m

\x1b[32m✓\x1b[0m Prototype is live at: \x1b[1m${serverUrl}\x1b[0m

\x1b[1mCaptured Pages (${manifest.pages?.length || 0}):\x1b[0m
${(manifest.pages || []).slice(0, 10).map(p => `  • ${p.title || p.path}`).join('\n')}
${(manifest.pages || []).length > 10 ? `  ... and ${manifest.pages.length - 10} more` : ''}

\x1b[1mNext: Tell Claude what feature to add:\x1b[0m
  "Add a chatbot widget to the bottom-right corner"
  "Add a notification bell to the header"
  "Add a user profile dropdown"
      `);
    } catch (e) {
      console.log(`
\x1b[32m✓\x1b[0m Prototype is live at: \x1b[1m${serverUrl}\x1b[0m

Tell Claude what feature to add to your prototype.
      `);
    }
  }
}

/**
 * SERVE: Start dev server and open browser
 */
async function runServe(options) {
  requireProject(options, 'serve');
  showBanner();

  const projectDir = getProjectDir(options.project);
  const protoDir = path.join(projectDir, 'prototype');
  const packageJsonPath = path.join(protoDir, 'package.json');
  const port = options.port || 3000;
  const serverUrl = `http://localhost:${port}`;

  log(`Serving prototype for: ${options.project}`, 'title');

  if (!fs.existsSync(packageJsonPath)) {
    log('No prototype found. Run quickstart or generate first.', 'error');
    process.exit(1);
  }

  // Install deps if needed
  const nodeModulesPath = path.join(protoDir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log('Installing dependencies...', 'info');
    try {
      execSync('npm install', { cwd: protoDir, stdio: 'inherit' });
    } catch (e) {
      log(`npm install failed: ${e.message}`, 'error');
      process.exit(1);
    }
  }

  // Start the dev server
  log(`Starting dev server on port ${port}...`, 'info');

  const { spawn } = require('child_process');
  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';

  const devServer = spawn(npmCmd, ['run', 'dev', '--', '-p', String(port)], {
    cwd: protoDir,
    detached: !isWin,
    stdio: 'ignore'
  });

  if (!isWin) {
    devServer.unref();
  }

  // Wait for server
  log(`Waiting for server at ${serverUrl}...`, 'info');
  const ready = await waitForServer(serverUrl, 30, 1000);

  if (ready) {
    log(`Server is running at ${serverUrl}`, 'success');

    if (options.open !== false) {
      log('Opening browser...', 'info');
      openBrowser(serverUrl);
    }

    console.log(`
\x1b[1m════════════════════════════════════════════════════════════\x1b[0m
  Server: ${serverUrl}
  Project: ${options.project}

  Press Ctrl+C in this terminal to stop the server.
\x1b[1m════════════════════════════════════════════════════════════\x1b[0m
    `);
  } else {
    log('Server may still be starting. Check manually.', 'warning');
    log(`URL: ${serverUrl}`, 'info');
  }
}

/**
 * ADD-FEATURE: Conversational feature injection
 */
function runAddFeature(options) {
  requireProject(options, 'add-feature');
  showBanner();

  if (!options.page) {
    log('--page is required for add-feature', 'error');
    log('Example: node cli.js add-feature --project my-app --page homepage --description "chatbot"', 'info');
    process.exit(1);
  }

  if (!options.description) {
    log('--description is required for add-feature', 'error');
    log('Example: node cli.js add-feature --project my-app --page homepage --description "chatbot widget"', 'info');
    process.exit(1);
  }

  const projectDir = getProjectDir(options.project);
  const protoDir = path.join(projectDir, 'prototype');
  const refsDir = path.join(projectDir, 'references');

  log(`Adding feature to: ${options.page}`, 'title');
  log(`Feature: ${options.description}`, 'info');

  // Load design tokens for color reference
  const tokensPath = path.join(refsDir, 'design-tokens.json');
  let tokens = null;
  if (fs.existsSync(tokensPath)) {
    try {
      tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    } catch (e) {}
  }

  // Find the target page file
  const appDir = path.join(protoDir, 'src', 'app');
  const pagesDir = path.join(protoDir, 'src', 'pages');
  let targetFile = null;

  // Check common locations
  const possiblePaths = [
    path.join(appDir, options.page, 'page.tsx'),
    path.join(appDir, options.page + '.tsx'),
    path.join(appDir, 'page.tsx'), // homepage
    path.join(pagesDir, options.page + '.tsx'),
    path.join(pagesDir, 'index.tsx') // homepage
  ];

  if (options.page === 'homepage' || options.page === 'home') {
    possiblePaths.unshift(path.join(appDir, 'page.tsx'));
  }

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      targetFile = p;
      break;
    }
  }

  console.log(`
\x1b[1m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1m                    ADD FEATURE                             \x1b[0m
\x1b[1m═══════════════════════════════════════════════════════════\x1b[0m

  Project:     ${options.project}
  Page:        ${options.page}
  Feature:     ${options.description}
  Target File: ${targetFile || 'Not found - will need to create'}

\x1b[1mDesign Tokens Available:\x1b[0m
  Primary:    ${tokens?.colors?.primary || 'Not captured'}
  Background: ${tokens?.colors?.background?.white || 'Not captured'}
  Text:       ${tokens?.colors?.text?.primary || 'Not captured'}

\x1b[1mTo implement this feature:\x1b[0m

1. Read the screenshot for visual reference:
   ${path.join(refsDir, 'screenshots')}

2. Create/modify the component at:
   ${targetFile || path.join(protoDir, 'src', 'components', options.description.replace(/\s+/g, '') + '.tsx')}

3. Use ONLY colors from design-tokens.json

4. The dev server will hot-reload automatically.

\x1b[1mSuggested component location:\x1b[0m
  ${path.join(protoDir, 'src', 'components', options.description.replace(/\s+/g, '-').toLowerCase() + '.tsx')}
  `);

  // Create a feature plan file
  const featurePlan = {
    feature: options.description,
    page: options.page,
    targetFile: targetFile,
    suggestedComponent: path.join(protoDir, 'src', 'components', options.description.replace(/\s+/g, '-').toLowerCase() + '.tsx'),
    tokens: tokens ? {
      primary: tokens.colors?.primary,
      background: tokens.colors?.background?.white,
      text: tokens.colors?.text?.primary
    } : null,
    createdAt: new Date().toISOString()
  };

  const planPath = path.join(projectDir, 'feature-plan.json');
  fs.writeFileSync(planPath, JSON.stringify(featurePlan, null, 2));

  log(`Feature plan saved to: ${planPath}`, 'success');
}

function runInit(options) {
  showBanner();
  log('Initializing capture configuration...', 'title');

  const configTemplate = {
    platform: {
      name: 'My Platform',
      baseUrl: 'https://app.example.com'
    },
    auth: {
      type: 'form',
      loginUrl: '/login',
      credentials: {
        emailField: 'email',
        passwordField: 'password',
        submitButton: 'Sign in'
      }
    },
    capture: {
      mode: 'auto',
      maxPages: 100,
      maxDepth: 5,
      viewports: [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile', width: 375, height: 812 }
      ],
      interactions: {
        clickButtons: true,
        clickDropdowns: true,
        clickTabs: true,
        clickTableRows: true,
        clickModals: true,
        hoverElements: true
      },
      exclude: ['/logout', '/signout', '/delete', '/remove']
    },
    output: {
      directory: './references',
      screenshots: true,
      html: true,
      designTokens: true
    },
    validation: {
      minPages: 5,
      minColors: 10,
      requireDetailPages: true,
      requireAllTabs: true
    }
  };

  const outputPath = options.output || './capture-config.json';
  fs.writeFileSync(outputPath, JSON.stringify(configTemplate, null, 2));

  log(`Configuration created: ${outputPath}`, 'success');
  console.log(`
\x1b[1mNext Steps:\x1b[0m
  1. Edit ${outputPath} with your platform details
  2. Set environment variables:
     export PLATFORM_EMAIL=your@email.com
     export PLATFORM_PASSWORD=yourpassword
  3. Run: real-prototypes-skill capture --config ${outputPath}
  `);
}

// Main
const args = process.argv.slice(2);
const options = parseArgs(args);

switch (options.command) {
  case 'quickstart':
    runQuickstart(options);
    break;
  case 'serve':
    runServe(options);
    break;
  case 'add-feature':
    runAddFeature(options);
    break;
  case 'new':
    runNew(options);
    break;
  case 'detect':
    runDetect(options);
    break;
  case 'list':
    runList();
    break;
  case 'capture':
    runCapture(options);
    break;
  case 'validate':
    runValidate(options);
    break;
  case 'validate-colors':
    runValidateColors(options);
    break;
  case 'convert':
    runConvert(options, args);
    break;
  case 'extract-css':
    runExtractCSS(options, args);
    break;
  case 'extract-lib':
    runExtractLib(options);
    break;
  case 'visual-diff':
    runVisualDiff(options, args);
    break;
  case 'plan':
    runPlan(options, args);
    break;
  case 'generate':
    runGenerate(options);
    break;
  case 'pipeline':
    runPipeline(options);
    break;
  case 'init':
    runInit(options);
    break;
  case 'checklist':
    runChecklist(options, args);
    break;
  case 'inventory':
    runInventory(options, args);
    break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    showHelp();
    break;
  default:
    log(`Unknown command: ${options.command}`, 'error');
    log('Run "real-prototypes-skill --help" for usage', 'info');
    process.exit(1);
}
