# Grandel - GitHub Standards: Issues, Pull Requests & Git Commits

To ensure that the Grandel codebase remains clean, professional, and optimized for AI-driven Git history retrieval and RAG search, all contributors must follow these conventions.

---

## 📑 Standards Index
- [1. Conventional Commits Standard](#1-conventional-commits-standard)
- [2. Branching Strategy](#2-branching-strategy)
- [3. Pull Request Template & Guidelines](#3-pull-request-template--guidelines)
- [4. GitHub Issues Catalog & Templates](#4-github-issues-catalog--templates)

---

## 1. Conventional Commits Standard

Git commit messages become a persistent retrieval source for AI developer assistants. Uninformative messages like `update`, `fix`, or `final2` degrade retrieval quality and must be avoided.

### Allowed Prefixes
| Type | Purpose | Example |
| :--- | :--- | :--- |
| `feat:` | A new user-facing feature | `feat: add geospatial radius search with MongoDB 2dsphere` |
| `fix:` | A bug fix | `fix: resolve QR check-in camera permission on mobile` |
| `refactor:` | Code restructuring without behavior change | `refactor: extract n8n email triggers into isolated try-catch blocks` |
| `perf:` | Performance improvement | `perf: add in-memory NodeCache for featured listings query` |
| `security:` | Security enhancement or vulnerability patch | `security: enforce SameSite=None and secure flags on session cookies` |
| `test:` | Adding or modifying tests | `test: add aggregation unit verification for host dashboard` |
| `docs:` | Documentation changes only | `docs: add comprehensive API reference for bookings module` |
| `chore:` | Build, package, or config updates | `chore: configure root monorepo scripts in package.json` |

---

## 2. Branching Strategy

Never push directly to `main` for feature or architectural changes. Use branch prefixes:
- `feature/<feature-name>` (e.g., `feature/booking-cancellation`, `feature/payment-integration`)
- `fix/<issue-name>` (e.g., `fix/qr-verification`, `fix/authentication-uid-link`)
- `refactor/<module-name>` (e.g., `refactor/booking-controller-service`)
- `docs/<doc-name>` (e.g., `docs/api-documentation`)

---

## 3. Pull Request Template & Guidelines

Every Pull Request must document the problem, the changes, the rationale, and the verification steps. This enables AI tools to answer questions like: *"Why was booking cancellation implemented this way?"*

### PR Template (`.github/pull_request_template.md`)

```markdown
## 📌 Problem Description
[Explain the problem or requirement being addressed. What bug occurred or what capability was missing?]

## 🛠 Proposed Changes
- [File A]: [Brief description of change]
- [File B]: [Brief description of change]

## 💡 Architectural Rationale & Design Decisions
[Why was this specific technical approach chosen? What alternatives were considered and why were they rejected?]

## 🧪 Testing & Verification
- [ ] Unit / Integration script executed (`node Backend/test-*.js`)
- [ ] Manual browser / hardware testing verified
- [ ] Edge cases (e.g., zero ratings, unauthenticated requests, network timeouts) tested

## 🔗 Related Issues
Closes #[issue-number]
```

---

## 4. GitHub Issues Catalog & Templates

Organized repository tasks for real development issues, bug fixes, and feature enhancements.

### Issue 1: [Bug] Booking creation fails when property ID is invalid
- **Type**: Bug
- **Labels**: `bug`, `backend`, `high-priority`
- **Description**: Submitting a booking request with a malformed or non-existent property ObjectId caused an unhandled CastError instead of returning a clean 404 response.
- **Resolution**: Add Mongoose ObjectId validation before executing `Listing.findById(id)`.

---

### Issue 2: [Feature] Add guest booking cancellation
- **Type**: Feature
- **Labels**: `enhancement`, `booking`
- **Description**: Provide guests with the ability to cancel an upcoming reservation directly from their `/profile` view before check-in.
- **Resolution**: Implement `DELETE /bookings/:id` checking `booking.user.equals(req.user._id)` and deleting the reservation record.

---

### Issue 3: [Improvement] Optimize property search with in-memory caching
- **Type**: Performance
- **Labels**: `performance`, `caching`
- **Description**: High-traffic endpoints `/api/stats` and `/api/featured` recalculated database counts and aggregated review arrays on every page visit.
- **Resolution**: Integrated `NodeCache` with TTL constants (1 hour for stats, 30 minutes for featured), achieving an 87% latency reduction.

---

### Issue 4: [Bug] Notification not triggered after booking confirmation
- **Type**: Bug
- **Labels**: `bug`, `n8n`, `notifications`
- **Description**: Host email notifications failed silently when `N8N_EMAIL_WEBHOOK_URL` experienced network delays.
- **Resolution**: Added non-blocking error handling and dedicated logger in `n8nService.js` to prevent primary booking flow disruption while capturing connection warnings.
