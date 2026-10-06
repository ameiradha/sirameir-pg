# Security Specification: SIR AMEIR PLAYGROUND

## 1. Data Invariants
1. A WebApp document must always have a valid `id`, `title`, and `url`.
2. The `appId` in the Firestore path `/apps/{appId}` must match the `isValidId()` pattern (`^[a-zA-Z0-9_\-]+$`) and must not exceed 128 characters.
3. The `title` of a WebApp must not exceed 200 characters.
4. The `url` of a WebApp must not exceed 3,000 characters.
5. The `iconUrl` field (containing custom uploaded image data/URL) must not exceed 1MB (1,000,000 characters) to prevent database resource exhaustion.
6. Settings document must be constrained to the specific ID `/settings/general` and must enforce strict maximum string lengths.
7. Any document write attempting to inject unrecognized root paths is denied by default (`match /{document=**} { allow read, write: if false; }`).

## 2. The Dirty Dozen Payloads
Below are 12 malicious or malformed payloads that must be rejected by the security rules:

1. **ID Injection Attack**: Attempting to write to `/apps/invalid$id#` (containing illegal path characters).
2. **Missing Required Field 'title'**:
   ```json
   { "id": "app-1", "url": "https://example.com" }
   ```
3. **Missing Required Field 'url'**:
   ```json
   { "id": "app-1", "title": "Game 1" }
   ```
4. **Missing Required Field 'id'**:
   ```json
   { "title": "Game 1", "url": "https://example.com" }
   ```
5. **Title Length Bomb (Buffer Overflow)**:
   ```json
   { "id": "app-1", "title": "a".repeat(250), "url": "https://example.com" }
   ```
6. **URL Overflow Attack**:
   ```json
   { "id": "app-1", "title": "Game", "url": "https://example.com/" + "a".repeat(4000) }
   ```
7. **Giant Image Payload (>1MB Denial of Wallet attack)**:
   ```json
   { "id": "app-1", "title": "Game", "url": "https://example.com", "iconUrl": "data:image/png;base64," + "A".repeat(1200000) }
   ```
8. **Invalid Non-Numeric Order**:
   ```json
   { "id": "app-1", "title": "Game", "url": "https://example.com", "order": "first" }
   ```
9. **Invalid Non-Numeric Clicks**:
   ```json
   { "id": "app-1", "title": "Game", "url": "https://example.com", "clicks": "many" }
   ```
10. **Arbitrary Root Document Injection**: Writing directly to `/system/secrets`.
11. **Settings Title Overflow Attack**: Writing `siteName` of length > 250 characters.
12. **Settings Missing Mandatory 'siteName'**:
    ```json
    { "tagline": "Just a tagline without site name" }
    ```
