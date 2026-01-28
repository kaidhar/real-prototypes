# What We Need to Build the Platform Prototype Skill Properly

## Executive Summary

The current implementation has 2 critical gaps:
1. **Capture Quality**: Pages not loading fully, 404s, incomplete scraping
2. **Design Recreation**: Generated prototypes look completely different from the original

To fix this, we need to build a comprehensive system that:
- Captures platforms with 100% reliability
- Extracts every design detail (CSS, layouts, components)
- Recreates the EXACT design pixel-perfect
- Blends new features naturally so they're indistinguishable

---

## Core Problem Statement

**Current State:**
- You capture a platform (e.g., Sprouts ABM)
- You ask for a new feature (e.g., AI chat agent)
- Claude generates a NEW design from scratch
- Result: Looks nothing like the original platform

**Desired State:**
- You capture a platform with ALL design details
- You ask for a new feature
- Claude recreates the EXACT original design
- Claude adds the new feature using the SAME design patterns
- Result: Looks like the original platform, user can't tell what's new

---

## What Needs to Be Built

### 1. Robust Capture System

**Current Issues:**
- Pages screenshot before loading ❌
- 404 errors not handled ❌
- Missing CSS files ❌
- No design token extraction ❌

**What We Need:**
```
Enhanced Capture Script that:
├── Waits for full page load (networkidle0)
├── Validates page loaded (status 200, elements present)
├── Retries on failures (404, timeout)
├── Captures:
│   ├── Screenshot (full page, fully loaded)
│   ├── HTML (complete structure)
│   ├── All CSS files (external + inline)
│   ├── Computed styles (all elements)
│   ├── Design tokens (colors, fonts, spacing)
│   ├── Component patterns (buttons, forms, cards)
│   └── Layout structure (grid, flex, positions)
└── Generates comprehensive manifest
```

**Tools Needed:**
- Playwright (already have)
- CSS extraction library (`computed-style-to-inline-style`)
- Better wait strategies (networkidle, element selectors)
- Retry logic with exponential backoff

---

### 2. Design System Extractor

**Current Issues:**
- Only extracts basic colors ❌
- No typography extraction ❌
- No spacing/layout extraction ❌
- No component detection ❌

**What We Need:**
```
Design System Extractor that captures:

COLORS:
├── Every hex/rgb/hsl value used
├── Primary, secondary, accent colors
├── Text colors (all shades)
├── Background colors
├── Border colors
└── Generates color palette with names

TYPOGRAPHY:
├── All font families used
├── Font sizes (h1-h6, body, small)
├── Font weights (100-900)
├── Line heights
├── Letter spacing
└── Generates typography scale

SPACING:
├── All margin values
├── All padding values
├── Gap values (grid/flex)
├── Common patterns (8px grid? 4px grid?)
└── Generates spacing scale (xs, sm, md, lg, xl)

COMPONENTS:
├── Button styles (all variants)
├── Input/form styles
├── Card/panel styles
├── Navigation patterns
├── Modal/dialog patterns
└── Icon styles

LAYOUT:
├── Grid systems used
├── Flexbox patterns
├── Column widths
├── Breakpoints (mobile, tablet, desktop)
└── Max widths, containers

OUTPUT:
└── design-system.json (complete design system)
└── tailwind.config.ts (tailwind extension)
└── globals.css (CSS variables)
```

**Tools Needed:**
- Playwright element inspector
- CSS parser library
- Pattern matching algorithms
- Claude vision API (analyze screenshots)

---

### 3. Component Recreation Engine

**Current Issues:**
- Generates generic components ❌
- Doesn't match original design ❌
- Uses wrong colors, fonts, spacing ❌

**What We Need:**
```
Component Cloning System:

INPUT:
├── Screenshot of original component
├── HTML structure
├── CSS styles
└── Design system tokens

PROCESS:
├── Analyze visual appearance
├── Map to React component structure
├── Use EXACT colors from design system
├── Use EXACT fonts from design system
├── Use EXACT spacing from design system
├── Preserve interaction patterns
└── Add accessibility (ARIA, keyboard nav)

OUTPUT:
└── React component that looks IDENTICAL to original

VALIDATION:
├── Screenshot generated component
├── Compare to original (pixel diff)
├── If diff > 5%, refine and retry
└── Continue until indistinguishable
```

**Tools Needed:**
- `pixelmatch` or `resemblejs` (visual diff)
- Claude vision API (validate match)
- Template generation system
- Iterative refinement loop

---

### 4. Smart Feature Integration

**Current Issues:**
- New features use different design ❌
- Don't fit naturally ❌
- Feel bolted on ❌

**What We Need:**
```
Context-Aware Feature Generator:

1. ANALYZE REQUEST:
   "Add AI chat agent"

2. FIND SIMILAR PATTERNS:
   ├── Look for existing chat UI
   ├── Look for similar floating elements
   ├── Look for existing modal patterns
   └── Identify design patterns to mimic

3. GENERATE USING ORIGINAL PATTERNS:
   ├── Use same button styles
   ├── Use same color scheme
   ├── Use same typography
   ├── Use same spacing
   ├── Use same border radius
   ├── Use same shadows
   └── Use same animation patterns

4. BLEND NATURALLY:
   ├── Place in logical location
   ├── Follow existing layout grid
   ├── Match interaction patterns
   └── Ensure visual consistency

RESULT:
└── Feature feels native to the platform
└── User can't tell it wasn't there originally
```

