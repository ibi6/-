# PayloadX README First-Screen Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the GitHub README first screen with a premium, coherent PayloadX brand presentation.

**Architecture:** Keep the presentation dependency-free: a self-contained SVG provides the hero artwork, while GitHub-compatible HTML inside Markdown controls badges, product copy, and navigation. The existing application and runtime remain untouched.

**Tech Stack:** SVG 1.1-compatible markup, GitHub Flavored Markdown, Shields.io badges

## Global Constraints

- Preserve the existing teal PayloadX brand accent.
- Do not rely on JavaScript, external fonts, or runtime dependencies.
- Do not claim capabilities beyond the current laboratory/internal-network product boundary.
- Keep all existing README destinations reachable.

---

### Task 1: Redesign the repository banner

**Files:**
- Modify: `docs/assets/banner.svg`

**Interfaces:**
- Consumes: GitHub's standard Markdown image renderer.
- Produces: A responsive `1280 × 360` standalone SVG referenced by `README.md`.

- [ ] **Step 1: Replace the banner composition**

  Build a deep navy canvas with a restrained teal glow, subtle grid, left-aligned PayloadX identity, and a right-side analysis pipeline panel. Use only system font fallbacks and inline SVG definitions.

- [ ] **Step 2: Validate SVG structure**

  Run: `[xml](Get-Content -Raw docs/assets/banner.svg) | Out-Null`

  Expected: exit code `0` with no XML parsing error.

- [ ] **Step 3: Render the asset**

  Open the local SVG in a Chromium-compatible browser at its native viewport and capture a PNG for visual inspection.

  Expected: no clipping, text collisions, missing fonts, or unintended white background.

### Task 2: Refine the README first screen

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: `docs/assets/banner.svg` and existing documentation anchors.
- Produces: A compact hero block with consistent badges, value statement, and navigation.

- [ ] **Step 1: Remove repeated hierarchy**

  Keep the product name inside the banner only. Replace the duplicate centered title with a concise value statement describing the PCAP-to-evidence workflow.

- [ ] **Step 2: Normalize badges**

  Use five `for-the-badge` shields with the same dark base and teal/ice-blue logo treatment for release, Python, React, FastAPI, and Docker.

- [ ] **Step 3: Preserve navigation**

  Keep links to quick start, architecture, API, deployment, and roadmap in one centered line.

### Task 3: Verify and deliver

**Files:**
- Test: `README.md`
- Test: `docs/assets/banner.svg`

**Interfaces:**
- Consumes: the completed visual files.
- Produces: a verified commit on `codex/ui-overall-optimization`.

- [ ] **Step 1: Run repository checks**

  Run: `npm test`, `npm run lint`, `npm run build`, `backend/.venv/Scripts/python.exe -m pytest -q`, and `git diff --check`.

  Expected: 6 frontend tests and 11 backend tests pass; lint, build, and diff checks exit `0`.

- [ ] **Step 2: Review the final diff**

  Run: `git diff -- README.md docs/assets/banner.svg docs/superpowers/specs docs/superpowers/plans`

  Expected: only the approved README presentation and its design documentation are changed.

- [ ] **Step 3: Commit and push**

  Commit with `docs: elevate README presentation`, then push `codex/ui-overall-optimization` to `origin` without force.
