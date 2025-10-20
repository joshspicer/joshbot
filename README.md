# JoshBot 

A dedicated coding assistant VS Code extension great at complex tasks.

## Development

### Prerequisites
- Node.js (16.x or later)
- npm

### Setup
```bash
npm install
```

### Building
```bash
npm run compile
```

### Linting
```bash
npm run lint
```

To auto-fix linting issues:
```bash
npx eslint src --ext ts --fix
```

### Testing
```bash
npm test
```

Note: Tests require VS Code to be downloaded and may require a display (use `xvfb-run` on Linux if needed).

### Packaging
```bash
npm run package
```

