# Code Issues Report

This document lists identified bugs, security vulnerabilities, and code quality issues in the FISH codebase.

## Summary

| Severity | Count |
|----------|-------|
| Critical/High | 6 |
| Medium | 18 |
| Low | 6 |
| **Total** | **30** |

---

## Critical / High Severity

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| 1 | **Memory Leak** | `src/engine/engine.js:31-78` | Socket event handlers never removed on disconnect |
| 3 | **Race Condition** | `src/engine/ocean-manager.js:44-67` | `hasRoom()` and `addFisher()` not atomic - can overfill oceans |
| 7 | **XSS Risk** | `public/js/fish.js`, `dashboard.js`, `microworld.js` | `.html()` used with unsanitized server data |
| 12 | **Hardcoded Secrets** | `src/app.js:98,101` | Session secret hardcoded: `'life is better under the sea'` |
| 20 | **Open Redirect** | `public/js/fish.js:588-596` | `ocean.redirectURL` used without validation |
| 24 | **Race Condition** | `src/engine/ocean-manager.js:73-122` | Ocean purging can delete oceans while events are in flight |

---

## Medium Severity

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| 2 | Missing error handling | `src/engine/engine.js:82-95` | Admin socket has no error handling |
| 4 | Null dereference | `src/engine/ocean-manager.js:50,63` | `this.oceans[oId]` accessed without null check |
| 5 | Improper for-in loops | `src/engine/ocean.js` (13 locations) | `for (var i in array)` iterates all enumerable props |
| 6 | Uncaught JSON.parse | `public/js/admin.js:9`, `participant-access.js`, `dashboard.js`, `microworld.js` | No try-catch around JSON.parse |
| 8 | Missing null checks | `public/js/fish.js:340-395` | `fisher.seasonData[st.season]` may be undefined |
| 9 | Swallowed errors | `src/routes/experimenters.js:32,40,58-62` | Callback error parameter ignored (`_`) |
| 10 | Unhandled promise rejection | `src/routes/sessions.js:21,29-30,69,77-78` | Database operations missing error propagation |
| 13 | Stale room broadcasts | `src/engine/ocean.js` (11 locations) | Emitting to rooms without verifying ocean exists |
| 14 | Global variable pollution | `src/engine/ocean.js:8-9` | `io` and `ioAdmin` shared across all Ocean instances |
| 15 | Missing URL validation | `public/js/fish.js:4-8` | `mwId` and `pId` not validated |
| 16 | Masked errors | `src/engine/fisher.js:135-161` | Try-catch logs but swallows errors |
| 18 | Callback hell | `src/routes/microworlds.js:69-121`, `sessions.js` | `async.waterfall` with nested callbacks |
| 19 | Missing param validation | `src/routes/experimenters.js:50-64` | No validation before database insert |
| 21 | No input sanitization | `src/routes/microworlds.js:45-57` | User input stored directly in DB |
| 23 | Self-request pattern | `src/routes/experimenters.js:9-27` | Route makes HTTP request to itself |
| 25 | No DB error recovery | `src/engine/ocean.js:588-601` | `Run.create()` failure doesn't rollback state |
| 27 | Socket listener leak | `public/js/fish.js:714-729` | No `socket.off()` cleanup on client |
| 30 | Unvalidated ocean ID | `src/engine/engine.js:29` | `om.oceans[myOId]` accessed without existence check |

---

## Low Severity

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| 11 | Incomplete error handling | `src/app.js:90-96` | Only catches `SyntaxError`, not other parsing errors |
| 17 | Arithmetic overflow | `src/engine/fisher.js:136,156` | No bounds check on money calculations |
| 22 | Input edge cases | `public/js/fish.js:112-123` | Large numbers in catch intent not handled |
| 26 | Greed out of bounds | `src/engine/fisher.js:46-75` | Greed can exceed [0,1] range with erratic bots |
| 28 | Double disconnect | `public/js/fish.js:577` | Handlers may fire after `socket.disconnect()` |
| 29 | Missing status validation | `src/routes/sessions.js:115-133` | Microworld capacity not validated before assignment |

---

## Detailed Descriptions

### Issue 1: Socket Event Handler Memory Leak

**File:** `src/engine/engine.js:31-78`

Multiple socket event handlers (`readRules`, `attemptToFish`, `recordIntendedCatch`, `goToSea`, `return`, `requestPause`, `requestResume`) are registered inside the `enteredOcean` callback but never removed when a socket disconnects or when the ocean is deleted. This accumulates listener references and leads to memory leaks with high participant turnover.

**Fix:** Add `socket.removeAllListeners()` or individual `socket.off()` calls in the disconnect handler.

---

### Issue 3: Race Condition in Ocean Assignment

**File:** `src/engine/ocean-manager.js:44-67`

The `assignFisherToOcean` function checks if an ocean `hasRoom()` and then calls `addFisher()`, but between these two operations, another request could join the same ocean, causing an overfull ocean. No atomic transaction or locking mechanism prevents concurrent modifications.

**Fix:** Implement a mutex or use atomic check-and-update operations.

---

### Issue 7: XSS Risk via .html()

**Files:** `public/js/fish.js:173-176,217,229,241,245,255,489,495,505,578`, `public/js/dashboard.js:56,66,76`, `public/js/microworld.js:570`, `public/js/run-results.js:72,79`

The `.html()` jQuery method sets raw HTML content. If any dynamic content from the server (like `ocean.preparationText`, `ocean.endTimeText`, microworld names/descriptions) contains user-controlled data with HTML/JavaScript, XSS injection is possible.

**Fix:** Use `.text()` for plain text or sanitize HTML before rendering.

---

### Issue 12: Hardcoded Session Secrets

**File:** `src/app.js:98,101`

```javascript
app.use(cookieParser('life is better under the sea'));
app.use(session({
  secret: 'life is better under the sea',
```

Session secrets should be loaded from environment variables, not hardcoded in source code.

**Fix:** Use `process.env.SESSION_SECRET` with a fallback for development only.

---

### Issue 20: Open Redirect Vulnerability

**File:** `public/js/fish.js:588-596`

```javascript
var url = ocean.redirectURL;
if (url && url.length > 0) {
  // ... substitution logic ...
  location.href = url;  // Could redirect to attacker-controlled URL
}
```

If `ocean.redirectURL` is attacker-controlled (via microworld params set by an experimenter), this enables open redirect attacks that can be used for phishing.

**Fix:** Validate that the redirect URL is on an allowlist of trusted domains, or only allow relative URLs.

---

### Issue 24: Race Condition in Ocean Purging

**File:** `src/engine/ocean-manager.js:73-122`

The `purgeOceans` function has a two-stage purge process (schedule then delete) intended to handle out-of-order events. However:
1. Between the time `purgeScheduled = true` is set and the next cycle runs, new fisher events could arrive and access deleted oceans
2. No mutex or atomic check-and-delete operation
3. Events might still arrive after an ocean is marked removable but before it's actually deleted

**Fix:** Implement proper locking or use a state machine pattern for ocean lifecycle.
