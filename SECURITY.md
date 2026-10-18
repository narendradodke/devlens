# Security Policy

## 🔒 Security & Privacy Model

DevLens is designed from the ground up as a **privacy-first, client-only developer toolkit**. Our security architecture adheres to these principles:

1. **Zero External Data Transmission**: All data manipulation (JSON formatting, token decoding, regex execution, string encoding) happens strictly in-memory within your local browser. DevLens makes zero outbound network requests with user input.
2. **Volatile Storage by Default**: No user-entered tokens, keys, passwords, or payloads are saved to persistent browser storage (`localStorage` or `IndexedDB`) unless an explicit local export action is taken.
3. **Safe Rendering**: All dynamic outputs and search terms are rendered via React elements and native text nodes. The use of `eval()`, `new Function()`, or `dangerouslySetInnerHTML` is strictly prohibited to prevent Cross-Site Scripting (XSS).
4. **Execution Isolation**: CPU-intensive operations (such as regex matching) are isolated inside Web Workers with execution timeouts to prevent tab freezing and Denial of Service (ReDoS).
5. **No Cryptographic Guarantees for Decoding**: Client-side decoding (e.g., JWT header/payload decoding or Base64 decoding) does **not** establish cryptographic validity or signature verification. DevLens explicitly warns users that token decoding does not prove authenticity.

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

