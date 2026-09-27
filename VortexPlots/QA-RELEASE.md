# Final release verification

## Reproduce

Run `pnpm check`, `pnpm test`, and `pnpm build:render`.

The integration runner uses an isolated in-memory PostgreSQL engine, real migrations, real Better Auth sessions and the production Next.js build. It never connects to Render data or sends email.

```
npm install --prefix /tmp/vortex-qa @electric-sql/pglite@0.5.8 @electric-sql/pglite-socket
node scripts/integration-qa.mjs
```

Override `PGLITE_QA_ROOT` if the temporary dependency directory differs. Ports 4301 and 55432 must be available. All temporary users and records disappear when the runner exits. Test output and generated PDFs remain in that temporary directory.

## Results

- 22 calculation and dataset tests passed, including all 630 source records, unit conversion, category/basis isolation, freshness filtering, Ridge inference parity and source-range formulas.
- TypeScript check and production build passed.
- 18 integration groups passed: migrations; protected routes; registration; auth-page redirect; route rendering; save/deduplicate/ownership; property editing; dashboard research; preferences; review moderation/filter/helpful/report/ownership; seven PDF types; report ownership and re-download; contact success/failure; export; password update; sign-out/sign-in; record deletion; account deletion cascade.
- Sign-in gateway visually checked at desktop width with no horizontal overflow. PDF content checked for section titles and matching price calculations.

## Remaining limitations

- Browser checks of authenticated screens and physical mobile/touch devices are not complete. Integration tests verify their server rendering and APIs, not every browser interaction.
- Email recovery, verification and notifications require configured delivery credentials; no sent-email success is claimed without delivery.
- Screened advertisements are not verified completed sales. Source/collection dates are distinguished from missing effective dates; sparse samples are low confidence.
- User-supplied district reference ranges have no source URLs, effective dates or area bases and remain unverified, excluded from training.
- Ridge validation is measured on held-out asking records, not transactions or temporal forecasting. No calibrated confidence interval is available.
- Map boundaries are reference data of mixed vintages through 2022, not a cadastral survey. Locality names do not establish authoritative ward/taluk membership.
- Database integration uses PGlite's PostgreSQL wire server; production concurrency and external email delivery require separate operational testing.
