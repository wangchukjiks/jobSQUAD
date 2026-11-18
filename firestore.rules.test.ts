/**
 * JobSQUAD Security Rules Adversarial Test Specification ("Dirty Dozen")
 * Validates that every unauthorized, spoofed, or malformed payload is rejected.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const dirtyDozenCases: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated listing create',
    collection: 'listings/hack_1',
    operation: 'create',
    auth: null,
    payload: { type: 'job', title: 'Unauthorized Job' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified email listing create',
    collection: 'listings/unverified_1',
    operation: 'create',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: false },
    payload: { ownerId: 'userA', type: 'job', title: 'Unverified Job' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Identity spoofing on create',
    collection: 'listings/spoof_1',
    operation: 'create',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { ownerId: 'userB', type: 'job', title: 'Spoofed Owner' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow field injection on create',
    collection: 'listings/shadow_1',
    operation: 'create',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { ownerId: 'userA', type: 'job', isFeatured: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'House listing missing required images',
    collection: 'listings/house_no_img',
    operation: 'create',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { ownerId: 'userA', type: 'house', images: [], contactPhone: '+33759163133' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Sale listing missing required mobile number',
    collection: 'listings/sale_no_phone',
    operation: 'create',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { ownerId: 'userA', type: 'sale', images: ['data:image/jpeg;base64,abc'], contactPhone: '' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Backdated timestamp forgery',
    collection: 'listings/time_forge',
    operation: 'create',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { ownerId: 'userA', createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Invalid document ID poisoning',
    collection: 'listings/bad$id',
    operation: 'create',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { ownerId: 'userA', type: 'job' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Cross-user update hijack',
    collection: 'listings/owned_by_userA',
    operation: 'update',
    auth: { uid: 'userB', email: 'b@example.com', email_verified: true },
    payload: { title: 'Hijacked' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'OwnerId mutation on update',
    collection: 'listings/owned_by_userA',
    operation: 'update',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { ownerId: 'userB' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'PII snooping on another user profile',
    collection: 'users/userB',
    operation: 'get',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Privilege escalation write on /admins',
    collection: 'admins/userA',
    operation: 'create',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { uid: 'userA', email: 'a@example.com' },
    expected: 'PERMISSION_DENIED',
  },
];
