#!/usr/bin/env node

/**
 * Visual Diff Comparison Tool
 *
 * Compares generated prototype screenshots against reference captures
 * to verify visual accuracy.
 *
 * Features:
 * - Screenshot capture of prototype pages (via Playwright)
 * - Pixel-level comparison using pixelmatch
 * - Generates diff images highlighting differences
 * - Calculates similarity scores
 * - Creates detailed comparison reports
 *
 * Usage:
 *   node visual-diff.js --project <name> --page <page>
 *   node visual-diff.js --reference ./ref.png --generated ./gen.png --output ./diff.png
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

class VisualDiffComparator {
  constructor(options = {}) {
    this.options = {
      threshold: 0.1, // Matching threshold (0-1, lower = stricter)
      includeAA: false, // Whether to detect anti-aliasing
      alpha: 0.1, // Blending factor of unchanged pixels
      diffColor: [255, 0, 0], // Color of diff pixels [R, G, B]
      diffColorAlt: [0, 255, 0], // Alternative diff color for anti-aliasing
      outputDir: './diff',
      ...options
    };

    this.results = [];
  }

  /**
   * Load PNG image from file
   */
  loadImage(imagePath) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(imagePath)) {
        reject(new Error(`Image not found: ${imagePath}`));
        return;
      }

      fs.createReadStream(imagePath)
        .pipe(new PNG())
        .on('parsed', function() {
          resolve(this);
        })
        .on('error', reject);
    });
  }

  /**
   * Save PNG image to file
   */
  saveImage(png, outputPath) {
    return new Promise((resolve, reject) => {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const buffer = PNG.sync.write(png);
      fs.writeFileSync(outputPath, buffer);
      resolve(outputPath);
    });
  }

  /**
   * Resize image to match target dimensions
   */
  resizeImage(img, targetWidth, targetHeight) {
    const resized = new PNG({ width: targetWidth, height: targetHeight });

    const scaleX = img.width / targetWidth;
    const scaleY = img.height / targetHeight;

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);
        const srcIdx = (srcY * img.width + srcX) * 4;
        const dstIdx = (y * targetWidth + x) * 4;

        resized.data[dstIdx] = img.data[srcIdx];
        resized.data[dstIdx + 1] = img.data[srcIdx + 1];
        resized.data[dstIdx + 2] = img.data[srcIdx + 2];
        resized.data[dstIdx + 3] = img.data[srcIdx + 3];
      }
    }

    return resized;
  }

  /**
   * Compare two images and generate diff
   */
  async compare(referencePath, generatedPath, diffOutputPath = null) {
    const reference = await this.loadImage(referencePath);
    let generated = await this.loadImage(generatedPath);

    // Resize generated to match reference if different sizes
    if (reference.width !== generated.width || reference.height !== generated.height) {
      console.log(`\x1b[33mNote:\x1b[0m Resizing generated image from ${generated.width}x${generated.height} to ${reference.width}x${reference.height}`);
      generated = this.resizeImage(generated, reference.width, reference.height);
    }

    const { width, height } = reference;
    const diff = new PNG({ width, height });

    // Run pixel comparison
    const mismatchedPixels = pixelmatch(
      reference.data,
      generated.data,
      diff.data,
      width,
      height,
      {
        threshold: this.options.threshold,
        includeAA: this.options.includeAA,
        alpha: this.options.alpha,
        diffColor: this.options.diffColor,
        diffColorAlt: this.options.diffColorAlt
      }
    );

    const totalPixels = width * height;
    const matchedPixels = totalPixels - mismatchedPixels;
    const similarity = (matchedPixels / totalPixels) * 100;

    const result = {
      reference: referencePath,
      generated: generatedPath,
      diff: diffOutputPath,
      dimensions: { width, height },
      totalPixels,
      mismatchedPixels,
      matchedPixels,
      similarity: similarity.toFixed(2),
      passed: similarity >= (this.options.minSimilarity || 95)
    };

    // Save diff image if output path provided
    if (diffOutputPath) {
      await this.saveImage(diff, diffOutputPath);
      result.diff = diffOutputPath;
    }

    this.results.push(result);
    return result;
  }

  /**
   * Compare multiple page pairs
   */
  async comparePages(comparisons) {
    const results = [];

    for (const comparison of comparisons) {
      try {
        const result = await this.compare(
          comparison.reference,
          comparison.generated,
          comparison.diff
        );
        results.push({ ...result, name: comparison.name });
      } catch (error) {
        results.push({
          name: comparison.name,
          error: error.message,
          passed: false
        });
      }
    }

    return results;
  }

  /**
   * Generate comparison report
   */
  generateReport() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const errors = this.results.filter(r => r.error).length;

    return {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed,
        failed,
        errors,
        overallPassed: failed === 0 && errors === 0
      },
      results: this.results,
      options: this.options
    };
  }

  /**
   * Format results for CLI output
   */
  formatResults() {
    const lines = [];

    for (const result of this.results) {
      if (result.error) {
        lines.push(`\x1b[31m✗ ${result.name || path.basename(result.reference)}\x1b[0m`);
        lines.push(`  Error: ${result.error}`);
        continue;
      }

      const status = result.passed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
      const name = result.name || path.basename(result.reference);

      lines.push(`${status} ${name}`);
      lines.push(`  Similarity: ${result.similarity}%`);
      lines.push(`  Dimensions: ${result.dimensions.width}x${result.dimensions.height}`);
      lines.push(`  Mismatched pixels: ${result.mismatchedPixels.toLocaleString()} / ${result.totalPixels.toLocaleString()}`);

      if (result.diff) {
        lines.push(`  Diff image: ${result.diff}`);
      }

      if (!result.passed) {
        lines.push(`  \x1b[33mThreshold: ${(this.options.minSimilarity || 95)}%\x1b[0m`);
      }

      lines.push('');
    }

    const report = this.generateReport();
    lines.push('\x1b[1mSummary:\x1b[0m');
    lines.push(`  Total: ${report.summary.total}`);
    lines.push(`  Passed: ${report.summary.passed}`);
    lines.push(`  Failed: ${report.summary.failed}`);
    if (report.summary.errors > 0) {
      lines.push(`  Errors: ${report.summary.errors}`);
    }

    return lines.join('\n');
  }
}

