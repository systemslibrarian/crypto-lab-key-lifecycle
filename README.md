# Key Lifecycle

**Status:** working interactive teaching implementation with automated checks. Passing CI or successful publication is not a formal security audit. GitHub Pages publication includes an explicit source-SHA check against served bytes.

## What It Is

A browser-only incident-response demonstration using genuine WebCrypto AES-256-GCM. Encrypt three fictional library records with Key A, rotate future writes to Key B, give an attacker a real copy of Key A, and watch the attacker authenticate and decrypt an archived record. Keys and records are synthetic, created in browser memory, and never uploaded. This is not a production key manager.

## Exhibits

1. **Encrypt:** create three AES-GCM records with fresh 96-bit IVs, 128-bit tags, and record/epoch-bound additional authenticated data.
2. **Rotate:** create Key B without silently rewriting Key-A ciphertext.
3. **Compromise:** copy the original Key A and archived ciphertext, then actually decrypt and authenticate with the attacker-held key.
4. **Respond:** re-encrypt the library's current copies, retire its reference to Key A, and check why the archived stolen snapshot remains exposed.
5. **Tamper:** flip a ciphertext bit and require the genuine GCM decrypt to reject it; a missing old key is not misreported as an integrity success.

## Guided lifecycle path

The optional [ten-stage journey](https://systemslibrarian.github.io/crypto-lab-key-lifecycle/#guided-path) connects generation, transfer and verification, purpose-specific use, rotation, protected storage, backup and recovery, compromise response, key lifetimes, destruction and public-key trust. Each stage gives a concrete library scenario, two choices with separate explanations, and a deeper exhibit or primary reference. Learners can compare alternatives and revisit stages.

These decisions are teaching scenarios: they do not implement key transfer, persistent storage, backup, revocation or secure erasure. The existing AES-GCM incident experiment remains the executable cryptographic component. References: [NIST SP 800-57 Part 1 Rev. 5](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final) and [SP 800-88 Rev. 2](https://csrc.nist.gov/pubs/sp/800/88/r2/final).

The [Applied Cryptography reading path](https://crypto-lab.systemslibrarian.dev/learn/applied-cryptography/) connects this exhibit to Chapter 8 and the rest of the collection.

## When to Use It

Authenticated decryption establishes integrity under the supplied key; it does not establish who has copies of that key. Key rotation protects new encryption, not pre-existing ciphertext already exposed with a compromised old key.

**Do not use:** This code with real keys, credentials, signatures, records or adversaries. The experiment isolates one mechanism; it is not a deployable cryptographic service.

## Live Demo

[Open Key Lifecycle](https://systemslibrarian.github.io/crypto-lab-key-lifecycle/). Publication is performed through GitHub Actions. The deploy job checks that the page serves the exact source commit before reporting a successful deployment. If this check fails, the public site must be treated as **unverified** even if an earlier artifact was published.

## What Can Go Wrong

Key loss can make historical ciphertext unreadable; a copied key can still decrypt archived ciphertext after retirement. Neither deleting an in-memory reference nor completing re-encryption means secure erasure of an adversary's data.

## Real-World Usage

NIST SP 800-38D (AES-GCM); NIST SP 800-57 (key management). Related: [Envelope KMS](https://systemslibrarian.github.io/crypto-lab-envelope-kms/), [PQ Rotation](https://systemslibrarian.github.io/crypto-lab-pq-rotation/), [Ghost Commit](https://systemslibrarian.github.io/crypto-lab-ghost-commit/).

## How to Run Locally

Install with `npm ci`, run `npm test`, `npm run build`, and `npm run test:a11y` before using `npm run dev`. Browser tests serve a freshly rebuilt production artifact. Do not skip the accessibility or correctness gate.

## Related Demos

NIST SP 800-38D (AES-GCM); NIST SP 800-57 (key management). Related: [Envelope KMS](https://systemslibrarian.github.io/crypto-lab-envelope-kms/), [PQ Rotation](https://systemslibrarian.github.io/crypto-lab-pq-rotation/), [Ghost Commit](https://systemslibrarian.github.io/crypto-lab-ghost-commit/).

## Build & Verify

The suite covers the NIST SP 800-38D all-zero AES-256-GCM known-answer tag, authenticated round trips, wrong keys, tag and AAD tampering, lifecycle transitions, captured-key decryption and missing-key failure. Playwright exercises the actual incident path and accessibility at desktop and mobile widths.

CI runs Vitest and Playwright, checks the production build, and refuses deployment on failures. After the Pages publish step, a fresh HTTP GET must return `deployment.json` identifying the exact `GITHUB_SHA` and GitHub repository, and a second GET must return HTML containing the app mount. The hosted source SHA is **deployed build identity evidence**, not a cryptographic security proof. Full negative-claim and mutation-test compliance remains subject to independent review.

---

*One of the browser demos in the [Crypto Lab](https://crypto-lab.systemslibrarian.dev/) suite.*

*"So whether you eat or drink or whatever you do, do it all for the glory of God." — 1 Corinthians 10:31*