**Tools Needed:**
- Pattern matching algorithms
- Component similarity scoring
- Layout analysis
- Claude for intelligent placement decisions

---

### 5. Quality Validation System

**What We Need:**
```
Automated Quality Gates:

CAPTURE VALIDATION:
├── ✓ All pages loaded (0 failures)
├── ✓ All screenshots show loaded content
├── ✓ All CSS files captured
├── ✓ Design system extracted
└── ✓ Component patterns identified

RECREATION VALIDATION:
├── ✓ Visual diff < 5%
├── ✓ Colors match exactly
├── ✓ Typography matches exactly
├── ✓ Spacing matches exactly
└── ✓ Layout structure matches

FEATURE VALIDATION:
├── ✓ New feature uses design system
├── ✓ Blends visually with original
├── ✓ No design inconsistencies
└── ✓ Manual review confirms seamless integration

ACCESSIBILITY VALIDATION:
├── ✓ WCAG 2.1 AA compliance
├── ✓ Keyboard navigation works
├── ✓ Screen reader friendly
└── ✓ Color contrast sufficient

PERFORMANCE VALIDATION:
├── ✓ Lighthouse score > 90
├── ✓ Bundle size acceptable
└── ✓ No performance regressions
```

**Tools Needed:**
- Visual regression testing suite
- Accessibility testing tools
- Lighthouse CI
- Manual review process

---

## Skills We Need to Integrate

### 1. web-design-guidelines (CRITICAL)
**Why:** Ensures accessibility without breaking design
**Usage:**
- Validate color contrast
- Check ARIA labels
- Validate keyboard navigation
- Ensure semantic HTML
- Fix accessibility while preserving design

### 2. vercel-react-best-practices (IMPORTANT)
**Why:** Optimizes React/Next.js code
**Usage:**
- Component structure optimization
- Image optimization
- Code splitting
- Performance optimization
- Bundle size optimization

### 3. agent-browser-skill (ALREADY USING)
**Why:** Browser automation for capture
**Enhancements Needed:**
- Better wait strategies
- Retry logic
- Error handling
- CSS extraction
- Design token extraction

---

## Implementation Architecture

```
┌─────────────────────────────────────────────────┐
│           PLATFORM PROTOTYPE SKILL              │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   ┌────────┐   ┌─────────┐   ┌──────────┐
   │CAPTURE │   │ DESIGN  │   │ FEATURE  │
   │ ENGINE │──▶│ SYSTEM  │──▶│GENERATOR │
   └────────┘   │EXTRACTOR│   └──────────┘
                └─────────┘         │
                     │               │
                     ▼               ▼
              ┌──────────────────────────┐
              │   VALIDATION SYSTEM      │
              ├──────────────────────────┤
              │ • Visual Diff            │
              │ • Accessibility Check    │
              │ • Performance Check      │
              │ • Manual Review          │
              └──────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  GENERATED PROTOTYPE │
              │  (Pixel-Perfect)     │
              └──────────────────────┘
```

---

## What I Need From You

### 1. Confirmation on Approach
- Does this align with your vision?
- Any additional requirements?
- Any specific platforms/patterns to prioritize?

### 2. Priorities
Which sprint should we tackle first?
- Sprint 1: Capture + Design System (Foundation)
- Sprint 2: Component Recreation (Core)
- Sprint 3: Quality & Best Practices (Polish)

### 3. Testing Platform
- Should we use Sprouts ABM for testing?
- Or a simpler platform first?
- What feature should we prototype?

### 4. Success Criteria
How will you measure success?
- Visual similarity % acceptable?
- Manual review acceptable?
- Specific features to test?

---

## Timeline Estimate

**Sprint 1: Foundation (Capture + Design System)**
- Task 1.1: Robust scraping - 2 days
- Task 1.2: CSS extraction - 2 days
- Task 2.1: Design system generator - 3 days
- **Total: ~1 week**

**Sprint 2: Core (Component Recreation)**
- Task 2.2: Component recreation - 3 days
- Task 1.3: Layout analysis - 2 days
- Task 2.3: Layout recreation - 2 days
- **Total: ~1 week**

**Sprint 3: Quality (Best Practices + Testing)**
- Task 3.1: Web design guidelines - 1 day
- Task 3.2: React best practices - 1 day
- Task 5.1: Visual regression - 2 days
- **Total: ~4 days**

**Total Implementation: ~2.5 weeks**

---

## Immediate Next Steps

1. **Review this document**
   - Confirm approach is correct
   - Clarify any questions
   - Set priorities

2. **Start Sprint 1**
   - Build robust capture script
   - Build CSS extractor
   - Build design system generator

3. **Test on Real Platform**
   - Capture Sprouts ABM properly
   - Extract complete design system
   - Validate quality

4. **Iterate Based on Results**
   - Refine based on findings
   - Add missing capabilities
   - Improve accuracy

---

## Questions for You

1. **Does this approach solve your problems?**
   - Capture reliability
   - Design matching
   - Natural feature integration

2. **What's the priority order?**
   - Get capturing right first?
   - Or start with design recreation?

3. **What platform should we test on?**
   - Sprouts ABM?
   - Something simpler first?

4. **What's the acceptable similarity threshold?**
   - 95% match? 99% match?
   - Pixel-perfect required?

5. **Should we start building now?**
   - Which sprint first?
   - All at once?
   - Incremental?
