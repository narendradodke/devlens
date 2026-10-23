# Security Policy

## 🔒 Security & Privacy Model

DevLens is designed from the ground up as a **privacy-first, client-only developer toolkit**. Our security architecture adheres to these core principles:

1. **Zero External Data Transmission**: All utility processing across all six tools (JSON Studio, JWT Inspector, Regex Playground, JSON Diff, Encode / Decode Lab, and Recipe Manager) runs strictly client-side inside your local browser tab. DevLens makes zero outbound network requests with user input, analytics, or telemetry.
2. **Volatile Storage by Default**: No user-entered JSON payloads, JWTs, regex patterns, diff inputs, or encoded strings are saved to persistent browser storage (`localStorage` or `IndexedDB`). In Recipe Manager, saving custom recipes to local device storage is strictly opt-in (`localStorage`), unencrypted plaintext, and accompanied by explicit security warnings against storing secrets, API keys, or private tokens.
3. **Safe DOM Rendering**: All dynamic outputs, syntax messages, diff highlights, and search queries are rendered using native text nodes and safe React elements. The use of `eval()`, `new Function()`, or `dangerouslySetInnerHTML` is strictly prohibited across the codebase to prevent Cross-Site Scripting (XSS).
4. **Execution Isolation via Dedicated Web Workers**: Resource-intensive regular expression evaluation in Regex Playground runs inside an isolated dedicated Web Worker bounded by a strict 2,000ms execution timeout and input size guards (1,000,000-character test string, 5,000-character pattern, 5,000 matches maximum) to protect the main UI thread from browser lockups and catastrophic backtracking (ReDoS). If Web Worker creation fails or the worker encounters an unrecoverable error, execution halts safely with an explicit error message rather than falling back to synchronous execution on the main thread.
5. **No Cryptographic Guarantees for Decoding or Encodings**:
   - **JWT Inspector**: Decodes and displays header and payload structures purely client-side; it does **not** cryptographically verify signatures, secret keys, or token authenticity. Users are explicitly cautioned against relying on client-side decoding for authorization decisions.
   - **Encode / Decode Lab**: Reversible data transformations (Base64, Base64URL, URL encoding, HTML entities, Hexadecimal UTF-8 bytes) represent data representations, **not** encryption or data protection mechanisms.

---

## 🛡️ Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability in DevLens, please report it responsibly:

1. **Do not disclose the issue publicly** in an open issue or discussion forum.
2. Submit a report via [GitHub Security Advisories](https://github.com/narendradodke/devlens/security/advisories) on our repository, or contact the maintainer directly via GitHub profile.
3. Please include:
   - A clear description of the vulnerability.
   - Steps to reproduce or proof-of-concept input.
   - The potential security impact.

We will review reports promptly and publish fixes in a transparent, timely manner.
