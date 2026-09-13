import model from "./data/demo-model.json";
import meta from "./data/model-meta.json";
export type DemoInput = {
  locality: string;
  area_sqft: number;
  bedrooms: number;
  bathrooms: number;
  house_age: number;
  parking_spaces: number;
  furnishing: string;
};
export function predictDemo(input: DemoInput) {
  if (!input || !meta.localities.includes(input.locality))
    throw new Error("This locality is not covered by the demonstration model.");
  const bounds = meta.feature_bounds as Record<string, number[]>;
  const obj = input as unknown as Record<string, unknown>;
  model.numeric.forEach((key) => {
    const value = obj[key];
    const [lo, hi] = bounds[key];
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < lo ||
      value > hi ||
      (key !== "area_sqft" && !Number.isInteger(value))
    )
      throw new Error(
        `${key.replaceAll("_", " ")} must be ${lo}–${hi}${key === "area_sqft" ? "" : " (whole numbers)"}.`,
      );
  });
  if (!model.categories[1].includes(input.furnishing))
    throw new Error("Select a valid furnishing category.");
  const x = model.numeric.map(
    (k, i) => (Number(obj[k]) - model.mean[i]) / model.scale[i],
  );
  model.categories[0].forEach((c) => x.push(c === input.locality ? 1 : 0));
  model.categories[1].forEach((c) => x.push(c === input.furnishing ? 1 : 0));
  // sklearn trees compare float32 predictor values.
  const features = x.map((v) => Math.fround(v));
  let logRate = model.initial;
  for (const tree of model.trees) {
    let node = 0;
    while (tree.left[node] !== -1)
      node =
        features[tree.feature[node]] <= tree.threshold[node]
          ? tree.left[node]
          : tree.right[node];
    logRate += model.learningRate * tree.value[node];
  }
  const price = Math.exp(logRate) * input.area_sqft;
  if (!Number.isFinite(price) || price <= 0)
    throw new Error("The model could not produce a valid estimate.");
  return {
    price,
    rate: price / input.area_sqft,
    low: Math.max(0, price * (1 - meta.relative_interval_q)),
    high: price * (1 + meta.relative_interval_q),
    model: meta.best_model,
    dataKind: "synthetic",
    disclaimer:
      "Synthetic demonstration. Not validated against real Chennai property sales.",
  };
}
