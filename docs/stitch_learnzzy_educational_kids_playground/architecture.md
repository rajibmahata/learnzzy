# Learnzzy — Product & Technical Architecture Specification

## Overview
**Learnzzy** (Tagline: *Play. Think. Learn.*) is a lightweight, AI-powered educational playground for children. It offers simple, low-text, touch-friendly mini-games with zero mandatory child login, instant launch, and safe offline-capable PWA capabilities.

## Architecture & Modules
1. **Child-Facing Experience (PWA)**:
   - Zero friction entry (play immediately in <3s).
   - Core 5 Games:
     - *Number Adventure* (Visual addition)
     - *Fly Away* (Animated subtraction)
     - *Clean Up* (Visual observation & categorization)
     - *Picture Puzzle* (Spatial reasoning 4/6/9 pieces)
     - *Shadow Sketch* (Motor outline tracing)
   - Reward System: Gentle stars, badges, milestone celebrations without predatory retention mechanics.
2. **AI & Content Pipeline**:
   - Asynchronous offline generation into pooled MongoDB queues.
   - Dual-tier model abstraction (GPT-5 nano for lightweight tag/validations, GPT-5 mini for rich content planning).
   - Content pools replenished automatically when dropping below thresholds (e.g. min 30 items).
3. **Agentic Admin Portal**:
   - Natural language operations ("Create 50 Level 1 addition items", "Inspect puzzle drop-off").
   - Pool status, agent task monitor, and privacy/safety auditing.
