# JobSQUAD Firestore Security Specification

## 1. Data Invariants
1. **Verified Authentication Gate**: No user may create, update, or delete any document without a verified Firebase Auth token (`request.auth != null && request.auth.token.email_verified == true`).
2. **PII Isolation**: User profile documents in `/users/{userId}` may only be read by the document owner (`userId == request.auth.uid`) or a verified administrator (`isAdmin()`). Listing `/users` is forbidden for non-admins.
3. **No Self-Assigned Admin Privileges**: Users cannot write to `/admins/{adminId}` or inject `role`/`isAdmin` fields into `/users/{userId}`.
4. **Strict Listing Type & Media Enforcement**: Listings of type `house`, `car`, or `sale` MUST include a valid `contactPhone` (`size() >= 6`) and at least 1 image (`images.size() >= 1`).
5. **Immutable Ownership & Temporal Integrity**: `ownerId` and `createdAt` cannot be modified after creation. `createdAt` (on create) and `updatedAt` (on create/update) must equal `request.time`.
6. **Path & Size Bounds**: Every document ID must match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars) and every string/list field enforces strict upper bounds.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Listing Create**: Anonymous user attempts `setDoc('/listings/hack1', validListing)` -> Denied (`isSignedIn()`).
2. **Unverified Email Listing Create**: User with `email_verified: false` attempts to create a listing -> Denied (`email_verified == true`).
3. **Identity Spoofing on Create**: User `uidA` sets `ownerId: 'uidB'` when creating `/listings/post1` -> Denied (`incoming().ownerId == request.auth.uid`).
4. **Shadow Field Injection on Create**: User adds `isFeatured: true` or `isAdmin: true` to `/listings/post1` -> Denied (`hasOnly(...)`).
5. **House/Car/Sale Missing Images**: User creates a `house` listing with `images: []` -> Denied (`images.size() >= 1`).
6. **House/Car/Sale Missing Mobile Number**: User creates a `sale` listing with `contactPhone: ''` -> Denied (`contactPhone.size() >= 6`).
7. **Timestamp Forgery**: User sets `createdAt` to a backdated client timestamp instead of `request.time` -> Denied.
8. **ID Poisoning**: User attempts `setDoc('/listings/bad$id/..', ...)` or 200-char ID -> Denied (`isValidId()`).
9. **Cross-User Update Hijack**: User `uidB` updates `/listings/postOwnedByUidA` -> Denied (`isOwner()`).
10. **OwnerId Mutation on Update**: User `uidA` attempts to reassign `ownerId` on update -> Denied (`incoming().ownerId == existing().ownerId`).
11. **PII Snooping on `/users/{otherUid}`**: User `uidA` attempts `getDoc('/users/uidB')` or `getDocs('/users')` -> Denied (`isOwner()` / `isAdmin()`).
12. **Privilege Escalation on `/admins`**: User `uidA` attempts `setDoc('/admins/uidA', ...)` -> Denied (`allow write: if false`).
