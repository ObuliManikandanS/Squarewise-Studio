// Deterministic source-model parity and benchmark checks; no server needed.
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const assert = require("node:assert/strict");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "squarewise-pricing-"));
try {
  fs.cpSync(path.join(root, "src/lib/data"), path.join(tmp, "data"), {
    recursive: true,
  });
  for (const name of ["pricing", "predict-demo"]) {
    const source = fs.readFileSync(
      path.join(root, `src/lib/${name}.ts`),
      "utf8",
    );
    const js = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    fs.writeFileSync(path.join(tmp, `${name}.cjs`), js);
  }
  const { benchmark } = require(path.join(tmp, "pricing.cjs"));
  const { predictDemo } = require(path.join(tmp, "predict-demo.cjs"));
  assert.equal(
    benchmark({ locality: "Porur", area: 1200, unit: "sqft" }).price,
    9588000,
  );
  assert.equal(
    benchmark({ locality: "Porur", area: 1200 / 10.76391041671, unit: "sqm" })
      .price,
    9588000,
  );
  assert.equal(
    benchmark({ locality: "Porur", area: 1200, unit: "sqft", customRate: 8500 })
      .price,
    10200000,
  );
  assert.throws(() =>
    benchmark({ locality: "Unknown", area: 1200, unit: "sqft" }),
  );
  assert.throws(() =>
    benchmark({ locality: "Porur", area: NaN, unit: "sqft" }),
  );
  assert.throws(() =>
    benchmark({ locality: "Porur", area: 1200, unit: "acre" }),
  );
  assert.throws(() =>
    benchmark({ locality: "Porur", area: 1200, unit: "sqft", customRate: -1 }),
  );
  const fixtures = JSON.parse(
    fs.readFileSync(path.join(root, "src/lib/data/parity-fixtures.json")),
  );
  let maximum = 0;
  for (const fixture of fixtures) {
    const result = predictDemo(fixture.input);
    const error = Math.abs(result.price - fixture.expected);
    maximum = Math.max(maximum, error);
    assert.ok(error < 0.01, `Parity error ₹${error}`);
    assert.ok(result.low < result.price && result.high > result.price);
  }
  assert.throws(() =>
    predictDemo({ ...fixtures[0].input, locality: "Unsupported" }),
  );
  assert.throws(() => predictDemo({ ...fixtures[0].input, area_sqft: 5000 }));
  assert.throws(() => predictDemo({ ...fixtures[0].input, bedrooms: 2.4 }));
  console.log(
    `Pricing checks passed. ${fixtures.length} JavaScript predictions match Python within ₹0.01. Maximum error: ₹${maximum}.`,
  );
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
