# 🔍 Study Lenses v2.0

> Interactive code study platform with lens-based learning

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:19-07-2025
```

## 📍 Live Deployment

- **Production**: `https://domain.td/19-07-2025`
- **Auto-deploy**: Push to `main` branch → Live in <2 minutes

## 🔧 Development

### Available Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm run build:19-07-2025   # Build with /19-07-2025/ base path
npm run preview:19-07-2025 # Preview with 19-07-2025 base path
npm run lint             # Fix linting issues
npm run lint:check       # Check linting
npm run test             # Run tests
```

### Project Structure

```
src/
├── lenses/              # All lens components (unified)
├── components/          # Shared UI components
├── hooks/              # Custom React hooks
└── utils/              # Utility functions

shared/
├── components/         # Reusable components
├── context/           # React contexts
├── hooks/             # Shared hooks
└── utils/             # Shared utilities

public/
└── static/            # Static assets (SL1 components)
```

## 🏗️ CI/CD Pipeline

### Automatic Deployment
- **Trigger**: Push to `main` branch
- **Build**: Vite with `/19-07-2025/` base path
- **Deploy**: GitHub Actions → `gh-pages` branch
- **Live**: Available at `domain.td/19-07-2025`

### Build Features
- ✅ **Linting**: ESLint validation
- ✅ **Build validation**: File structure checks
- ✅ **Asset optimization**: Bundled and compressed
- ✅ **Health checks**: Post-deployment validation
- ✅ **Fast builds**: ~2 minutes from push to live

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed CI/CD documentation.

## 🔍 Lenses

### Study Lenses
- **StudyLens**: Interactive code editor with scope management
- **VariablesLens**: Variable analysis and highlighting
- **FlowchartLens**: Visual program flow diagrams
- **HighlightLens**: Syntax highlighting and annotation

### Educational Lenses
- **BlanksLens**: Fill-in-the-blank exercises
- **WritemeLens**: Guided code writing
- **ParsonsLens**: Drag-and-drop code assembly
- **FlashcardLens**: Spaced repetition learning

### Utility Lenses
- **PrintLens**: Print-optimized code display
- **AssetLens**: Media file viewer
- **MarkdownLens**: Markdown rendering

## 🎯 Features

### Core Functionality
- **Interactive code editing** with CodeMirror 6
- **Selection-based lens system** with contextual menus
- **Real-time trace visualization** with SL1 integration
- **HTML live preview** for web development
- **Advanced scope management** (whole file vs selection)

### Educational Tools
- **Syntax highlighting** with Prism.js
- **AST-based code analysis** with Shift parser
- **Spaced repetition** with Leitner box system
- **Interactive exercises** with progress tracking

### Technical Features
- **Virtual file system** for GitHub integration
- **Lens persistence** across sessions
- **Mobile-responsive design** for tablets
- **Performance optimized** with code splitting

## 🛠️ Technology Stack

### Frontend
- **Preact**: Lightweight React alternative
- **Vite**: Fast build tool and dev server
- **CodeMirror 6**: Modern code editor
- **CSS Modules**: Scoped styling

### Code Analysis
- **Shift Parser**: JavaScript AST parsing
- **Shift Scope**: Variable analysis
- **Prism.js**: Syntax highlighting

### Build & Deploy
- **GitHub Actions**: CI/CD automation
- **GitHub Pages**: Static site hosting
- **ESLint**: Code quality checks
- **Vitest**: Unit testing framework

## 📚 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - CI/CD and deployment guide
- [CLAUDE.md](./CLAUDE.md) - Architecture and development docs
- [BACKLOG.md](./BACKLOG.md) - Feature roadmap and completed work

## 🎓 Classroom Ready

This platform is optimized for educational use:
- **Fast iterations** for live demonstrations
- **Reliable deployments** for consistent classroom experience
- **Mobile-friendly** for tablet-based learning
- **Comprehensive lens system** for multiple learning styles

---

## 🚀 Ready for Class!

Push to `main` → Live at `domain.td/19-07-2025` in under 2 minutes!