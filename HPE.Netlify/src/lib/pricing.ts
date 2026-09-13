import catalogue from "./data/rates.json";
export const rates = catalogue;
export type Locality = (typeof rates)[number];
export type EstimateInput = {
  locality: string;
  area: number;
  unit: "sqft" | "sqm";
  customRate?: number;
};
export const SQM_TO_SQFT = 10.76391041671;
export function areaInSqft(area: number, unit: string) {
  if (unit !== "sqft" && unit !== "sqm")
    throw new Error("Choose square feet or square metres.");
  if (typeof area !== "number" || !Number.isFinite(area))
    throw new Error("Enter a valid area.");
  const sqft = area * (unit === "sqm" ? SQM_TO_SQFT : 1);
  if (sqft < 300 - 0.01 || sqft > 5000 + 0.01)
    throw new Error("Enter an apartment area between 300 and 5,000 sq ft.");
  return Math.max(300, Math.min(5000, sqft));
}
export function benchmark(input: EstimateInput) {
  const locality = rates.find((r) => r.name === input.locality);
  if (!locality) throw new Error("Select a supported Chennai locality.");
  const sqft = areaInSqft(input.area, input.unit);
  const custom = input.customRate !== undefined;
  if (
    custom &&
    (typeof input.customRate !== "number" ||
      !Number.isFinite(input.customRate) ||
      input.customRate < 100 ||
      input.customRate > 100000)
  )
    throw new Error(
      "Enter a quoted rate between ₹100 and ₹1,00,000 per sq ft.",
    );
  const rate = custom ? input.customRate! : locality.average;
  return {
    locality: locality.name,
    sqft,
    rate,
    price: Math.round(sqft * rate),
    low: Math.round(sqft * locality.low),
    high: Math.round(sqft * locality.high),
    custom,
    source: locality.source,
    period: locality.period,
    checked: locality.checked,
  };
}
export function inr(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}
export function compact(n: number) {
  return n >= 1e7
    ? `₹${(n / 1e7).toFixed(2)} Cr`
    : `₹${(n / 1e5).toFixed(2)} L`;
}
export function priceParts(n: number) {
  return n >= 1e7
    ? { value: (n / 1e7).toFixed(2), unit: "crore" }
    : { value: (n / 1e5).toFixed(2), unit: "lakh" };
}
