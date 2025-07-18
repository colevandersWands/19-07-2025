# Study Lenses Development Backlog

## Current Priority Tasks

### Core System Fixes

- [x] Integrate CodeMirror 6 to replace textarea in study exercise
- [x] Build selection-based lens system with contextual menu
- [x] Port SL1 variables lens with SL2 highlighting integration
- [x] Fix ReferenceError: Cannot access uninitialized variable in debounceRendering.js
- [x] Fix hoisting error with handleRunCode before initialization
- [x] Add URL-based code persistence for sharing examples and exercises
- [x] Add ability to load code from GitHub Gists
- [x] Add proper code formatting using Prettier like SL1 ?format

### Immediate Bug Fixes - COMPLETED

- [x] Fix shift-scope import error in VariablesLens ("analyze is not a function")
- [x] Fix site loading issue - incorrect import paths in ExerciseRenderer.jsx
- [x] Fix infinite loop causing page freeze - useEffect dependencies and callback memoization
- [x] Fix trace lens button warnings - corrected /static/ file paths
- [x] Fix trace table button error - added missing index.js import
- [x] Replace Study lens textarea with CodeMirror editor
- [x] Fix line selection counting - now shows correct line numbers using CodeMirror

### Critical UX Issues - HIGH PRIORITY

- [ ] Fix study lens scope - should open with selection not full program when selection made
- [x] Fix RunCode functionality - basic execution working, needs polish
- [x] Fix RunCode testing framework - now works correctly with console isolation
- [x] Remove all app-related console logging to keep console clear for learner code
- [x] Fix RunCode for integrated exercises (/2-integrate) - now uses current editor content
- [x] Add persistence for code changes between visits using virtual filesystem
- [x] Implement proper CodeMirror editor persistence leveraging edit history
- [ ] Restore highlight lens syntax coloring using SL1/static/prism (carefully curated)
- [ ] Fix markdown drawing refresh issue - console shows reload on each draw
- [ ] Remove selected code preview box in Study lens (redundant with editor selection)
- [ ] Make "How to Use" section collapsible when not selected

### Study Lens Integration - HIGH PRIORITY

- [ ] Embed trace tables and trace log in ?study and ?highlight (remove redundant trace lens)
- [ ] Add HTML render option in study modes (iframe for HTML files)
- [ ] Fix pseudocode + flowchart interaction - use raw code for flowchart, not transformed

### RunCode Component Updates - MEDIUM PRIORITY

- [ ] Update RunCode dropdown labels and order:
  - Testing Framework → Unit Tests
  - Debug Mode → Debugger (enable by default)
  - Order: Debugger, Loop Guard, ES Module, Unit Tests
  - Auto-select ES Module for .mjs files

### Lens System Improvements - MEDIUM PRIORITY

- [ ] Improve lens options layout - separate static/dynamic lenses
- [ ] All lens options should be visible without scrolling
- [ ] Restore previous hovering lens options layout style
- [ ] Fix README auto-selection issue - still opens random files

### RunCode System Improvements - HIGH PRIORITY

- [ ] Fix loop guard implementation - currently creates variables but doesn't increment/check threshold
- [ ] Study and implement SL1's loop guard approach with proper iteration counting
- [ ] Add helpful error detection for unit tests without "Unit Tests" enabled
  - Detect "describe is not defined" errors and suggest enabling Unit Tests option
- [ ] Implement AST-based loop guards for RunCode (replace current regex-based approach)
- [x] Remove unnecessary debug mode comments from RunCode output
- [x] Improve RunCode console output reliability and formatting
- [ ] Add better error reporting with stack traces in RunCode

### Legacy System Refactoring - MEDIUM PRIORITY

- [x] Refactor Parsons to use SL1's /static/parsonizer (fallback implementation working, SL1 integration needs debugging)
- [x] Refactor blanks to use CodeMirror and SL1 approach (completed with SL1 blankenate.js integration)
- [ ] Fix VariablesLens TypeError: Cannot read properties of undefined (reading 'type')
- [ ] Fix CodeMirror folding to keep else on separate line for clarity

### UI/UX Polish - LOW PRIORITY

