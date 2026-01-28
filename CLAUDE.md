# Platform Prototyping Skill - Project Context

## Platform Credentials

```
PLATFORM_URL=https://www.amazon.in/
PLATFORM_EMAIL=
PLATFORM_PASSWORD=
```

## Capture Settings

```
# Option 1: Specify pages manually (comma-separated)
PAGES_TO_CAPTURE=/homepage

# Option 2: Auto-discover all pages (set to "auto")
PAGES_TO_CAPTURE=off

# Capture options
CAPTURE_MODE=full          # "full" = all pages, "manual" = specified pages only
MAX_PAGES=50               # Maximum pages to capture in auto mode
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080
WAIT_AFTER_LOAD=2000       # ms to wait after page load
```

---

## Project Overview

Building a Claude Code skill that enables product managers and developers to rapidly prototype new features for their existing platforms by:
1. Capturing visual references (screenshots, HTML, CSS) from existing platforms
2. Storing references in an organized folder structure
3. Asking discovery questions about the new feature
4. Generating Next.js + Tailwind prototypes that match the original platform's design

## Recommended Actions

### Before Starting Any Work
1. **Read `tasks.md`** - Check current progress and find next incomplete task
2. **Read `activity.md`** - Understand what was done in previous sessions
3. **Read `prd.md`** - Reference full requirements if needed

### When Working on a Task
1. Mark task status as "In Progress" in `tasks.md`
2. Tick off each step `[ ]` → `[x]` as you complete it
3. Update the Progress Overview table counts
4. Log your work in `activity.md` with date and notes

### After Completing a Task
1. Change task status to "Complete" in `tasks.md`
2. Add entry to Completion Log table in `tasks.md`
3. Update `activity.md` with completion summary
4. Move to next task

## Key Files

| File | Purpose | When to Update |
|------|---------|----------------|
| `tasks.md` | Track progress with checkboxes | Every work session |
| `activity.md` | Log dated session summaries | Every work session |
| `prd.md` | Full PRD with requirements | Reference only |
| `PROMPT.md` | Dev commands and structure | If tech stack changes |

## Current Task Queue

1. Create skill file structure and SKILL.md
2. Implement Platform Capture (agent-browser)
3. Implement Reference Storage
4. Implement Feature Discovery
5. Implement Prototype Builder (scaffold)
6. Implement Prototype Generation
7. Integrate accessibility guidelines
8. Create end-to-end test
9. Write documentation

## Skills to Leverage

- **agent-browser-skill** - For Playwright browser automation
- **vercel-react-best-practices** - For React/Next.js optimization
- **web-design-guidelines** - For accessibility compliance

## Tech Stack for Generated Prototypes

- Next.js 14+ (App Router)
- Tailwind CSS
- shadcn/ui components
- TypeScript

## Notes

- Never log or expose credentials
- Keep captured assets local (no external uploads)
- Match original platform's design tokens exactly
- Ensure WCAG 2.1 AA accessibility compliance
