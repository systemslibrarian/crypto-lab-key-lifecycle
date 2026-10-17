# Build brief — `crypto-lab-key-lifecycle`

**2026-10-17 · Proposed / brief only.** GitHub repository created; implementation/deployment subject to verification.

**Binding source:** [Crypto Lab Master Template](https://github.com/systemslibrarian/crypto-lab/blob/main/audits/_MASTER-TEMPLATE.md), §§0–6, including claims, mutation, accessibility, README and deployment gates. When building inside the new lab repo, use [the official kickoff](https://github.com/systemslibrarian/crypto-lab/blob/main/audits/kickoff.md) with this file saved as `brief.md`. Catalog changes must obey the catalog's `CLAUDE.md` separately.

```text
NEW DEMO BRIEF
- Repo name:         crypto-lab-key-lifecycle
- Short name (H1):   Key Lifecycle
- Subtitle:          NIST SP 800-57 · Rotation · Compromise
- One-liner:         Encrypt records with real AES-256-GCM, move their keys through lifecycle states, and test which historical ciphertexts remain decryptable after rotation and compromise.
- Concept to teach:  Retiring or replacing a key does not undo exposure of that key or erase copies of ciphertext already obtained.
- Primitives/spec:   NIST SP 800-57 Part 1 Rev. 5 (final key-management guidance); NIST SP 800-38D (AES-GCM); WebCrypto.
- Accent (--accent): #4DD6BF (proposed; check fleet palette and contrast)
- Favicon emoji:     🗝️
- In scope:          per-session AES-256-GCM keys; key states and cryptoperiod; encrypt/rotate/deactivate; historic reads; backup/recovery; simulated key-copy incident followed by actual attacker-side decrypt; re-encryption versus re-wrap distinction.
- Non-goals:         another DEK/KEK key-wrap demo, cloud KMS, hardware-backed keys, organization-grade auditing, assured secure erasure, actual secrets or persistent key storage.
```

## The one question

**“We rotated the key. Why can an attacker still read the old data?”** Make that the core interaction rather than a dashboard full of policies. Start with a fictional library's circulation records. Let the learner encrypt records, copy one old key into a visibly compromised attacker compartment, rotate the active key, and then **actually decrypt** old captured ciphertext in that compartment. Re-encrypt a record under a fresh key and show exactly which copy remains exposed.

## Why this deserves a separate lab

- **Envelope KMS** already teaches DEK/KEK hierarchy, AES key wrap, rotation and re-wrap. Do not reproduce it. This lab is **time, custody, compromise, and consequences**.
- **PQ Rotation** owns post-quantum migration policy; no PQ scheme comparison here.
- **Ghost Commit** owns the durability of secrets accidentally committed to git. Link to it rather than modeling source-control history again.
- The current `concept-coverage.md` already calls operational key management `COVERED`; this is depth, not a newly discovered missing concept.

## §1 / SCOPE & SECURITY / CORRECTNESS INVARIANTS

1. **Actual cryptography:** WebCrypto AES-256-GCM encrypt/decrypt with a fresh 96-bit IV for each message and explicit AAD containing the record ID and epoch. Test the authenticated plaintext and authentication failures, not just a counter. All records and keys are synthetic and generated locally.
2. **In-memory boundary:** Keys, plaintexts and any intentionally copied key material are never stored, exported from the page or sent over a network. Clearing state discards browser references; it is **not** a claim of physical zeroization or secure erase.
3. **Correct key selection:** A record only decrypts under its proper key and AAD. Retired keys may remain necessary for permitted historic reads; destroyed/unavailable keys must visibly fail recovery. No silent fallback to another key.
4. **Compromise is irreversible for captured data:** Rotating the writer key must not mark older ciphertext “protected again.” A simulated incident supplies actual demo key bytes to the attacker compartment, which genuinely decrypts captured ciphertext.
5. **Distinguish actions:** KEK re-wrap without replacing the DEK does not solve an exposed-DEK incident. Re-encryption under a fresh DEK protects **new ciphertext copies** but cannot withdraw a copy the attacker already captured or plaintext already learned. This comparison is the boundary with Envelope KMS.
6. **Lifecycle states are policy metadata, not encryption:** Model pre-active, active, deactivated, compromised and destroyed/unavailable as a **simplified NIST-inspired policy view**. Do not imply that setting a label destroys underlying bytes or enforces external access controls.
7. **Never promote policy to a crypto verdict:** “AES-GCM authentication passed” can coexist with “confidentiality is lost.” Show both explicitly.

### ARCHITECTURE

- `src/crypto/aead.ts`: WebCrypto AES-256-GCM, AAD encoding, IV generation, authentication.
- `src/lifecycle/states.ts`, `transitions.ts`, `model.ts`: record epochs and key state graph, explicit typed transitions and invariant guards.
- `src/lifecycle/incident.ts`: self-contained compromised-key scenario; passes a *real* key copy only inside browser-memory teaching compartments.
- `src/ui/`: timeline, record table, attacker pane, per-step transcript, expert disclosures.
- `src/**/*.test.ts` for Vitest; `e2e/` separate under Playwright. Mark future KEM migration and policy-pluggability with `// [extension] point` but do not implement them.

### UI / THE ONE INTERACTION

1. **Prepare:** Create three named, fictional records and encrypt them; see “Key A: active” and authenticated ciphertext receipts.
2. **Rotate:** Switch new writes to Key B. Old records remain under A unless re-encrypted; show a key-to-record matrix before/after.
3. **Incident:** Click **“An attacker copied Key A”**, capture one synthetic ciphertext, and press **“Try decrypting with stolen key.”** Render the *actual decrypted bytes* with a visible alarm, even though GCM authenticated successfully.
4. **Respond:** Choose deactivate / revoke future use, re-encrypt remaining records, or make recovery backup. The matrix shows what is protected, unavailable, and forever exposed from existing attacker copies.
5. **Expert panel:** AAD, IV, ciphertext, authentication tag, key identifier, state transitions, action log and cryptoperiod explanation. Logs contain metadata only.

**Visual semantics:** Success = cryptographic check AND allowed policy; a technically valid decrypt by an adversary renders **`AUTHENTICATED — CONFIDENTIALITY LOST`** with warning icon, text and color. Unavailable-key recovery renders **`UNRECOVERABLE`** not “wrong password.” Never make a compromised decrypt green.

### EDGE CASES (fail closed)

Duplicate IV attempt (explicitly rejected by demo guard); wrong key; altered tag; modified AAD; stale record reference; missing historical key; backup from a compromised epoch; re-encrypt after destroy; no active key. Every error names the cause and retires stale results without corrupting record state.

## §2 / The lesson & negative claim

**Plain-language opening:** Encryption hides data using a key. Most security incidents aren't a broken cipher: someone loses, copies, overuses or fails to retire the key. Rotation is an important response, but it cannot un-read what an attacker already decrypted.

**Negative claim fixture (§4.1d):** “Successful authenticated decryption does **not** prove the key was kept confidential.” Drive a ciphertext + copied key through real `crypto.subtle.decrypt`: all *cryptographic* checks pass; the UI must still visibly say `AUTHENTICATED — CONFIDENTIALITY LOST`. An independent UI test must assert both simultaneously and fail if the warning is removed.

## TESTS / MEASURABLE DONE

- NIST SP 800-38D AES-GCM known-answer fixtures (include 256-bit-key cases), plus round-trip, wrong-key, IV uniqueness and tamper/AAD rejection; all invoked in CI.
- Property/state-machine tests: invalid transitions fail, deactivation blocks **new** encryption, historic reads follow the chosen policy, broken backups do not revive unavailable keys, captured ciphertext still decrypts after rotate.
- `e2e/claims.spec.ts`: distinguish re-wrap/rotation/re-encryption, drive negative fixture, verify record-key matrix from real data, ensure changed inputs retire stale verdict and a no-op does not.
- Run a **replayable source-mutation script** for each `data-verdict`/`data-claim`: baseline green, mutation applied, rebuilt bundle changed, owning test red, restore and rerun green. Include a separate mutation removing the negative-claim warning.
- **Accessibility and delivery:** master template §3 dark pinned `cl-topbar`, single hero H1, adjacent Why It Matters, scripture footer; §4 WCAG 2.1 AA zero axe violations on the *production build*, keyboard and narrow-viewport states; §5 README; §6 Actions deployment, grouped Dependabot, PR gate, auto-merge + explicit dispatch, unique strict Playwright port and catalog registries.
- Report exact test counts and KAT source; verify live served bytes after deploy, not CI alone. Do not make a catalog card until a functioning real lab is deployed and its source evidence is scanned.

## Links & primary references

- [NIST SP 800-57 Part 1 Rev. 5](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final) — stable final reference; re-check for newer final revisions when implementing.
- [NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final) — GCM/GMAC.
- [Envelope KMS](https://systemslibrarian.github.io/crypto-lab-envelope-kms/) · [PQ Rotation](https://systemslibrarian.github.io/crypto-lab-pq-rotation/) · [Ghost Commit](https://systemslibrarian.github.io/crypto-lab-ghost-commit/).

**Ship criterion:** The student can personally verify that a *green authentication result can accompany a lost confidentiality guarantee*, with real ciphertext, no fictitious proof, and no claims of secure erasure.