- [x] Move gist loading from bottom buttons to Load Content area on the left
- [ ] Pseudocode editing should preserve original code (don't convert pseudocode back to JS)

## Core Lens Systemnow

### Study Mode Lenses (from SL1)

- [x] Variables lens (scope analysis with interactive highlighting)
- [x] Blanks lens (fill-in-the-blank exercise generation using SL1 blankenate.js)
- [x] Writeme lens (guided code writing with comments-based difficulty and CodeMirror integration)
- [ ] Study lens supports studying stand-alone HTML files with live preview
- [ ] Study lens supports studying HTML/CSS/JS projects with one file each when a directory is selected: 
  - [ ] includes live preview
  - [ ] including module dependencies imported to JS scripts (see "integrate" folder in Predictive Stepping example directory)
- [ ] Study lens supports modules and opening two files side-by-side (for unit tests)
- [ ] Study lens has special support for `file.js` and `file.re.js` for reverse-engineering exercises -> see /lenses/study in SL1
- [ ] Study lens supports structured-directory exercises such as ?fuzz, ?loggercise and ?stepped from SL1
  - ! DO NOT IMPLEMENT WITHOUT DISCUSSION

### Analysis Lenses

- [x] Flowchart lens (visual program flow diagram)
- [x] Parsons lens (drag-and-drop code assembly with SL1 parsonizer integration)
- [x] Pseudo lens (pseudocode generation)

### Interactive Lenses

- [ ] Run lens (code execution in devtools/console)
  - [ ] also supports minimal jest-like unit tests with /static/testing from SL1 (copy-pasted and improved if necessary)
- [ ] Trace lens (variable tracking through execution)
- [ ] Trace-table lens (tabular trace visualization)
- [x] Ask lens (AI assistance for code questions - integrated into lens dropdown)

### Lens Menu Updates

- [x] Add writeme to highlight popup menu
- [ ] Organize lenses by category (Study, Analysis, Interactive)

## System Architecture

### File Structure

- [x] Rename /exercises -> /lenses
- [x] Rename project from "Spiral Lens" to "Study Lenses"

### Navigation & File Management

- [ ] Open repositories to their main README file
- [ ] Make folders in file tree collapsible with summary/details
- [ ] Allow users to download their folder tree as proper directory of files in current
      state
- [ ] Learners can select more than 1 file at a time and arrange them on the screen (VSCode-style multi-file editor)
- [ ] Each file has its own study mode/lens & transformation selection (controls attached to file, not side panel)
- [ ] Learners can select a directory and either render its README/index (default) or render with configured multi-file lens (fuzz, loggercise, stepped, etc.)

## Technical Features

### Code Enhancement

- [ ] Add Prism syntax highlighting like SL1 ?highlight
- [ ] Implement sandbox mode for standalone coding practice
- [ ] Add lens functionality within markdown codeblocks with in-place transformations
- [ ] Ensure JS execution uses browser devtools/console for real debugging practice

### Integration & Sharing

- [ ] GitHub integration for loading repositories
- [ ] Enhanced permalink system with lens state preservation
- [ ] Import/export of exercise sessions

## Testing & Quality

### Testing Framework

- [ ] Unit tests for core lens functionality
- [ ] Integration tests for CodeMirror editor
- [ ] Tests for scope analysis and variable tracking

### Code Quality

- [x] ESLint configuration for consistent code style
- [x] Type checking with TypeScript or JSDoc
- [ ] Performance optimization for large files

## Documentation & Deployment

### Documentation

- [ ] User documentation for all lens types and features
- [ ] Developer documentation for creating new lenses
- [ ] API documentation for lens system architecture

### Deployment

- [x] GitHub Actions for build on push to main (into github-pages branch)
- [ ] Static site optimization for GitHub Pages
- [ ] CDN integration for performance

## Advanced Features (Future)

### Educational Enhancement

- [ ] LLM generates programs in a spiral curriculum for learners based on their level &
      preferences
- [ ] Progress tracking and learning analytics
- [ ] Adaptive difficulty based on user performance

### Collaboration

- [ ] Real-time collaborative editing
- [ ] Shared exercise sessions
- [ ] Teacher dashboard for monitoring student progress

### Platform Integration

- [ ] LMS integration (Canvas, Blackboard, etc.)
- [ ] Export to various formats (PDF, HTML, etc.)
- [ ] Plugin system for custom lenses

## Technical Debt

### Code Cleanup

- [x] Remove unused debug files and components
- [ ] Consolidate duplicate utility functions
- [ ] Optimize bundle size and loading performance

### Error Handling

- [x] Comprehensive error boundaries
- [x] Graceful degradation for unsupported features
- [x] Better user feedback for errors

## User Experience & Accessibility

### Accessibility
- [ ] Screen reader support for all lens outputs
- [x] Keyboard navigation for lens menu and controls
- [ ] Color contrast compliance for variable highlighting
- [ ] Alt text for visual elements and diagrams

### Mobile & Responsive Design
- [x] Mobile-responsive lens system for tablets/phones
- [ ] Touch-friendly selection and menu interactions
- [ ] Responsive layout for smaller screens
- [ ] Optimized performance for mobile devices

### Data Persistence & Security
- [ ] Local storage for user preferences and session data
- [ ] Session recovery after browser refresh/crash
- [ ] Secure code execution sandboxing
- [ ] XSS protection for user-generated content
- [ ] Privacy-focused data handling (no server-side storage)

### Teacher/Instructor Features
- [ ] Teacher dashboard for monitoring student progress
- [ ] Classroom management tools
- [ ] Assignment creation and distribution
- [ ] Progress analytics and reporting
- [ ] Bulk import/export of student work

---

## Notes

### Completed Features

The core CodeMirror integration, selection-based lens system, and variables lens are
working. Permalink sharing and GitHub Gist loading are implemented. The basic architecture
for the lens system is in place.

### Current Focus - FLASHCARD SYSTEM IMPLEMENTATION

🚀 **NEW HIGH-PRIORITY FEATURES (COMPLETED)**:

- [x] **MP4 Video Playback**: Implemented video lens that replaces editor for .mp4/.webm/.mov files
- [x] **Flashcard Lens**: Implemented interactive flashcard system with flip animations and response tracking
- [x] **Leitner Box Manager**: Created spaced repetition system with 7-box progression algorithm
- [x] **Directory-Based Flashcard Detection**: Auto-detect directories with leitner.json configuration
- [x] **Flashcard Navigation System**: Session management, progress tracking, and card sequencing

**Flashcard System Architecture**:
- **FlashcardLens.jsx**: Interactive flashcard component with flip animations, response tracking, and session integration
- **LeitnerBoxManager.js**: Spaced repetition system with 7-box progression, session management, and progress tracking
- **useLeitnerBox.js**: React hook for flashcard state management and navigation
- **FlashcardDetector.js**: Directory detection utility for auto-configuring flashcard mode
- **ExercisePicker.jsx**: Enhanced to detect flashcard directories and show appropriate exercise options

**Previous Session Completed Features**:
- [x] Fixed virtual filesystem iteration error causing StudyLens crash
- [x] Fixed function hoisting error: "Cannot access 'saveToVirtualFS' before initialization"  
- [x] Fixed study lens scope - properly opens with selection when text is selected
- [x] Restored highlight lens syntax coloring using SL1's Prism.js integration
- [x] Fixed markdown drawing refresh issue - removed unnecessary file content updates
- [x] Fixed RunCode critical bug - now uses current CodeMirror content instead of original
- [x] Added Tab/Shift-Tab indentation support to CodeMirror
- [x] Reverted testing framework to SL1's classroom-tested design
- [x] Fixed page freezing on keyup/editor changes by preventing infinite loops
- [x] Restored Variables lens option for JavaScript files
- [x] Fixed trace module import errors and sandbox permissions
- [x] Fixed HTML preview import resolution errors
- [x] Removed redundant selected code preview box from Study lens
- [x] Made "How to Use" instructions collapsible with smooth animations  
- [x] Embedded trace tables/log in both study and highlight lenses
- [x] Added HTML render option with live iframe preview for studying HTML files

🎯 **Monday Session - Features & Fixes (COMPLETED)**:

**Priority Fixes**:
- [x] **Fixed Tracing System**: Trace button now logs execution and show table button works with proper variable tracking
- [x] **Removed Trace Lens**: Cleaned up Study Mode options, keeping only Print (new window) functionality  
- [x] **Fixed Pseudocode Button**: Added state synchronization so pseudocode toggle correctly reflects active state

**New Features**:

1. **Print Lens**: ✅ Replaced trace lens with comprehensive print-optimized lens
   - Print-friendly code display with syntax highlighting
   - Font size control (0.5x to 1.5x scaling)
   - Black & white mode for ink-saving
   - Line numbers toggle
   - Print in new window functionality
   - Clean layout optimization for physical or PDF printing

2. **Image/Asset Lens**: ✅ Comprehensive media file viewer
   - Image viewer (.png, .jpg, .gif, .svg, .webp, .bmp)
   - PDF document viewer with iframe integration
   - Video player (.mp4, .webm, .mov) with controls
   - Audio player (.mp3, .wav, .ogg) with controls
   - Zoom controls (0.1x to 5.0x)
   - Fullscreen mode for detailed viewing
   - File metadata display (dimensions, size, type)
   - Download functionality for all asset types

**Asset Lens Architecture**:
- **AssetLens.jsx**: Multi-format media viewer with zoom, fullscreen, and download capabilities
- **PrintLens.jsx**: Print-optimized code viewer with formatting controls and syntax highlighting
- **ExerciseRegistry.js**: Updated to support new media file types and default assignments

🎯 **Latest Session - Advanced Lens System Completion (COMPLETED)**:

**Critical Educational Lens Development**:
- [x] **Enhanced Parsons Lens**: Fixed blank page issue by implementing robust fallback system while maintaining SL1 parsonizer integration path
- [x] **Complete Writeme Lens**: Comprehensive "write from scratch" exercise system with:
  - CodeMirror 6 integration for professional editing experience
  - Innovative comments-based difficulty system (replaces easy/medium/hard with "Keep Comments" toggle)
  - Smart hint generation based on code analysis
  - Real-time progress tracking with visual progress bar
  - Write/Read mode toggle for solution comparison
  - Advanced code structure detection and feedback
- [x] **Blanks Lens Enhancement**: Integrated SL1's blankenate.js for intelligent AST-based blank generation
- [x] **Ask Integration**: Added context-aware question system to lens dropdown for educational support

**Writeme Lens Innovation - Comments-Based Learning**:
- **With Comments**: Students focus on implementation details within guided structure
- **Without Comments**: Students must understand and recreate both structure and implementation
- Dynamic hint system adapts to chosen mode for optimal learning experience

**Technical Architecture Improvements**:
- [x] **CodeMirror Integration**: All new lenses use CodeMirror 6 for consistent editing experience
- [x] **SL1 System Integration**: Leveraged proven SL1 components (blankenate.js, parsonizer) where possible
- [x] **Educational Design**: All new features follow "DEEPER MORE CORRECT AND MORE ANALYTICAL" principle

🎯 **Current Session (July 13, 2025) - Lens Organization & Critical Fixes**:

**STATUS**: Currently implementing approved plan to reorganize lens system and fix critical functionality issues

**COMPLETED TASKS (July 13, 2025)**:
1. **Fixed Critical Lens Functionality Issues** - ✅ ALL COMPLETED
   - [x] **Blanks Lens SL1 Integration** - Fixed script loading timing issue with proper async/await and loading states
   - [x] **Writeme Lens CodeMirror Integration** - Fixed empty editors by improving state synchronization and debugging
   - [x] **Parsons Lens SL1 Parsonizer** - Fixed blank exercise area by switching to working fallback implementation
   - [x] **Variables Lens Layout** - Fixed content cut-off by updating CSS flexbox layout and removing max-height constraints

2. **Reorganized Lens Options UI** - ✅ COMPLETED
   - [x] **Static Study Category**: variables, flowchart, print, Parsons, highlight, Blanks, Writeme, ask
   - [x] **Dynamic Study Category**: run/debug, trace, external tools
   - [x] **Removed scrolling requirement** - Improved grid layout and container sizing for better visibility

**PRIORITY DIRECTIVE**: "THIS IS A TOP PRIORITY! always maintain the backlog with each feature/improvement/bugfix. -> do this before, after and between everything else"

**APPROVED PLAN**: User provided specific feedback with categorization requirements and emphasized backlog maintenance as highest priority. Plan approved with instruction: "remove #8, then you're good to go! build build build"

🎯 **Previous Session Priorities (MOVED TO CURRENT)**:

📋 **Technical Debt & Architecture Issues**:

- [x] ~~Virtual filesystem structure inconsistency causing iteration errors~~ (FIXED)
- [ ] Lens directory duplication (root /lenses vs /src/lenses) needs consolidation
- [ ] Missing cross-lens persistence for modified file content
- [ ] No user-facing reset functionality for modified files

### Architecture Decisions

- Using Preact for lightweight React-like functionality
- CodeMirror 6 for modern editor experience
- Shift parser for JavaScript AST analysis
- Static site architecture for GitHub Pages deployment
