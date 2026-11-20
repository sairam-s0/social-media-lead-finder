# DESIGN SYSTEM: SOCIAL LEAD FINDER (Linear & Attio Inspired)

## 1. Core Aesthetic & Personality
- **Reference Inspiration**: Linear, Attio, Raycast.
- **Personality**: High-precision professional software, tactile speed, quiet confidence, maximum data density without visual clutter, crisp micro-borders, functional monochrome with single purposeful status marks.
- **Anti-Patterns Eliminated**:
  - No generic blue-purple SaaS gradients.
  - No bloated cards floating with soft blurry drop-shadows.
  - No electric-blue border accents on dark navy containers.
  - No oversized empty charts taking up viewport real estate.
  - No decorative emojis in action buttons or section titles.
  - No fake metric deltas or meaningless badges.

## 2. Surfaces & Palette
- **Canvas Base (`bg-surface-0`)**: `#090a0f` (True neutral deep black-slate)
- **Sub-surface / Row (`bg-surface-1`)**: `#0f1117`
- **Elevated / Popovers / Modals (`bg-surface-2`)**: `#161922`
- **Border Subtle (`border-subtle`)**: `#1f2430` (Crisp 1px hair-lines)
- **Border Strong (`border-strong`)**: `#2d3345`
- **Text Primary**: `#ededef` (Neutral off-white, high readability)
- **Text Secondary / Metadata**: `#8a8f9e` (Cool muted grey)
- **Text Dim**: `#555a68`
- **Accent (Single deliberate action color)**: `#5e6ad2` (Linear-style soft indigo-violet) or `#ffffff` for primary solid actions.
- **Semantic Signals (Strictly functional, 10px indicator dots/subtle chips)**:
  - New: `#38bdf8` (Sky)
  - Contacted: `#fbbf24` (Amber)
  - Qualified: `#34d399` (Mint emerald)
  - Converted: `#a78bfa` (Iris purple)
  - Rejected: `#71717a` (Muted zinc)

## 3. Layout Principles
- **Density & Efficiency**: Tables and lists instead of repetitive card blocks. Information flows in structured rows with aligned columns.
- **Height & Spacing**: 100vh app view without runaway overscroll. The content container fits within `overflow-y-auto` without arbitrary blank trailing margins.
- **Contextual Commands**: Quick keyboard-friendly actions directly adjacent to data items.
- **Empty States**: Meaningful, contextual guidance explaining what data is missing and the exact single action needed to populate it.
