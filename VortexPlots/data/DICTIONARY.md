# Data contract

Locations: immutable district slug, canonical district name, region, district source URL, verified date. Localities have district-scoped IDs and are search names; official classifications remain pending. No locality alias is certified yet.

Price observations: see observation-template.csv. Rate is per stated rateUnit; currency must be INR. effectiveDate is the observation date, collectedDate the ingestion date. propertyId identifies the source record for deduplication. sampleSize must be known. reuseApproval and verifiedBy retain the permission/review trail in the original input. Government guideline, transaction and asking observations cannot be combined. Land uses plot area, apartments and houses use built-up area. No implicit land/construction summation.

Production observations.json is empty. No adequate licensed observations have been acquired. The previous name-hash rates are removed, not ingested as training examples.

Ingestion retains exact original input and a content hash, validates all rows, removes duplicates, rejects unknown locations, missing provenance, future/stale dates and incompatible units. An invalid batch never replaces the last valid dataset. Re-run with --approve only after source rights and data review. Version the resulting source commit and update datasetVersion for every accepted batch.

Models: no trained model deployed. calculate() only uses explicitly entered rates or compatible independently reviewed observations. A median is a descriptive baseline, not regression. Min/max observed rates are a spread, never a confidence interval.

Private entities are versioned JSON records in Netlify Blobs under authenticated user/kind/UUID paths. kinds: properties, estimates, searches, pdfs, inquiries. Properties are mutable. Saved estimates and report snapshots are immutable. Production and preview stores are isolated. Previous D1 schema/migrations remain untouched, and no prior identity-to-identity mapping is inferred.
