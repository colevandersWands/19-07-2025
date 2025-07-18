# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Basic Development
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production to `dist/`
- `npm run preview` - Preview production build

### Code Quality
- `npm run lint` - Run ESLint and auto-fix issues
- `npm run lint:check` - Check linting without fixing
- `npm run type-check` - Run TypeScript type checking (with JSDoc)

### Testing
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Run tests with coverage report

## Project Architecture

### Core Application Structure
**Study Lenses v2.0** is a learning platform for studying code through interactive "lenses" (different views/exercises). The app uses Preact with a context-based state management system.

### Key Architectural Components

**Main App Flow:**
1. `src/main.jsx` → `src/App.jsx` → Context Providers → `ExerciseRenderer`
2. Virtual File System (`fs.js`) manages code files and GitHub repository loading
3. Exercise system dynamically loads different "lens" components based on user selection
4. CodeMirror 6 provides the core editing experience

**Context System:**
- `AppContext` - Global app state (current file, exercise, virtual FS)
- `ToastContext` - User notifications
- `ColorizeContext` - Syntax highlighting preferences
- `ExerciseManager` - Exercise lifecycle and transforms

**Lens Architecture:**
All interactive study modes are implemented as "lenses" in `src/lenses/`:
- `StudyLens` - Main code editing with scope-based selection
- `HighlightLens` - Code annotation and flowchart generation
- `BlanksLens` - Fill-in-the-blank exercises
- `ParsonsLens` - Drag-and-drop code arrangement
- `FlashcardLens` - Spaced repetition learning
- `TracingLens` - Code execution tracing
- `VariablesLens` - Variable tracking visualization
- `WritemeLens` - Code writing exercises
- `FlowchartLens` - Flowchart generation
- `StepThroughsLens` - Step-by-step code execution
- `MarkdownLens` - Markdown viewing with annotation
- `AssetLens` - Media file viewer
- `PrintLens` - Print-optimized code display

### File System Architecture
- **Virtual File System**: `fs.js` creates an in-memory representation of files that can be loaded from:
  - Local JSON files (e.g., `examples.json`)
  - GitHub repositories (via `github.js`)
  - Direct URLs
- **Editor Integration**: CodeMirror 6 editors are managed per-file with persistence
- **URL Management**: `URLManager` handles file switching and parameter passing

### Key Technologies
- **Frontend**: Preact (React-like) with hooks
- **Build System**: Vite with CSS Modules
- **Editor**: CodeMirror 6 with JavaScript language support
- **Testing**: Vitest with jsdom environment
- **Code Analysis**: Shift parser for AST manipulation
- **Styling**: CSS Modules with scoped component styles

### Development Patterns

**Component Structure:**
- Each lens follows the pattern: `LensName.jsx` + `LensName.module.css`
- Lenses receive a `resource` prop (the current file object)
- Use `useApp()` context for global state access

**State Management:**
- Context providers wrap the entire app
- Local component state for lens-specific interactions
- Virtual file system maintains file content and metadata

**Code Editing:**
- CodeMirror instances are created per-file and reused
- `useFileEditor` hook manages editor lifecycle
- Content changes are debounced and saved to virtual FS

**URL Integration:**
- Files can be loaded via URL parameters
- Lens types can be specified in URL
- Code sharing via compressed URL encoding

### Important Notes

**Performance Considerations:**
- CodeMirror editors are reused across file switches to prevent flickering
- Large files are handled with virtualization
- Bundle splitting separates vendor code and parser libraries

**Legacy System:**
- Some SL1 (Study Lenses v1) code exists in `/public/static/` for backward compatibility
- Gradually being replaced with modern SL2 implementations
- Careful attention needed when modifying static assets

**Testing Setup:**
- Vitest with jsdom environment for component testing
- Test files should be in `**/__tests__/**` or use `.test.jsx` suffix
- Setup file at `src/test/setup.js` configures global test environment