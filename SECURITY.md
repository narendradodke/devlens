# Security Policy

## 🔒 Security & Privacy Model

DevLens is designed from the ground up as a **privacy-first, client-only developer toolkit**. Our security architecture adheres to these principles:

1. **Zero External Data Transmission**: All utility processing (currently active JSON formatting, minification, and validation; and planned token decoding, regex evaluation, and string conversion) runs strictly in-memory inside your local browser tab. DevLens makes zero outbound network requests with user input.
2. **Volatile Storage by Default**: No user-entered JSON payloads, keys, credentials, or tokens are saved to persistent browser storage (`localStorage` or `IndexedDB`) without explicit user action.
3. **Safe DOM Rendering**: All dynamic outputs, syntax messages, and search queries are rendered using native text nodes and safe React elements. The use of `eval()`, `new Function()`, or `dangerouslySetInnerHTML` is strictly prohibited to prevent Cross-Site Scripting (XSS).
4. **Execution Isolation (Planned)**: Resource-heavy operations (specifically the upcoming regular expression engine in Phase 2) will be isolated within Web Workers with execution timeouts to protect the main UI thread from Denial of Service (ReDoS).
5. **No Cryptographic Guarantees for Decoding (Planned)**: Upcoming client-side decoding (such as JWT inspection in Phase 2) will explicitly warn users that decoding token structure does not establish cryptographic authenticity or signature validity.

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
