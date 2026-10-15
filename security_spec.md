# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Workspace Ownership**: A `/workspaces/{userId}` document can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId` and whose email is verified (`request.auth.token.email_verified == true`).
2. **Inventory Ownership**: An `/inventories/{recordId}` document can only be read, listed, created, updated, or deleted by the authenticated user whose `ownerUid == request.auth.uid` and whose email is verified (`request.auth.token.email_verified == true`).
3. **Immutable Fields**: `uid`, `id`, `ownerUid`, and `createdAt` can never be modified after document creation.
4. **Strict Timestamps**: `createdAt` on create and `updatedAt` on create/update must strictly equal `request.time`.
5. **Bounded Sizes**: All string fields and array fields (`selectedPositions`, `komiteUyeleri`, `raciTasks`) are strictly bounded to prevent resource exhaustion ("Denial of Wallet").

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: Creating `/inventories/rec_1` with `auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: Creating `/inventories/rec_1` with `email_verified: false` -> `PERMISSION_DENIED`.
3. **Cross-Tenant Identity Spoofing**: User A (`uid: "user_a"`) creating `/inventories/rec_1` with `ownerUid: "user_b"` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection (Create)**: Creating `/workspaces/user_a` with extra field `isAdmin: true` -> `PERMISSION_DENIED`.
5. **Shadow Field Injection (Update)**: Updating `/inventories/rec_1` with an undeclared key `hacked: "yes"` -> `PERMISSION_DENIED`.
6. **Owner Hijack on Update**: Updating `/inventories/rec_1` to change `ownerUid` from `"user_a"` to `"user_b"` -> `PERMISSION_DENIED`.
7. **Timestamp Forgery on Create**: Creating `/inventories/rec_1` with a past or future client timestamp instead of `request.time` -> `PERMISSION_DENIED`.
8. **CreatedAt Mutation on Update**: Updating `/inventories/rec_1` with a modified `createdAt` timestamp -> `PERMISSION_DENIED`.
9. **ID Poisoning Attack**: Creating a document with an invalid ID containing special characters or exceeding 128 chars -> `PERMISSION_DENIED`.
10. **Array Exhaustion Attack**: Creating `/inventories/rec_1` with `selectedPositions` containing 500 items (exceeding max 50) -> `PERMISSION_DENIED`.
11. **Value Poisoning Attack**: Updating `unvan` with an integer `12345` or a 10,000-character string -> `PERMISSION_DENIED`.
12. **Unauthorized List Scraping**: Listing `/inventories` without filtering `resource.data.ownerUid == request.auth.uid` -> `PERMISSION_DENIED`.
