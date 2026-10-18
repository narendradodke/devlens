# DevLens

> **Secure, Privacy-First Open-Source Developer Toolkit**  
> Run essential developer utilities 100% locally in your browser. Zero tracking, zero external network calls, zero server-side storage.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Framework: React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![Build Tool: Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vite.dev)
[![Styling: Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com)

---

## 🔒 Privacy & Architecture Guarantees

DevLens is engineered as a client-side single-page application prioritizing privacy:

- **No Backend Server**: There is no server-side runtime, Express, Python, or Go service.
- **Zero Telemetry**: No Google Analytics, Mixpanel, tracking pixels, or third-party cookies.
- **Local Volatile Processing**: Sensitive inputs (JSON payloads, tokens, credentials, regex targets) never leave your browser tab and are not covertly persisted.
- **Safe DOM Rendering**: Outputs are rendered exclusively through safe React elements and text nodes (no `eval()` or `dangerouslySetInnerHTML`).
- **Signature Disclaimer**: JWT decoding is performed purely on the client side to inspect encoded claims. It does **not** cryptographically verify signatures or prove token authenticity.
- **Planned Isolated Execution**: Resource-intensive tasks (such as planned regex matching) will run inside dedicated Web Workers with timeouts to protect your main UI thread.

---

## 🛠️ Tool Status & Roadmap

DevLens is built phase-by-phase with honest verification before proceeding to subsequent modules:

### 🟢 Implemented & Active Tools

1. **JSON Studio** (`/json-studio`)
   - **Pretty-Printing**: Formats raw JSON with standard 2-space indentation.
   - **Minification**: Compresses valid JSON into a compact single-line payload.
   - **Real Validate Action**: Dedicated `Validate` button powered by `validateJson()` that verifies syntax without mutating input, displaying detailed structure breakdowns (Objects, Arrays, Strings, Numbers, Booleans, and Null).
   - **Live Validation Badge**: Real-time visual indicator in the editor header showing immediate syntax validity as you type.
   - **Safe Download Lifecycle**: Downloads valid JSON with delayed Blob URL cleanup (`URL.revokeObjectURL`) to ensure browser download completion across all engines.
   - **Unmount Safety**: Active timers for clipboard feedback and download cleanups are safely disposed of upon component unmount.
   - **Statistics**: Instant character, line count, and byte size calculation.
   - **Actions**: One-click clipboard copy with permission error handling and `.json` file export.

2. **JWT Inspector** (`/jwt-inspector`)
   - **Strict Base64URL Decoding**: Decodes header and payload segments using native `TextDecoder` UTF-8 byte reconstruction after normalizing `-`/`_` and adding required padding.
   - **Claims Inspection**: Extracts and displays standard claims (`iss`, `sub`, `aud`, `exp`, `iat`, `nbf`, `jti`) with human-readable local dates and expiration status indicators.
   - **Structured Panels**: Displays formatted JSON for header and payload, and displays the raw encoded signature segment with dedicated copy controls.
   - **Prominent Security Warning**: Persistent notice that client-side decoding does not verify cryptographic signatures or token authenticity.
   - **Volatile Execution**: Never persists tokens in `localStorage`, cookies, or session storage, and never transmits tokens over the network.

### 🟡 Planned Tools (Scheduled for Remaining Phase 2 & 3)

3. **Regex Playground** (`/regex-playground`) — _Phase 2 Target_
   - Isolated Web Worker execution with timeout protection against catastrophic backtracking (ReDoS).
   - 100% XSS-safe JSX highlighting using `<mark>` elements (never uses `dangerouslySetInnerHTML`).
   - Match counting, start/end indices, and capture group extraction.

4. **JSON Diff** (`/json-diff`) — _Phase 2 Target_
   - Side-by-side structural comparison of two JSON objects.
   - Deep key traversal detecting Added, Removed, and Modified values with complete JSON paths.
   - Index-aware array diffing to avoid misleading whole-array replacement dumps.

5. **Encode / Decode Lab** (`/encode-decode`) — _Phase 2 Target_
   - Component-level URL encoding and decoding (`encodeURIComponent`).
   - Unicode-safe UTF-8 Base64 encoding and decoding.
   - Clear diagnostic feedback for malformed padding or invalid characters.

6. **Recipe Manager** (`/recipes`) — _Phase 3 Target_
   - Save, view, and reuse allowlisted tool configurations.
   - Strict 1 MB file size enforcement and schema validation on JSON import/export.

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

## 📄 License & Contributing

- Code is released under the [MIT License](LICENSE).
- Contribution guidelines are documented in [CONTRIBUTING.md](CONTRIBUTING.md).
- Security policy and vulnerability reporting are available in [SECURITY.md](SECURITY.md).
