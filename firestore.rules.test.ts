/**
 * firestore.rules.test.ts
 * Verifies that all Dirty Dozen payloads return PERMISSION_DENIED according to security_spec.md
 */

export interface TestPayload {
  name: string;
  collection: string;
  docId: string;
  data: Record<string, any>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: TestPayload[] = [
  {
    name: '1. ID Injection Attack with illegal characters',
    collection: 'apps',
    docId: 'invalid$id#99',
    data: { id: 'app-1', title: 'Test', url: 'https://test.com' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    name: '2. Missing required field title',
    collection: 'apps',
    docId: 'app_1',
    data: { id: 'app-1', url: 'https://test.com' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    name: '3. Missing required field url',
    collection: 'apps',
    docId: 'app_1',
    data: { id: 'app-1', title: 'Game' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    name: '4. Missing required field id',
    collection: 'apps',
    docId: 'app_1',
    data: { title: 'Game', url: 'https://test.com' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    name: '5. Title exceeds 200 characters limit',
    collection: 'apps',
    docId: 'app_1',
    data: { id: 'app-1', title: 'A'.repeat(250), url: 'https://test.com' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    name: '6. URL exceeds 3000 characters limit',
    collection: 'apps',
    docId: 'app_1',
    data: { id: 'app-1', title: 'Game', url: 'https://test.com/' + 'A'.repeat(3500) },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    name: '7. Image payload exceeds 1MB limit',
    collection: 'apps',
    docId: 'app_1',
    data: { id: 'app-1', title: 'Game', url: 'https://test.com', iconUrl: 'A'.repeat(1200000) },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    name: '8. Order is not a number',
    collection: 'apps',
    docId: 'app_1',
    data: { id: 'app-1', title: 'Game', url: 'https://test.com', order: 'invalid-string' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    name: '9. Clicks is not a number',
    collection: 'apps',
    docId: 'app_1',
    data: { id: 'app-1', title: 'Game', url: 'https://test.com', clicks: 'many' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    name: '10. Arbitrary unauthorized collection write',
    collection: 'system_secrets',
    docId: 'secret_key',
    data: { key: '123' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    name: '11. Settings siteName exceeds 200 characters',
    collection: 'settings',
    docId: 'general',
    data: { siteName: 'A'.repeat(250) },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    name: '12. Settings missing mandatory siteName',
    collection: 'settings',
    docId: 'general',
    data: { tagline: 'Missing siteName' },
    expectedOutcome: 'PERMISSION_DENIED'
  }
];
