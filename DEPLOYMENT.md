# 🚀 Deployment Guide

## CI/CD Pipeline

This project uses GitHub Actions for automatic deployment to GitHub Pages with a custom base path.

### 📍 Deployment URL
- **Production**: `https://domain.td/19-07-2025`
- **GitHub Pages**: `https://[username].github.io/[repository-name]`

### 🔄 Automatic Deployment

**Push to `main` branch** → **Automatic build & deploy**

1. **Trigger**: Any push to the `main` branch
2. **Build**: Vite builds with `/19-07-2025/` base path
3. **Deploy**: GitHub Actions deploys to `gh-pages` branch
4. **Live**: App is available at `domain.td/19-07-2025`

### ⚙️ Configuration

#### Vite Configuration
```javascript
// vite.config.js
base: process.env.NODE_ENV === 'production' ? '/19-07-2025/' : '/',
```

#### Build Scripts
```json
{
  "build": "vite build",
  "build:prod": "NODE_ENV=production vite build",
  "build:19-07-2025": "NODE_ENV=production vite build",
  "preview:19-07-2025": "vite preview --base /19-07-2025/"
}
```

#### Asset Paths
All static assets are automatically prefixed with `/19-07-2025/` in production:
- `/static/` → `/19-07-2025/static/`
- `/assets/` → `/19-07-2025/assets/`

### 🏗️ Manual Build

```bash
# Development build
npm run build

# Production build with 19-07-2025 base path
npm run build:19-07-2025

# Preview with 19-07-2025 base path
npm run preview:19-07-2025
```

### 🔧 GitHub Actions Workflow

#### Features:
- ✅ **Linting**: ESLint checks before build
- ✅ **Build validation**: Checks for critical files
- ✅ **Asset verification**: Ensures correct base paths
- ✅ **Health checks**: Post-deployment validation
- ✅ **Force deployment**: Uses `force_orphan` for clean deploys
- ✅ **Build artifacts**: Stores build info for debugging

#### Workflow Steps:
1. 📥 Checkout repository
2. 🔧 Setup Node.js 20 with npm cache
3. 📦 Install dependencies with `npm ci`
4. 🧹 Run linter (`npm run lint:check`)
5. 🏗️ Build for production (`npm run build:19-07-2025`)
6. ✅ Validate build output and file structure
7. 🔗 Add `.nojekyll` and build metadata
8. 📤 Deploy to `gh-pages` branch
9. 📝 Display deployment summary
10. 🏥 Perform health checks

### 🚨 Troubleshooting

#### Build Fails
```bash
# Check linting
npm run lint:check

# Fix linting issues
npm run lint

# Manual build test
npm run build:19-07-2025
```

#### Deployment Fails
1. Check GitHub Actions logs
2. Verify `gh-pages` branch exists
3. Check repository permissions
4. Ensure GitHub Pages is enabled

#### Assets Not Loading
1. Verify base path in `vite.config.js`
2. Check static files in `public/static/`
3. Confirm build output in `dist/static/`

### 📊 Build Output

```
dist/
├── index.html          # Entry point with /19-07-2025/ paths
├── assets/            # Bundled JS/CSS with hashed names
├── static/            # Static assets (SL1 components)
├── manifest.json      # PWA manifest
├── favicon.svg        # Site favicon
└── .nojekyll         # GitHub Pages configuration
```

### 🎯 Performance

- **Build time**: ~4 seconds
- **Bundle size**: ~1.5MB (gzipped)
- **Deployment time**: ~30 seconds
- **Total time**: < 2 minutes from push to live

### 🔒 Security

- Uses `npm ci` for reproducible builds
- No secrets required (uses `GITHUB_TOKEN`)
- Force orphan deployment for clean history
- Automated linting prevents unsafe code

---

## 🚀 Ready for Classroom Use!

This CI/CD pipeline is optimized for:
- ✅ **Fast iterations** - Push and go live in under 2 minutes
- ✅ **Reliable deployments** - Comprehensive validation and health checks
- ✅ **Zero downtime** - Force orphan deployment prevents conflicts
- ✅ **Easy debugging** - Build artifacts and detailed logs
- ✅ **Classroom ready** - Consistent, predictable deployments