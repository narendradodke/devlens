# Contributing to DevLens

Thank you for your interest in contributing to **DevLens**! We welcome contributions that help improve this secure, privacy-first open-source developer toolkit.

---

## 🔒 Architectural & Security Guidelines

DevLens has strict architectural boundaries to preserve user privacy and security:

1. **Frontend-Only Architecture**: All utilities must execute 100% inside the client browser. Do not add backend servers (Node/Express, Python, etc.), databases, or third-party processing APIs.
2. **Zero Telemetry**: No analytics scripts, tracking pixels, telemetry calls, or external logging are permitted.
3. **Volatile Local Memory**: Do not covertly persist sensitive user inputs (passwords, JWTs, JSON keys, or regex test strings) to `localStorage` or external storage without explicit user action.
4. **Safe DOM Rendering**: Never use `eval()`, `new Function()`, or `dangerouslySetInnerHTML`. Untrusted inputs must be rendered strictly as sanitized text nodes or React elements.
5. **Worker Thread Isolation**: CPU-intensive operations (such as regular expression evaluation) must run in isolated Web Workers with execution timeouts to protect the main UI thread.

---

## 🛠️ Development Workflow

### 1. Prerequisites

- [Node.js](https://nodejs.org) (v18.0.0 or higher)
- `npm` (v9 or higher)

### 2. Setup

```bash
# Clone the repository
git clone https://github.com/narendradodke/devlens.git
cd devlens

# Install dependencies
npm install

# Start local development server
npm run dev
```

### 3. Verification Commands

Before submitting a pull request, verify all checks pass:

```bash
# Run tests
npm run test

# Run ESLint
npm run lint

# Verify code formatting
npm run format:check

# Format code automatically
npm run format

# Verify production build
npm run build
```

---

## 📝 Pull Request Checklist

- [ ] New features or fixes include corresponding unit or component tests in `src/test/`.
- [ ] No fake buttons, mock data, or non-functional placeholder controls are introduced.
- [ ] Code conforms to Prettier formatting and ESLint rules.
- [ ] Production build (`npm run build`) completes without errors or warnings.
- [ ] Documentation (`README.md`) is updated if a new tool or capability is implemented.

---

## 📄 License

By contributing to DevLens, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
