"use client";
import { useEffect, useMemo, useState } from "react";
import Dashboard from "@/components/Dashboard";
import { flushSync } from "react-dom";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calculator,
  Check,
  CheckCheck,
  ChevronRight,
  ChartNoAxesCombined,
  ExternalLink,
  FileText,
  Info,
  Layers,
  MapPin,
  Minus,
  Plus,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  RotateCcw,
  SlidersHorizontal,
  FlaskConical,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  rates,
  benchmark,
  areaInSqft,
  inr,
  compact,
  priceParts,
  SQM_TO_SQFT,
  type Locality,
} from "@/lib/pricing";
import meta from "@/lib/data/model-meta.json";

type ModelResult = {
  price: number;
  rate: number;
  low: number;
  high: number;
  model: string;
  dataKind: string;
  disclaimer: string;
};
type Mode = "benchmark" | "quote" | "demo";
type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
const defaults = {
  bedrooms: 2,
  bathrooms: 2,
  house_age: 5,
  parking_spaces: 1,
  furnishing: "Unfurnished",
};
function SectionTitle({
  number,
  title,
  caption,
}: {
  number: string;
  title: string;
  caption?: string;
}) {
  return (
    <div className="section-heading">
      <span className="section-number">{number}</span>
      <div>
        <h2>{title}</h2>
        {caption && <p>{caption}</p>}
      </div>
    </div>
  );
}
function Stepper({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="stepper-row">
      <span>{label}</span>
      <div className="stepper">
        <button
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <Minus size={15} />
        </button>
        <output>{value}</output>
        <button
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
function RatePicker({
  value,
  onChange,
  label = "Locality",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <Combobox
      items={rates.map((r) => r.name)}
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v);
      }}
    >
      <ComboboxInput
        aria-label={label}
        className="locality-input"
        placeholder="Search a Chennai locality"
      />
      <ComboboxContent>
        <ComboboxEmpty>No supported locality found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              <MapPin size={15} />
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
function Download({
  value,
  name,
  label = "Download estimate",
}: {
  value: unknown;
  name: string;
  label?: string;
}) {
  return (
    <button
      className="button outline"
      onClick={() => {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(value, null, 2)], {
            type: "application/json",
          }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}
    >
      <ArrowDownToLine size={17} />
      {label}
    </button>
  );
}

export default function Home() {
  const [tab, setTab] = useState("dashboard");
  const [locality, setLocality] = useState("Porur");
  const [area, setArea] = useState("1200");
  const [unit, setUnit] = useState<"sqft" | "sqm">("sqft");
  const [mode, setMode] = useState<Mode>("benchmark");
  const [quote, setQuote] = useState("7990");
  const [confirmed, setConfirmed] = useState(false);
  const [details, setDetails] = useState(defaults);
  const [modelResult, setModelResult] = useState<ModelResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [modelError, setModelError] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [comparison, setComparison] = useState([
    "Porur",
    "Velachery",
    "Anna Nagar",
  ]);
  const [compareChoice, setCompareChoice] = useState("Adyar");
  const selected = rates.find((r) => r.name === locality)!;
  const calculated = useMemo(() => {
    try {
      return {
        value: benchmark({
          locality,
          area: Number(area),
          unit,
          ...(mode === "quote" ? { customRate: Number(quote) } : {}),
        }),
        error: "",
      };
    } catch (e) {
      return {
        value: null,
        error: e instanceof Error ? e.message : "Check your inputs.",
      };
    }
  }, [locality, area, unit, mode, quote]);
  const value = calculated.value;
  const estimate = mode === "demo" ? modelResult : value;
  const visibleEstimate =
    mode === "demo" && (loading || modelError) ? null : estimate;
  const parts = visibleEstimate ? priceParts(visibleEstimate.price) : null;
  const sqft = value?.sqft;
  const reset = () => {
    setLocality("Porur");
    setArea("1200");
    setUnit("sqft");
    setMode("benchmark");
    setQuote("7990");
    setDetails(defaults);
    setConfirmed(false);
  };
  const changeUnit = (next: "sqft" | "sqm") => {
    if (next === unit) return;
    const n = Number(area);
    if (Number.isFinite(n))
      setArea(
        String(
          Number(
            (next === "sqm" ? n / SQM_TO_SQFT : n * SQM_TO_SQFT).toFixed(4),
          ),
        ),
      );
    setUnit(next);
  };
  useEffect(() => {
    if (mode !== "demo") {
      setLoading(false);
      setModelError("");
      return;
    }
    if (!value) {
      setModelResult(null);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setModelError("");
    setLoading(true);
    setModelResult(null);
    const timer = setTimeout(async () => {
      try {
        const { predictDemo } = await import("@/lib/predict-demo");
        if (ac.signal.aborted) return;
        const result = predictDemo({
          locality,
          area_sqft: value.sqft,
          ...details,
        });
        setModelResult(result);
      } catch (e) {
        if (!ac.signal.aborted)
          setModelError(
            e instanceof Error ? e.message : "Prediction unavailable.",
          );
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [mode, value, locality, details]);
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: "configure_apartment_benchmark",
            description:
              "Set Chennai locality and area in the visible estimator and return the published apartment benchmark. No valuation or sale is created.",
            inputSchema: {
              type: "object",
              properties: {
                locality: { type: "string", enum: rates.map((r) => r.name) },
                area: { type: "number", minimum: 300, maximum: 5000 },
              },
              required: ["locality", "area"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute: (input: unknown) => {
              if (!input || typeof input !== "object")
                throw new Error("Locality and area are required.");
              const r = input as { locality: string; area: number };
              const result = benchmark({ ...r, unit: "sqft" });
              flushSync(() => {
                setTab("estimate");
                setMode("benchmark");
                setLocality(r.locality);
                setArea(String(r.area));
                setUnit("sqft");
                setConfirmed(false);
              });
              return {
                ...result,
                method:
                  "Published locality benchmark; area basis must be checked.",
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* Unsupported registry is optional. */
    }
    return () => lifecycle.abort();
  }, []);
  const compared = comparison
    .map((name) => rates.find((r) => r.name === name)!)
    .filter(Boolean);
  const filtered = rates
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === "low"
        ? a.average - b.average
        : sort === "high"
          ? b.average - a.average
          : a.name.localeCompare(b.name),
    );
  const report =
    visibleEstimate && value
      ? {
          project: "Squarewise",
          locality,
          property_type: "Multistorey Apartment",
          method:
            mode === "demo"
              ? "Synthetic Gradient Boosting demonstration"
              : mode === "quote"
                ? "User-supplied quoted rate"
                : "Published locality apartment benchmark",
          input_area: Number(area),
          unit,
          area_sqft: value.sqft,
          area_basis:
            "Comparable listed area confirmed by user; source basis unspecified",
          rate_inr_per_sqft: visibleEstimate.rate,
          total_inr: visibleEstimate.price,
          range_low_inr: visibleEstimate.low,
          range_high_inr: visibleEstimate.high,
          range_meaning:
            mode === "demo"
              ? "90% calibrated interval on synthetic records"
              : "Published locality rate range multiplied by area; not a confidence interval",
          rate_source:
            mode === "quote"
              ? "Unverified rate entered by user"
              : selected.source,
          benchmark_period: selected.period,
          source_checked: selected.checked,
          ...(mode === "demo" ? { features: details } : {}),
          exclusions:
            "Taxes, registration, interiors and extra purchase charges.",
          limitations:
            mode === "demo"
              ? "Synthetic data; real-world accuracy unvalidated."
              : "Not a property-specific appraisal. Area basis and property comparability require verification.",
        }
      : null;

  return (
    <Tabs value={tab} onValueChange={setTab} className="site-shell">
      <a className="skip-link" href="#main">
        Skip to estimator
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a href="/" className="brand" aria-label="Squarewise home">
            <span className="brand-mark">
              <Building2 size={23} />
            </span>
            squarewise<span className="brand-dot">.</span>
          </a>
          <TabsList className="nav-tabs" aria-label="Main navigation">
            <TabsTrigger value="dashboard">
              <ChartNoAxesCombined size={17} />
              Overview
            </TabsTrigger>
            <TabsTrigger value="estimate">
              <Calculator size={17} />
              Estimate home
            </TabsTrigger>
            <TabsTrigger value="explore">
              <MapPin size={17} />
              Explore localities
            </TabsTrigger>
            <TabsTrigger value="method">
              <Layers size={17} />
              Model & sources
            </TabsTrigger>
          </TabsList>
          <div className="sidebar-note">
            <div>
              <ShieldCheck size={21} />
              <strong>Know your numbers.</strong>
            </div>
            <p>
              Traceable rates.
              <br />
              Transparent calculations.
            </p>
            <span>CHENNAI EDITION · 2026</span>
          </div>
        </div>
      </header>
      <main id="main" className="main-wrap">
        <div className="workspace-bar">
          <span>
            <span className="workspace-title">Squarewise Studio</span>
            <ChevronRight size={14} />
            {tab === "dashboard"
              ? "Overview"
              : tab === "estimate"
                ? "Home estimator"
                : tab === "explore"
                  ? "Locality explorer"
                  : "Model & sources"}
          </span>
          <span className="workspace-location">
            <MapPin size={14} /> Chennai, Tamil Nadu
          </span>
        </div>
        <TabsContent value="dashboard" className="view-content">
          <Dashboard
            locality={locality}
            area={value?.sqft ?? 1200}
            onLocality={(v) => {
              setLocality(v);
              setConfirmed(false);
            }}
            onArea={(v) => {
              setArea(String(v));
              setUnit("sqft");
            }}
            onNavigate={(v) => {
              setTab(v);
              setMode("benchmark");
            }}
          />
        </TabsContent>
        <TabsContent value="estimate" className="view-content">
          <div className="page-intro">
            <div>
              <div className="eyebrow">
                <span>YOUR ESTIMATION WORKSPACE</span>
                <span className="slash">/</span> CHENNAI
              </div>
              <h1>
                Your home, <span>in numbers.</span>
              </h1>
              <p>
                Find your apartment’s price benchmark. Know what’s behind it.
              </p>
            </div>
            <button className="snapshot" onClick={() => setSourceOpen(true)}>
              <span className="snapshot-icon">
                <ShieldCheck size={20} />
              </span>
              <span>
                <strong>Published locality rates</strong>
                <small>Q2 2026 snapshot · View sources</small>
              </span>
              <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="estimator-grid">
            <section className="form-card">
              <div className="form-header">
                <SectionTitle number="01" title="Tell us about your home" />
                <button
                  className="icon-button"
                  aria-label="Reset estimate"
                  onClick={reset}
                >
                  <RotateCcw size={16} />
                </button>
              </div>
              <div className="property-type">
                <span className="type-icon">
                  <Building2 size={23} />
                </span>
                <div>
                  <strong>Multistorey apartment</strong>
                  <small>Residential · Chennai</small>
                </div>
                <span className="type-check">
                  <Check size={15} />
                </span>
              </div>
              <div className="field">
                <label htmlFor="locality-label" id="locality-label">
                  <MapPin size={16} /> Where is your apartment?
                </label>
                <RatePicker
                  value={locality}
                  onChange={(v) => {
                    setLocality(v);
                    setConfirmed(false);
                  }}
                />
                <div className="field-hint">
                  <span>{rates.length} sourced localities</span>
                  <button onClick={() => setTab("explore")}>
                    Explore rates <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
              <div className="field area-field">
                <div className="field-heading">
                  <label htmlFor="area">
                    <Ruler size={16} /> Apartment area
                  </label>
                  <Tabs
                    value={unit}
                    onValueChange={(v) => changeUnit(v as "sqft" | "sqm")}
                  >
                    <TabsList className="unit-tabs" aria-label="Area unit">
                      <TabsTrigger value="sqft">sq ft</TabsTrigger>
                      <TabsTrigger value="sqm">sq m</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="area-input-wrap">
                  <input
                    id="area"
                    type="number"
                    inputMode="decimal"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    min={unit === "sqft" ? 300 : 300 / SQM_TO_SQFT}
                    max={unit === "sqft" ? 5000 : 5000 / SQM_TO_SQFT}
                    step="any"
                    aria-describedby="area-note"
                  />
                  <span>{unit === "sqft" ? "sq ft" : "sq m"}</span>
                </div>
                <Slider
                  aria-label="Apartment area in square feet"
                  min={300}
                  max={5000}
                  step={25}
                  value={[Math.min(5000, Math.max(300, sqft || 300))]}
                  onValueChange={(v) =>
                    setArea(
                      String(
                        unit === "sqft"
                          ? v[0]
                          : Number((v[0] / SQM_TO_SQFT).toFixed(4)),
                      ),
                    )
                  }
                />
                <div className="slider-labels">
                  <span>300 sq ft</span>
                  <span>5,000 sq ft</span>
                </div>
                <p id="area-note" className="microcopy">
                  Use comparable listed area. Carpet and built-up areas are not
                  interchangeable.
                </p>
              </div>
              <div className="field">
                <label>
                  <SlidersHorizontal size={16} /> How should we calculate?
                </label>
                <Select
                  value={mode}
                  onValueChange={(v) => {
                    setMode(v as Mode);
                    setConfirmed(false);
                  }}
                >
                  <SelectTrigger
                    className="mode-select"
                    aria-label="Calculation method"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="benchmark">
                      Published locality rate
                    </SelectItem>
                    <SelectItem value="quote">
                      My property’s quoted rate
                    </SelectItem>
                    <SelectItem value="demo">
                      ML prediction · synthetic demo
                    </SelectItem>
                  </SelectContent>
                </Select>
                {mode === "benchmark" && (
                  <div className="rate-note">
                    <span>Using {locality}’s average</span>
                    <strong>
                      ₹{inr(selected.average)}
                      <small> / sq ft</small>
                    </strong>
                  </div>
                )}
                {mode === "quote" && (
                  <div className="quote-field">
                    <label htmlFor="quote">Your quoted rate · ₹ / sq ft</label>
                    <input
                      id="quote"
                      type="number"
                      value={quote}
                      min={100}
                      max={100000}
                      onChange={(e) => setQuote(e.target.value)}
                    />
                    <p className="microcopy">
                      Use a current builder or seller quote. This rate is
                      supplied by you and is not independently verified.
                    </p>
                  </div>
                )}
                {mode === "demo" && (
                  <div className="demo-fields">
                    <div className="warning-inline">
                      <FlaskConical size={17} />
                      <span>
                        Trained on synthetic properties. For project
                        demonstration only.
                      </span>
                    </div>
                    <Stepper
                      label="Bedrooms"
                      value={details.bedrooms}
                      min={1}
                      max={5}
                      onChange={(v) => setDetails({ ...details, bedrooms: v })}
                    />
                    <Stepper
                      label="Bathrooms"
                      value={details.bathrooms}
                      min={1}
                      max={6}
                      onChange={(v) => setDetails({ ...details, bathrooms: v })}
                    />
                    <Stepper
                      label="Age in years"
                      value={details.house_age}
                      min={0}
                      max={35}
                      onChange={(v) => setDetails({ ...details, house_age: v })}
                    />
                    <Stepper
                      label="Parking spaces"
                      value={details.parking_spaces}
                      min={0}
                      max={2}
                      onChange={(v) =>
                        setDetails({ ...details, parking_spaces: v })
                      }
                    />
                    <Select
                      value={details.furnishing}
                      onValueChange={(v) =>
                        setDetails({ ...details, furnishing: v })
                      }
                    >
                      <SelectTrigger
                        className="mode-select"
                        aria-label="Furnishing"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Unfurnished", "Semi-Furnished", "Furnished"].map(
                          (v) => (
                            <SelectItem value={v} key={v}>
                              {v}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <label className="confirm-area">
                <Checkbox
                  checked={confirmed}
                  onCheckedChange={(v) => setConfirmed(v === true)}
                />
                <span>
                  I’ve checked that the area basis matches the rate I’m using.
                </span>
              </label>
              {(calculated.error || modelError) && (
                <p className="form-error" role="alert">
                  {calculated.error || modelError}
                </p>
              )}
              <button
                className="button primary full"
                disabled={!confirmed || !visibleEstimate || !!calculated.error}
                onClick={() => setReportOpen(true)}
              >
                View estimate report <ArrowRight size={18} />
              </button>
              <div className="form-footer">
                <ShieldCheck size={14} />
                No personal details required
              </div>
            </section>
            <div className="result-column">
              <section className="price-card" aria-label="Price estimate">
                <div className="property-image">
                  <img
                    src="/apartment.png"
                    alt="Illustrative modern apartment building with tropical landscaping"
                    width="1536"
                    height="1024"
                  />
                  <div className="image-location">
                    <MapPin size={14} />
                    {locality}, Chennai
                  </div>
                  <span className="image-disclaimer">Illustrative image</span>
                </div>
                <div className="price-body">
                  <div className="price-label">
                    <span>
                      {mode === "demo"
                        ? "SYNTHETIC MODEL ESTIMATE"
                        : mode === "quote"
                          ? "YOUR QUOTED-RATE ESTIMATE"
                          : "LOCALITY PRICE BENCHMARK"}
                    </span>
                    <span className="price-live">
                      <Calculator size={13} />
                      Auto-updates
                    </span>
                  </div>
                  <div
                    className="price-number"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {parts ? (
                      <>
                        <span className="rupee">₹</span>
                        {parts.value}
                        <span className="price-unit">{parts.unit}</span>
                      </>
                    ) : (
                      <span className="pending-price">
                        {loading ? "Calculating…" : "Check your inputs"}
                      </span>
                    )}
                  </div>
                  <div className="price-exact">
                    {visibleEstimate
                      ? `₹${inr(visibleEstimate.price)} · Before additional purchase charges`
                      : "Your result appears here when the inputs are valid."}
                  </div>
                  <div className="price-divider" />
                  <div className="price-facts">
                    <div>
                      <span>Area used</span>
                      <strong>
                        {sqft ? inr(sqft) : "—"} <small>sq ft</small>
                      </strong>
                    </div>
                    <span className="math-symbol">×</span>
                    <div>
                      <span>
                        {mode === "demo"
                          ? "Model-implied rate"
                          : mode === "quote"
                            ? "Your quoted rate"
                            : "Published average"}
                      </span>
                      <strong>
                        ₹{visibleEstimate ? inr(visibleEstimate.rate) : "—"}{" "}
                        <small>/ sq ft</small>
                      </strong>
                    </div>
                  </div>
                  <div className="range-section">
                    <div className="range-heading">
                      <span>
                        {mode === "demo"
                          ? "90% interval · synthetic data"
                          : "Published locality range for this area"}
                      </span>
                      <button
                        aria-label="Explain the price range"
                        onClick={() => setSourceOpen(true)}
                      >
                        <Info size={15} />
                      </button>
                    </div>
                    <div className="range-track">
                      <span
                        className="range-marker"
                        style={{
                          left: visibleEstimate
                            ? `${Math.max(2, Math.min(98, ((visibleEstimate.price - visibleEstimate.low) / (visibleEstimate.high - visibleEstimate.low)) * 100))}%`
                            : "50%",
                        }}
                      />
                    </div>
                    <div className="range-values">
                      <strong>
                        {visibleEstimate ? compact(visibleEstimate.low) : "—"}
                      </strong>
                      <strong>
                        {visibleEstimate ? compact(visibleEstimate.high) : "—"}
                      </strong>
                    </div>
                  </div>
                  <div className="price-disclaimer">
                    <Info size={15} />
                    <span>
                      {mode === "demo"
                        ? "Real-world accuracy is unvalidated. This is a working ML demonstration."
                        : mode === "quote"
                          ? "Your total uses your quote. The range uses published locality rates for context."
                          : "An area × rate benchmark, not a property-specific valuation or guaranteed selling price."}
                    </span>
                  </div>
                </div>
              </section>
              <section className="source-strip">
                <div className="source-strip-icon">
                  <FileText size={20} />
                </div>
                <div>
                  <strong>Every rate has a source.</strong>
                  <p>
                    Published apartment rates, with the period and calculation
                    shown.
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label="View rate source"
                  onClick={() => setSourceOpen(true)}
                >
                  <ArrowUpRight size={19} />
                </button>
              </section>
            </div>
          </div>
          <section className="comparison-section">
            <div className="section-top">
              <SectionTitle
                number="02"
                title="Same area. Different neighbourhoods."
                caption={`Compare published-rate benchmarks for ${sqft ? inr(sqft) : "your"} sq ft.`}
              />
              <button className="text-button" onClick={() => setTab("explore")}>
                Explore all {rates.length} <ArrowRight size={16} />
              </button>
            </div>
            <div className="compare-cards">
              {compared.slice(0, 3).map((r, i) => (
                <button
                  className={`compare-card ${r.name === locality ? "selected" : ""}`}
                  key={r.name}
                  onClick={() => {
                    setLocality(r.name);
                    setMode("benchmark");
                    setConfirmed(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <div className="compare-card-head">
                    <span className={`district-icon district-${i}`}>
                      <Building2 size={21} />
                    </span>
                    <ArrowUpRight size={18} />
                  </div>
                  <h3>{r.name}</h3>
                  <span className="compare-card-rate">
                    ₹{inr(r.average)} / sq ft
                  </span>
                  <div className="compare-card-bottom">
                    <strong>{sqft ? compact(sqft * r.average) : "—"}</strong>
                    <span>
                      {r.name === locality ? "Selected" : "Use locality"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="explore" className="view-content">
          <div className="page-intro">
            <div>
              <div className="eyebrow">CHENNAI / LOCALITY EXPLORER</div>
              <h1>
                Find your <span>price neighbourhood.</span>
              </h1>
              <p>Compare published apartment rates, one locality at a time.</p>
            </div>
            <a
              className="button outline"
              href="/downloads/locality-rates.csv"
              download
            >
              <ArrowDownToLine size={17} />
              Rate catalogue
            </a>
          </div>
          <div className="explore-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                aria-label="Search localities"
                placeholder="Search a Chennai locality…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button aria-label="Clear search" onClick={() => setSearch("")}>
                  <X size={16} />
                </button>
              )}
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger aria-label="Sort localities">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Locality: A to Z</SelectItem>
                <SelectItem value="low">Rate: low to high</SelectItem>
                <SelectItem value="high">Rate: high to low</SelectItem>
              </SelectContent>
            </Select>
            <span>{filtered.length} localities · ₹ / sq ft</span>
          </div>
          <div className="explorer-layout">
            <section className="rate-table-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Locality</TableHead>
                    <TableHead>Average / sq ft</TableHead>
                    <TableHead>Published range</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow
                      key={r.name}
                      className={r.name === locality ? "active-row" : ""}
                    >
                      <TableCell>
                        <button
                          className="locality-link"
                          onClick={() => {
                            setLocality(r.name);
                            setMode("benchmark");
                            setTab("estimate");
                            setConfirmed(false);
                          }}
                        >
                          <MapPin size={15} />
                          {r.name}
                        </button>
                      </TableCell>
                      <TableCell className="rate-value">
                        ₹{inr(r.average)}
                      </TableCell>
                      <TableCell>
                        <span className="rate-range">
                          ₹{inr(r.low)} – ₹{inr(r.high)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          className={`compare-toggle ${comparison.includes(r.name) ? "on" : ""}`}
                          disabled={
                            !comparison.includes(r.name) &&
                            comparison.length >= 4
                          }
                          aria-label={`${comparison.includes(r.name) ? "Remove" : "Compare"} ${r.name}`}
                          onClick={() =>
                            setComparison((old) =>
                              old.includes(r.name)
                                ? old.filter((x) => x !== r.name)
                                : [...old, r.name],
                            )
                          }
                        >
                          {comparison.includes(r.name) ? (
                            <Check size={16} />
                          ) : (
                            <Plus size={16} />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!filtered.length && (
                <div className="empty-state">
                  <Search size={26} />
                  <h3>No matching locality</h3>
                  <p>
                    Try a different spelling. We don’t substitute a guessed
                    rate.
                  </p>
                  <button className="text-button" onClick={() => setSearch("")}>
                    Show all localities
                  </button>
                </div>
              )}
            </section>
            <aside className="compare-panel">
              <span className="eyebrow">SIDE BY SIDE</span>
              <h2>Your comparison</h2>
              <p>{sqft ? inr(sqft) : "—"} sq ft · Published average rates</p>
              <div className="compare-bars">
                {compared.map((r) => (
                  <div key={r.name} className="bar-row">
                    <div>
                      <strong>{r.name}</strong>
                      <button
                        aria-label={`Remove ${r.name} from comparison`}
                        onClick={() =>
                          setComparison((old) =>
                            old.filter((x) => x !== r.name),
                          )
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="bar-track">
                      <span
                        style={{
                          width: `${(r.average / Math.max(...compared.map((x) => x.average))) * 100}%`,
                        }}
                      />
                    </div>
                    <div>
                      <small>₹{inr(r.average)}/sq ft</small>
                      <strong>{sqft ? compact(sqft * r.average) : "—"}</strong>
                    </div>
                  </div>
                ))}
              </div>
              {!compared.length && (
                <p className="microcopy">
                  Choose up to four localities using the + buttons.
                </p>
              )}
              <div className="add-compare">
                <Select value={compareChoice} onValueChange={setCompareChoice}>
                  <SelectTrigger aria-label="Choose locality to compare">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rates.map((r) => (
                      <SelectItem key={r.name} value={r.name}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  className="icon-button"
                  aria-label="Add selected locality to comparison"
                  disabled={
                    comparison.length >= 4 || comparison.includes(compareChoice)
                  }
                  onClick={() => setComparison([...comparison, compareChoice])}
                >
                  <Plus size={18} />
                </button>
              </div>
              <p className="microcopy">
                Up to 4 localities. Change your area in the estimator to compare
                the same size.
              </p>
              <button
                className="button outline full"
                onClick={() => setTab("estimate")}
              >
                Adjust apartment area <ArrowRight size={16} />
              </button>
            </aside>
          </div>
          <div className="method-note">
            <Info size={17} />
            <p>
              Q2 2026 market snapshot. Multistorey apartments only. These ranges
              are not confidence intervals, and they do not capture individual
              property condition.{" "}
              <button onClick={() => setSourceOpen(true)}>
                Read source notes
              </button>
            </p>
          </div>
        </TabsContent>

        <TabsContent value="method" className="view-content">
          <div className="page-intro">
            <div>
              <div className="eyebrow">THE METHOD / NO HIDDEN NUMBERS</div>
              <h1>
                Know what <span>the estimate knows.</span>
              </h1>
              <p>
                Published rates for benchmarks. A separate model for your ML
                demonstration.
              </p>
            </div>
            <a
              href="/downloads/python-training-project.zip"
              download
              className="button outline"
            >
              <ArrowDownToLine size={17} />
              Python training project
            </a>
          </div>
          <div className="method-grid">
            <section className="method-card">
              <div className="method-icon">
                <Calculator size={24} />
              </div>
              <span className="eyebrow">PUBLISHED-RATE BENCHMARK</span>
              <h2>A calculation you can follow.</h2>
              <div className="formula">
                <strong>Area</strong>
                <span>×</span>
                <strong>Locality rate</strong>
                <span>=</span>
                <strong>Benchmark</strong>
              </div>
              <p>
                Rates are transcribed from the publisher’s multistorey-apartment
                section. No assumed age, bedroom or furnishing premiums are
                added to this calculation.
              </p>
              <ul className="check-list">
                <li>
                  <Check size={16} />
                  17 named Chennai localities
                </li>
                <li>
                  <Check size={16} />
                  Low, average and high rates retained
                </li>
                <li>
                  <Check size={16} />
                  Reporting period and source linked
                </li>
              </ul>
              <button
                className="text-button"
                onClick={() => setSourceOpen(true)}
              >
                Inspect sources <ArrowUpRight size={16} />
              </button>
            </section>
            <section className="model-winner">
              <div className="winner-top">
                <FlaskConical size={24} />
                <span className="pill amber">SYNTHETIC DATA</span>
              </div>
              <span className="eyebrow">SELECTED REGRESSION MODEL</span>
              <h2>
                Gradient
                <br />
                Boosting<span>.</span>
              </h2>
              <p>
                Lowest development cross-validation error among five candidates.
                The held-out test set was not used to pick the winner.
              </p>
              <button
                className="button lime"
                onClick={() => {
                  setMode("demo");
                  setTab("estimate");
                }}
              >
                Try the working model <ArrowRight size={17} />
              </button>
            </section>
          </div>
          <section className="model-evaluation">
            <SectionTitle
              number="01"
              title="Measured performance"
              caption="2,400 synthetic properties. These results do not establish Chennai market accuracy."
            />
            <div className="metric-grid">
              <div>
                <span>Test R²</span>
                <strong>{meta.metrics.R2.toFixed(3)}</strong>
                <small>Not an accuracy percentage</small>
              </div>
              <div>
                <span>Test average error</span>
                <strong>{compact(meta.metrics.MAE_INR)}</strong>
                <small>Mean absolute error · INR</small>
              </div>
              <div>
                <span>Test percentage error</span>
                <strong>{meta.metrics.MAPE_percent.toFixed(2)}%</strong>
                <small>Mean absolute percentage error</small>
              </div>
              <div>
                <span>90% interval coverage</span>
                <strong>
                  {meta.metrics.interval_coverage_percent.toFixed(2)}%
                </strong>
                <small>Observed on synthetic test data</small>
              </div>
            </div>
            <div className="comparison-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate model</TableHead>
                    <TableHead>Cross-validation MAE</TableHead>
                    <TableHead>Selection</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meta.comparison.map((m, i) => (
                    <TableRow key={m.model}>
                      <TableCell>
                        <span className="rank">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {m.model}
                      </TableCell>
                      <TableCell>₹{inr(m.cv_mae_inr)}</TableCell>
                      <TableCell>
                        {i === 0 ? (
                          <span className="selected-pill">
                            <CheckCheck size={14} />
                            Selected
                          </span>
                        ) : (
                          <span className="muted">Compared</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="download-row">
              <a href="/downloads/model-comparison.csv" download>
                <ArrowDownToLine size={15} />
                Model comparison
              </a>
              <a href="/downloads/test-predictions.csv" download>
                <ArrowDownToLine size={15} />
                Held-out predictions
              </a>
            </div>
          </section>
          <section className="data-readiness">
            <div>
              <SectionTitle
                number="02"
                title="What makes this ready for real predictions?"
              />
              <p>
                Verified property-level observations of the same area and price
                basis, followed by validation on later sales. The supplied
                project does not contain that dataset yet.
              </p>
              <p className="microcopy">
                The included model runs the actual trained decision trees. Its
                age, furnishing and parking relationships come from generated
                data, not proven market adjustments.
              </p>
            </div>
            <div>
              <a
                className="button outline full"
                href="/downloads/real-properties-template.csv"
                download
              >
                <ArrowDownToLine size={17} />
                Real-data template
              </a>
              <a
                className="text-button"
                href="/downloads/python-training-project.zip"
                download
              >
                Data guide & retraining instructions <ArrowRight size={16} />
              </a>
            </div>
          </section>
        </TabsContent>
      </main>
      <footer className="site-footer">
        <div>
          <span className="footer-brand">squarewise.</span>
          <span>Chennai apartment estimation project</span>
        </div>
        <button onClick={() => setSourceOpen(true)}>
          Sources & limitations <ArrowUpRight size={14} />
        </button>
      </footer>
      <Dialog open={sourceOpen} onOpenChange={setSourceOpen}>
        <DialogContent className="source-dialog">
          <DialogHeader>
            <DialogTitle>Where the numbers come from</DialogTitle>
            <DialogDescription>
              Published benchmarks with an explicit scope.
            </DialogDescription>
          </DialogHeader>
          <div className="source-detail">
            <div>
              <span>Selected locality</span>
              <strong>{locality}</strong>
            </div>
            <div>
              <span>Property type</span>
              <strong>Multistorey apartment</strong>
            </div>
            <div>
              <span>Reporting period</span>
              <strong>Q2 2026 · Apr–Jun</strong>
            </div>
            <div>
              <span>Publisher update</span>
              <strong>July 2026</strong>
            </div>
            <div>
              <span>Catalogue checked</span>
              <strong>12 September 2026</strong>
            </div>
            <div>
              <span>Published average</span>
              <strong>₹{inr(selected.average)} / sq ft</strong>
            </div>
          </div>
          <a
            className="button primary full"
            href={selected.source}
            target="_blank"
            rel="noreferrer"
          >
            Open Magicbricks source <ExternalLink size={16} />
          </a>
          <div className="dialog-notes">
            <p>
              <strong>Area basis matters.</strong> The publisher does not
              specify carpet versus built-up methodology. Use comparable listed
              area; no universal area conversion is assumed.
            </p>
            <p>
              <strong>Ranges are context.</strong> Published low/high rates
              multiplied by area are not statistical confidence intervals. The
              ML interval is separately calibrated on synthetic data.
            </p>
            <p>
              <strong>Property-specific prices vary.</strong> These figures are
              not live quotes, registered sale prices, or professional
              appraisals. Taxes, registration, interiors and other charges are
              excluded. Plots, independent houses and construction costs are not
              covered.
            </p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="report-dialog">
          <DialogHeader>
            <DialogTitle>Your apartment estimate</DialogTitle>
            <DialogDescription>
              {locality}, Chennai · {sqft ? inr(sqft) : "—"} sq ft
            </DialogDescription>
          </DialogHeader>
          {report && visibleEstimate && (
            <>
              <div className="report-total">
                <span>{report.method}</span>
                <strong>{compact(visibleEstimate.price)}</strong>
                <small>₹{inr(visibleEstimate.price)}</small>
              </div>
              <div className="source-detail">
                <div>
                  <span>Rate used</span>
                  <strong>₹{inr(visibleEstimate.rate)} / sq ft</strong>
                </div>
                <div>
                  <span>Rate period</span>
                  <strong>
                    {mode === "quote"
                      ? "User-supplied quote"
                      : mode === "demo"
                        ? "Synthetic training data"
                        : selected.period}
                  </strong>
                </div>
                <div>
                  <span>Context range</span>
                  <strong>
                    {compact(visibleEstimate.low)} –{" "}
                    {compact(visibleEstimate.high)}
                  </strong>
                </div>
              </div>
              <p className="microcopy">
                {report.limitations} {report.exclusions}
              </p>
              <Download value={report} name="squarewise-estimate.json" />
            </>
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