/**
 * Find matching reference screenshot for a page
 */
function findReferenceScreenshot(refsDir, pageName) {
  const screenshotsDir = path.join(refsDir, 'screenshots');

  if (!fs.existsSync(screenshotsDir)) {
    return null;
  }

  const files = fs.readdirSync(screenshotsDir);

  // Try exact match first
  const exactMatch = files.find(f =>
    f.toLowerCase() === `${pageName.toLowerCase()}.png` ||
    f.toLowerCase() === `${pageName.toLowerCase()}-desktop.png`
  );

  if (exactMatch) {
    return path.join(screenshotsDir, exactMatch);
  }

  // Try partial match
  const partialMatch = files.find(f =>
    f.toLowerCase().includes(pageName.toLowerCase()) && f.endsWith('.png')
  );

  if (partialMatch) {
    return path.join(screenshotsDir, partialMatch);
  }

  return null;
}

/**
 * List all available reference screenshots
 */
function listReferenceScreenshots(refsDir) {
  const screenshotsDir = path.join(refsDir, 'screenshots');

  if (!fs.existsSync(screenshotsDir)) {
    return [];
  }

  return fs.readdirSync(screenshotsDir)
    .filter(f => f.endsWith('.png'))
    .map(f => ({
      name: f.replace('.png', '').replace(/-desktop$/, ''),
      path: path.join(screenshotsDir, f)
    }));
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  let referencePath = null;
  let generatedPath = null;
  let diffOutputPath = null;
  let projectName = null;
  let pageName = null;
  let threshold = 0.1;
  let minSimilarity = 95;
  let listPages = false;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--reference':
      case '-r':
        referencePath = args[++i];
        break;
      case '--generated':
      case '-g':
        generatedPath = args[++i];
        break;
      case '--output':
      case '-o':
        diffOutputPath = args[++i];
        break;
      case '--project':
        projectName = args[++i];
        break;
      case '--page':
        pageName = args[++i];
        break;
      case '--threshold':
        threshold = parseFloat(args[++i]);
        break;
      case '--min-similarity':
        minSimilarity = parseFloat(args[++i]);
        break;
      case '--list':
        listPages = true;
        break;
      case '--json':
        jsonOutput = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node visual-diff.js [options]

Options:
  --reference, -r <path>   Reference screenshot path
  --generated, -g <path>   Generated screenshot path
  --output, -o <path>      Diff output path
  --project <name>         Project name
  --page <name>            Page name (used with --project)
  --threshold <0-1>        Matching threshold (default: 0.1, lower = stricter)
  --min-similarity <0-100> Minimum similarity % to pass (default: 95)
  --list                   List available reference screenshots
  --json                   Output results as JSON
  --help, -h               Show this help

Examples:
  # Compare two specific images
  node visual-diff.js -r ./ref.png -g ./gen.png -o ./diff.png

  # Compare page in project
  node visual-diff.js --project my-app --page homepage

  # List available references
  node visual-diff.js --project my-app --list

  # Strict comparison
  node visual-diff.js -r ref.png -g gen.png --threshold 0.01 --min-similarity 99
        `);
        process.exit(0);
    }
  }

  // Handle project-based paths
  if (projectName) {
    const SKILL_DIR = path.dirname(__dirname);
    const PROJECTS_DIR = path.resolve(SKILL_DIR, '../../../projects');
    const projectDir = path.join(PROJECTS_DIR, projectName);
    const refsDir = path.join(projectDir, 'references');
    const protoDir = path.join(projectDir, 'prototype');

    // List mode
    if (listPages) {
      const screenshots = listReferenceScreenshots(refsDir);
      if (screenshots.length === 0) {
        console.log('No reference screenshots found');
      } else {
        console.log('\x1b[1mAvailable Reference Screenshots:\x1b[0m');
        for (const ss of screenshots) {
          console.log(`  ${ss.name}`);
        }
      }
      process.exit(0);
    }

    // Set paths based on page
    if (pageName) {
      referencePath = findReferenceScreenshot(refsDir, pageName);
      if (!referencePath) {
        console.error(`\x1b[31mError:\x1b[0m Reference screenshot not found for page: ${pageName}`);
        console.log('Use --list to see available screenshots');
        process.exit(1);
      }

      // Look for generated screenshot
      const generatedScreenshotsDir = path.join(protoDir, 'screenshots');
      if (fs.existsSync(generatedScreenshotsDir)) {
        const genFile = fs.readdirSync(generatedScreenshotsDir)
          .find(f => f.toLowerCase().includes(pageName.toLowerCase()) && f.endsWith('.png'));
        if (genFile) {
          generatedPath = path.join(generatedScreenshotsDir, genFile);
        }
      }

      // Set default diff output
      const diffDir = path.join(refsDir, 'diff');
      diffOutputPath = diffOutputPath || path.join(diffDir, `${pageName}-diff.png`);
    }
  }

  // Validation
  if (!referencePath || !generatedPath) {
    console.error('\x1b[31mError:\x1b[0m Both --reference and --generated are required');
    console.log('Use --help for usage information');
    process.exit(1);
  }

  // Run comparison
  (async () => {
    try {
      console.log(`\n\x1b[1mVisual Diff Comparison\x1b[0m`);
      console.log(`Reference: ${referencePath}`);
      console.log(`Generated: ${generatedPath}`);
      console.log(`Threshold: ${threshold}`);
      console.log(`Min Similarity: ${minSimilarity}%`);
      console.log('');

      const comparator = new VisualDiffComparator({
        threshold,
        minSimilarity
      });

      const result = await comparator.compare(referencePath, generatedPath, diffOutputPath);

      if (jsonOutput) {
        console.log(JSON.stringify(comparator.generateReport(), null, 2));
      } else {
        console.log(comparator.formatResults());
      }

      process.exit(result.passed ? 0 : 1);

    } catch (error) {
      console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
      process.exit(1);
    }
  })();
}

module.exports = {
  VisualDiffComparator,
  findReferenceScreenshot,
  listReferenceScreenshots
};
