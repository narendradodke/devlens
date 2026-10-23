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
- **Local Volatile Processing**: Sensitive inputs (JSON payloads, tokens, credentials, regex targets) never leave your browser tab and are processed in-memory.
- **Opt-In Persistence Disclosure**: All tools operate ephemerally by default. The Recipe Manager offers an explicit, opt-in "Save on this device" setting stored as unencrypted plaintext in `localStorage`, accompanied by security warnings never to store credentials.
- **Safe DOM Rendering**: Outputs are rendered exclusively through safe React elements and text nodes (no `eval()` or `dangerouslySetInnerHTML`).
- **Signature Disclaimer**: JWT decoding is performed purely on the client side to inspect encoded claims. It does **not** cryptographically verify signatures or prove token authenticity.
- **Isolated Regex Worker**: Untrusted regular expression evaluation executes inside an isolated background Web Worker with a strict 2,000ms timeout to protect the main UI thread. If Web Worker creation fails or is blocked by browser policy, evaluation halts safely with an error rather than falling back to unsafe synchronous main-thread execution.

---

## 🛠️ Implemented Tools

All six core tools in the DevLens suite are fully implemented, verified, and active:

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

3. **Regex Playground** (`/regex-playground`)
   - **Web Worker Isolation**: Regular expression matching runs in a dedicated background Web Worker to protect the main UI thread.
   - **Strict Execution Timeout**: Background evaluations are capped at a 2,000ms timeout. If a pattern causes catastrophic backtracking, the worker is forcefully terminated (`worker.terminate()`) with an informative ReDoS notice.
   - **No Unsafe Fallback**: If Web Workers fail to instantiate or are blocked by browser security policies, synchronous execution on the main thread is strictly prevented to avoid freezing the browser tab.
   - **Real-Time Match Highlighting**: Highlights regex matches using standard React text spans without `dangerouslySetInnerHTML`.
   - **Flag Controls**: Accessible toggle buttons for standard JavaScript regex flags (`g`, `i`, `m`, `s`, `u`).
   - **Match Details Inspector**: Reports match text, character index ranges (`start..end`), match lengths, and captured group hierarchies (including named groups).
   - **Zero-Length Match Safety**: Handles zero-length match progression accurately with Unicode code point awareness when the `u` flag is enabled.
   - **Safe Match & Input Limits**: Protects memory with a 5,000-character pattern limit, 1,000,000-character test text limit, and 5,000-match display ceiling with excess indicators.

4. **JSON Diff** (`/json-diff`)
   - **Dual Editor Interface**: Independent side-by-side JSON text inputs with character, line, and byte size indicators.
   - **Structural Normalization**: Whitespace, formatting, indentation, and object property key ordering are normalized (0 differences reported for semantically identical JSON).
   - **Deep Traversal**: Traverses nested objects and arrays to detect Added, Removed, and Modified values with complete JSONPath notation (`$.path.to.key`).
   - **Iterative Stack-Safe Traversal**: Prevents call-stack overflow on deeply nested JSON subtrees.
   - **Index-Aware Array Comparison**: Compares array elements positionally and reports length discrepancies accurately.
   - **Interactive Filtering & Search**: Filter diff records by type (`Added`, `Removed`, `Modified`) and search by JSONPath or value text.
   - **Export Options**: Copy diffs formatted as plain text or structured JSON with accurate truncation reporting.
   - **Size Guard**: Enforces a 5,000,000-character input limit before trimming or parsing to protect heap allocation.

5. **Encode / Decode Lab** (`/encode-decode`)
   - **6 Encoding Schemes**:
     - **Standard Base64 (RFC 4648 §4)**: Full Unicode UTF-8 byte support with padding and character alphabet validation.
     - **URL-Safe Base64URL (RFC 4648 §5)**: Translates `+`/`/` to `-`/`_` and handles unpadded or padded input.
     - **URL Component**: Percent-encodes reserved query and path delimiters via `encodeURIComponent` / `decodeURIComponent` with malformed percent-sequence diagnostics.
     - **Full URL**: Preserves protocol and hierarchical URI delimiters (`://`, `?`, `&`, `#`, `/`) via `encodeURI` / `decodeURI`.
     - **HTML Entities**: Deterministic encoding of `&`, `<`, `>`, `"`, `'` and safe decoding of named, decimal (`&#65;`), and hex (`&#x1F680;`) entities without DOM injection.
     - **Hexadecimal UTF-8 Bytes**: Encodes text to space-separated hex bytes; decodes space, comma, colon, continuous, or `0x`-prefixed hex strings with even-length validation.
   - **Instant Swap Action**: Swaps input and output while simultaneously reversing direction (Encode ⇄ Decode) for instant roundtrip verification.
   - **Security Disclaimer**: Persistent banner reminding users that encoding is not encryption.
   - **Size Guard**: Rejects inputs exceeding 1,000,000 characters (1 MB) before processing.

6. **Recipe Manager** (`/recipes`)
   - **Master-Detail Workspace**: Searchable, categorizable library of reusable developer commands, configurations, and reference templates.
   - **6 Curated Starter Presets**: Real-world templates for cURL with Bearer authentication, Docker Compose PostgreSQL with healthcheck, Git branch pruning, strict CSP headers, Nginx TLS reverse proxy, and PostgreSQL idle connection termination.
   - **Immutable Presets**: Starter recipes use parameter placeholders (`<YOUR_API_TOKEN>`, `<PORT>`) and cannot be deleted; clicking **Duplicate** clones presets into editable custom recipes.
   - **Caution & Security Labels**: Destructive commands and security-sensitive configurations are prominently highlighted with caution badges.
   - **Full Custom CRUD**: Create, edit, and delete custom recipes with syntax formats (`bash`, `json`, `yaml`, `sql`, `regex`, `text`), categories, descriptions, and tags.
   - **Opt-In Device Persistence**: "Save on this device" checkbox saves custom recipes to `localStorage` as unencrypted plaintext, accompanied by clear warnings never to store credentials. Includes a "Clear Saved Recipes" purge button.
   - **Versioned JSON Import & Export**: Exports custom recipes to `.json` files; imports recipes with strict 1 MB file size verification, atomic dataset validation, and non-destructive ID collision handling.

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
