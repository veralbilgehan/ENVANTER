/**
 * Firestore Security Rules Verification Specification (Dirty Dozen TDD)
 * Verifies all 12 adversarial payloads against firestore.rules invariants.
 */
export const DIRTY_DOZEN_SECURITY_TESTS = [
  { id: 1, name: 'Unauthenticated Write', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unverified Email Spoof', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Cross-Tenant Identity Spoofing', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow Field Injection (Create)', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Shadow Field Injection (Update)', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Owner Hijack on Update', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Timestamp Forgery on Create', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'CreatedAt Mutation on Update', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'ID Poisoning Attack', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Array Exhaustion Attack', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Value Poisoning Attack', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Unauthorized List Scraping', expected: 'PERMISSION_DENIED' }
];
