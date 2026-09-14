# Learnzzy — Project Details

## 1. Project Overview

**Project Name:** Learnzzy  
**Tagline:** Play. Think. Learn.

Learnzzy is a lightweight, AI-powered educational playground for children. The platform provides very simple games that teach foundational skills through visual interaction, animation, repetition, and adaptive difficulty.

The product is intentionally different from conventional children's gaming websites:

- No unnecessary games.
- No complicated child-facing forms.
- No mandatory child login for the MVP.
- No advertisements in the learning experience.
- No dependency on an LLM during gameplay.
- Learning objectives are built into every game.
- AI operates primarily in the background to create, validate, organize, and improve content.

## 2. Product Vision

Build a small, joyful digital learning environment where a child can open the site and immediately start playing.

### Core principle

> PLAY → THINK → LEARN → CREATE

The child should experience the product as a fun game platform. Parents and administrators should see the educational value and intelligent content management behind it.

## 3. Initial Games

### 3.1 Number Adventure — Addition

**Learning objectives**
- Counting
- Number recognition
- Basic addition
- Visual quantity understanding

Example:

3 apples + 2 apples = ?

The child selects the correct answer from large number buttons.

The addition is represented visually before the answer is requested.

### 3.2 Fly Away — Subtraction

**Learning objectives**
- Subtraction
- Counting remaining objects
- Visual reasoning

Example:

5 birds are shown. 2 fly away.  
How many birds remain?

The animation communicates the subtraction instead of relying only on text.

### 3.3 Clean Up

**Learning objectives**
- Observation
- Attention
- Categorization
- Counting
- Environmental awareness

A colourful scene contains objects that need to be cleaned. The child identifies and taps the objects.

Possible environments:

- Bedroom
- Classroom
- Playground
- Garden
- Park
- Beach

### 3.4 Picture Puzzle

**Learning objectives**
- Spatial reasoning
- Visual recognition
- Problem solving
- Hand-eye coordination

A simple image is divided into pieces. The child drags pieces into the correct locations.

Initial difficulty:

- Level 1: 4 pieces
- Level 2: 6 pieces
- Level 3: 9 pieces

### 3.5 Shadow Sketch

**Learning objectives**
- Fine motor skills
- Shape recognition
- Visual recognition
- Drawing/tracing

The child traces a simple outline using a finger, stylus, or mouse.

The first version should evaluate completion and path coverage using browser-side logic. AI vision can be introduced later.

## 4. Dynamic Content

The game mechanics remain stable while content changes continuously.

Examples:

- Apples
- Bananas
- Fish
- Balloons
- Birds
- Butterflies
- Cars
- Rockets
- Friendly animals

Themes can include:

- Jungle
- Ocean
- Space
- Farm
- Garden
- Classroom
- Playground

The system should use a combination of:

1. Pre-generated content
2. Deterministic variation
3. AI-generated content

This provides freshness without making every interaction dependent on AI.

## 5. Child Experience

The child-facing experience should be:

- Fast
- Visual
- Playful
- Safe
- Touch-friendly
- Low-text
- Responsive
- Accessible

Typical flow:

Home
→ Select Game
→ Short Visual Introduction
→ Play
→ Instant Feedback
→ Stars
→ Next Activity / Home

A child should be able to begin playing within seconds of opening the site.

## 6. Reward System

Use simple educational rewards:

- Stars
- Badges
- Milestones
- Gentle celebration animations

Avoid gambling-like mechanics, loot boxes, or manipulative engagement patterns.

## 7. AI Role

AI is a supporting intelligence layer, not the game engine.

AI can:

- Generate educational content
- Generate content variations
- Create themes
- Recommend difficulty
- Manage asset metadata
- Validate age suitability
- Analyze aggregated learning signals
- Replenish content pools

Deterministic application code must handle:

- Arithmetic
- Answer validation
- Scoring
- Animations
- Touch events
- Drag/drop
- Drawing
- Timers
- Game state

## 8. AI Model Strategy

The architecture should support GPT-5 nano and GPT-5 mini through a model abstraction layer.

Use smaller/cheaper models for:

- Classification
- Tagging
- Metadata
- Simple validation
- Lightweight decisions

Use a stronger model when necessary for:

- Rich content generation
- Content planning
- Difficulty recommendations
- More complex agent tasks

Never hard-code business logic around a specific model.

## 9. Content Pool

Content is generated asynchronously and stored before being served to children.

Example initial pool:

- Addition: 100 items
- Subtraction: 100 items
- Cleaning: 30 scenes
- Puzzle: 30 puzzles
- Sketch: 30 drawings

When a pool drops below a configured threshold, an agent creates additional content.

Example:

Addition pool = 17  
Threshold = 30

→ Content Agent creates 50  
→ Deterministic validation  
→ Quality/Safety validation  
→ Approved content stored  
→ Pool increases to 67

## 10. PWA

Learnzzy is PWA-first.

It must support:

- Android
- iPhone
- iPad
- Tablets
- Desktop
- Touch
- Mouse/trackpad
- Portrait
- Landscape

PWA capabilities:

- Installability
- App manifest
- Service worker
- Offline app shell
- Cached game assets
- Offline gameplay where practical
- Background event synchronization

## 11. Performance Goals

Prioritize:

- Fast startup
- Small initial bundle
- Code splitting
- Lazy loading
- Optimized images
- CDN delivery
- Cached content
- No synchronous AI generation during gameplay

The child should never wait for an LLM to answer a simple game question.

## 12. Privacy and Safety

The product is designed for children, so privacy and safety are first-class requirements.

Avoid collecting unnecessary:

- Names
- Email addresses
- Phone numbers
- Precise location
- Photos
- Public profiles

Do not expose child activity publicly.

Generated content and images must be validated before publication.

Do not include:

- Violence
- Weapons
- Scary imagery
- Adult themes
- Public child-to-child communication
- Advertising in the game experience

## 13. Admin Experience

The admin area is protected by authentication.

Suggested routes:

- `/admin/login`
- `/admin`
- `/admin/agents`
- `/admin/content`
- `/admin/assets`
- `/admin/analytics`
- `/admin/system`
- `/admin/settings`

The admin interface should be agentic rather than a traditional form-heavy CRUD application.

Admins should be able to issue high-level instructions such as:

> Create 50 Level 1 addition activities.

or:

> Find why puzzle completion is lower this week.

The system should execute appropriate agent workflows and show operational summaries.

## 14. Technology Direction

Recommended stack:

- Next.js
- TypeScript
- Tailwind CSS
- Phaser 3
- MongoDB
- MongoDB driver / Mongoose
- Redis
- BullMQ
- GPT-5 nano / GPT-5 mini
- S3-compatible object storage
- Cloudflare/CDN
- Docker
- Nginx
- Sentry/structured logging

Reuse existing repository infrastructure wherever practical.

## 15. MVP Definition

The MVP is complete when:

- All five games work.
- Games work smoothly on phones and iPad.
- PWA works.
- Content is structured.
- Content is validated.
- Content can be dynamically varied.
- AI content generation works asynchronously.
- Content pools can be replenished.
- Admin authentication works.
- Agent dashboard works.
- Basic analytics work.
- AI keys remain server-side.
- Offline fallback works for the application shell.
- No unnecessary AI calls occur during gameplay.
- Production build succeeds.

## 16. Long-Term Expansion

Future games may include:

- Memory Match
- Shape Matching
- Pattern Completion
- Sorting
- Word Recognition
- Colour Matching
- Counting Objects
- Sequence Games
- Simple Science Activities

The architecture must allow new games to be added as modules without rewriting the platform.
