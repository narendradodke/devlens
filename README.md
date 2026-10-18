# DevLens

> **Secure, Privacy-First Open-Source Developer Toolkit**  
> Run essential developer utilities 100% locally in your browser. Zero tracking, zero external network calls, zero server-side storage.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Framework: React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![Build Tool: Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vite.dev)
[![Styling: Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com)

---

## 🔒 Privacy & Architecture Guarantees

DevLens is built strictly as a client-side single-page application:

- **No Backend Server**: There is no Express, Fastify, Python, or Go backend.
- **Zero Telemetry**: No Google Analytics, Mixpanel, tracking pixels, or third-party cookies.
- **Local Volatile Processing**: Sensitive inputs (JSON payloads, tokens, credentials, regex targets) never leave your browser tab and are not covertly persisted.
- **Isolated Execution**: Resource-intensive tasks (such as regex matching) run inside dedicated Web Workers with timeouts to protect your main UI thread.

---

## 🛠️ The 5 Core Tools

1. **JSON Studio**
   - Pretty-print and format JSON with indentation.
   - Fast minification for production payloads.
   - Precise syntax error diagnosis with exact line and character positions.
   - One-click copy, JSON file download, and real-time statistics (characters, lines, byte size).

2. **JWT Inspector**
   - Strict Base64URL parsing with native `TextDecoder` UTF-8 byte reconstruction.
   - Decodes and displays Header and Payload claims (`iss`, `sub`, `aud`, `exp`, `nbf`, `iat`).
   - Human-readable expiration status calculations.
   - Prominent notice that client-side decoding does not verify cryptographic signatures.

3. **Regex Playground**
   - Regular expression testing executed inside an isolated Web Worker.
   - Guarded against catastrophic backtracking (ReDoS) with execution timeout termination.
   - 100% XSS-safe JSX highlighting using `<mark>` elements (never uses `dangerouslySetInnerHTML`).
   - Match counting, start/end indices, and capture group extraction.

4. **JSON Diff**
   - Side-by-side structural comparison of two JSON objects.
   - Deep key traversal detecting Added, Removed, and Modified values with complete JSON paths.
   - Index-aware array diffing to avoid misleading whole-array replacement dumps.
   - Visual color coding paired with text labels and icons for full accessibility.

5. **Encode / Decode Lab**
   - Component-level URL encoding and decoding (`encodeURIComponent`).
   - Unicode-safe UTF-8 Base64 encoding and decoding.
   - Clear diagnostic feedback for malformed padding or invalid characters.

---

## 💻 Tech Stack

- **UI Framework**: [React 19](https://react.dev)
- **Bundler & Dev Server**: [Vite 6](https://vite.dev)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) with `@tailwindcss/vite`
- **Routing**: [React Router v7](https://reactrouter.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **Testing**: [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com)
- **Code Quality**: ESLint 9 (Flat Config) + Prettier

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v18.0.0 or higher recommended)
- `npm` (v9 or higher)

### Installation & Local Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/narendradodke/devlens.git
   cd devlens
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Available Scripts

| Script                 | Purpose                                                 |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Starts the Vite dev server with hot module replacement  |
| `npm run build`        | Compiles the production application bundle into `dist/` |
| `npm run preview`      | Previews the local production build                     |
| `npm run test`         | Executes unit and component tests with Vitest           |
| `npm run test:watch`   | Runs Vitest in interactive watch mode                   |
| `npm run lint`         | Runs ESLint 9 checks across all source files            |
| `npm run format:check` | Verifies formatting adherence using Prettier            |
| `npm run format`       | Automatically formats files using Prettier              |

---

## 📄 License

DevLens is free, open-source software released under the [MIT License](LICENSE).
