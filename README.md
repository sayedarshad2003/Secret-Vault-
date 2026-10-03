# AegisVault - Local Zero-Knowledge Password Manager

A privacy-first, zero-knowledge, offline-only password manager built with React, Vite, TypeScript, Tailwind CSS, Web Crypto API, and IndexedDB.

---

## 🔒 Security Architecture & Threat Model

### 1. Zero-Knowledge Design
- **No Backend**: AegisVault operates 100% inside your browser sandbox. There are no remote APIs, database servers, cloud sync handlers, telemetry, or analytics.
- **No Master Password Persistence**: The master password is never written to disk, `localStorage`, `sessionStorage`, cookies, IndexedDB, or logs. It is held only in transient memory during key derivation and immediately discarded.
- **Non-Extractable CryptoKey**: Derived cryptographic keys are created with `{ extractable: false }` using the browser's native `crypto.subtle` subsystem, preventing memory inspection scripts from extracting raw key material via `exportKey`.

### 2. Cryptographic Algorithms
| Operation | Primitive | Parameters |
| :--- | :--- | :--- |
| **Key Derivation** | PBKDF2 with HMAC-SHA-256 | 600,000 iterations (OWASP recommended standard) |
| **Salt Generation** | `crypto.getRandomValues()` | 16 bytes (128-bit) cryptographically secure pseudorandom salt |
| **Authenticated Encryption** | AES-256-GCM | 256-bit derived key, 128-bit authentication tag |
| **Initialization Vector (IV)** | `crypto.getRandomValues()` | 12 bytes (96-bit) fresh random IV generated uniquely for **every single encryption** |
| **Password Randomness** | Rejection-sampled CSPRNG | `crypto.getRandomValues()` (Never `Math.random()`) |

### 3. Storage Hierarchy
- **IndexedDB (`SecurePasswordManager`)**:
  - Store: `vault`
  - Key: `encryptedVault`
  - Content: Pure ciphertext JSON envelope containing `version`, `salt` (Base64), `iv` (Base64), `ciphertext` (Base64), `kdf` metadata, and `encryption` metadata.
  - Plaintext passwords, usernames, URLs, and notes are **NEVER** stored in IndexedDB.
- **`localStorage` / `sessionStorage`**:
  - Strictly forbidden for vault data or credentials. Only harmless client appearance preferences are kept.

### 4. Zero Password Recovery Policy
Because the master password is never stored or transmitted, **it cannot be reset or recovered**. If the master password is lost and no encrypted `.pmvault` backup exists, the vault is mathematically impossible to decrypt.

### 5. In-Memory State & Auto-Lock
- When locked, decrypted entries and the active `CryptoKey` are scrubbed from React state and set to `null` / `[]`.
- Inactivity auto-lock triggers after a configurable timeout (1m, 5m, 15m, 30m) or when the tab has been hidden for the duration.
- Clipboard copy includes an automatic scrub timer (defaults to 30 seconds).

### 6. XSS & Link Protections
- All user-supplied records (imported or manually created) are rendered as regular React text nodes without `dangerouslySetInnerHTML`.
- External URLs are strictly validated to permit only `https:`, `http:`, or registered mobile schemes (`android://`), preventing `javascript:` protocol execution.
- External links use `rel="noopener noreferrer" target="_blank"`.

---

## 🛠 Features

1. **Local Vault CRUD**: Add, edit, delete, search, and favorite credentials with instant local search.
2. **Password Generator**: High-entropy generator with length (8–64), character set toggles (uppercase, lowercase, numbers, symbols), and ambiguous character filtering.
3. **Password Security Health**:
   - Weak password audit (entropy & length checks).
   - Reused password detection across all accounts (calculated in client memory).
   - Rotation reminders for credentials older than 90 days.
4. **Excel & CSV Import**:
   - Client-side parsing using SheetJS (`xlsx`) and RFC-4180 parser.
   - Column auto-mapping (`name`, `url`, `username`, `password`, `note`).
   - Duplicate conflict detection (match by name + username or URL + username).
   - Merge strategies: *Skip Duplicates*, *Replace Existing*, or *Import as New*.
   - Password masking in preview table.
5. **Vault Backups**:
   - `.pmvault` Encrypted Backup: Export and import encrypted envelopes safe for cloud or external drive storage.
   - Plaintext CSV Export: Protected by an explicit confirmation dialog warning of plaintext security risks.
6. **Destructive Reset**: Permanent vault wipe requiring exact phrase confirmation (`DELETE MY VAULT`).

---

## 🚀 Development & Setup

```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev

# Run TypeScript compilation check
npm run lint

# Build for production
npm run build
```
