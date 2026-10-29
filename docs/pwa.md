# Progressive web app

Simple Tasks can be installed as a standalone application through the browser's installation menu. Chromium browsers also expose **Install app** in the workspace when a real installation prompt is available. On iPhone or iPad, open the site in Safari, choose Share, then Add to Home Screen. Installation requires HTTPS in production; localhost is supported for development.

The original artwork in `src/app/icon.png` remains the brand source. `/icons/icon-192.png` and `/icons/icon-512.png` are resized copies. The maskable icon places the same artwork inside the safe central area on an opaque background. `/icons/apple-touch-icon.png` is an opaque 180px export for Apple launchers. No replacement logo is generated.

## Integration

`src/app/manifest.ts` supplies the stable root identity, scope, start URL and standalone display mode. Next.js automatically links `/manifest.webmanifest` in the document. The root metadata references `/icons/apple-touch-icon.png` for Apple devices.

Mount `PwaRegistration` from `@/components/pwa/pwa-registration` once inside `AppProviders`. It registers `/sw.js` after page load on secure origins and returns no UI. Mount `PwaInstallButton` from `@/components/pwa/pwa-install-button` inside a localized workspace surface. For example, `<PwaInstallButton className="justify-start" />` offers the native prompt only after an explicit press. It renders nothing when installation is unavailable or the app is already installed.

Serve `/sw.js` with JavaScript content type, `Cache-Control: no-store, max-age=0` and `Service-Worker-Allowed: /`. A failed registration leaves the regular website usable.

## Offline behavior and privacy

The service worker precaches only `/offline.html` and the four public launcher icons, fetching them without session credentials. It never writes task data, tokens, API responses, authenticated HTML or RSC payloads into Cache Storage. Same-origin document navigation goes to the network; a network failure returns the static offline document. Server authentication errors and redirects are returned as-is. API requests, RSC requests and all mutations stay on the normal browser network path.

The offline page contains no user data. Its retry link preserves the requested route, and its text follows the browser language in English or Spanish. Offline viewing and editing of tasks are not supported. An already open task draft is never automatically reloaded by the PWA code.

Updates use the standard service-worker lifecycle. A new worker waits for existing controlled windows to close rather than calling `skipWaiting` or forcing reloads. Activation deletes only obsolete `simple-tasks-public-*` caches and claims clients. Bump `CACHE_NAME` in `/sw.js` when the precached asset set changes.

## Validation

`tests/unit/pwa-manifest.test.ts` checks actual icon dimensions and verifies the standard icon pixels derive from the original artwork. `tests/unit/pwa-worker.test.ts` exercises the shipped worker in isolation, covering public-only precaching, private-document network handling, offline fallback, redirects, API/RSC/mutation bypass and cache cleanup. `tests/e2e/pwa.spec.ts` checks the document metadata, a controlling worker, public-only cache contents and offline navigation/recovery against a running production build.

Run the focused unit checks with `bunx vitest run tests/unit/pwa-worker.test.ts tests/unit/pwa-manifest.test.ts`. Run browser coverage with `PLAYWRIGHT_BASE_URL=http://localhost:3100 bunx playwright test tests/e2e/pwa.spec.ts` while the app is served against its disposable test database.

- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Next.js manifest convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest)
- [MDN service-worker lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [MDN install prompt](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
