import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  MapPin,
  ChartNoAxesCombined,
  ShieldCheck,
  Ruler,
  FlaskConical,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rates, compact, inr, benchmark } from "@/lib/pricing";
import meta from "@/lib/data/model-meta.json";
type Props = {
  locality: string;
  area: number;
  onLocality: (v: string) => void;
  onArea: (v: number) => void;
  onNavigate: (v: string) => void;
};
export default function Dashboard({
  locality,
  area,
  onLocality,
  onArea,
  onNavigate,
}: Props) {
  const [budget, setBudget] = useState(150);
  const selected = rates.find((r) => r.name === locality)!;
  const result = benchmark({ locality, area, unit: "sqft" });
  const ranked = [...rates].sort((a, b) => a.average - b.average);
  const within = ranked.filter((r) => r.average * area <= budget * 100000);
  const points = [500, 1000, 1500, 2000, 2500, 3000];
  const x = (a: number) => 45 + ((a - 500) / 2500) * 590;
  const y = (p: number) => 182 - (p / (3000 * selected.high)) * 150;
  const poly = (rate: number) =>
    points.map((a) => `${x(a)},${y(a * rate)}`).join(" ");
  const leaders = [...rates].sort((a, b) => b.average - a.average).slice(0, 6);
  return (
    <div className="dashboard-page">
      <div className="dash-intro">
        <div>
          <div className="eyebrow">YOUR PROPERTY WORKSPACE</div>
          <h1>
            A clearer view of <span>Chennai homes.</span>
          </h1>
          <p>
            Explore the numbers. Compare your options. Build an informed
            estimate.
          </p>
        </div>
        <span className="dashboard-period">
          <ShieldCheck size={16} />
          Q2 2026 · Published snapshot
        </span>
      </div>
      <div className="dash-overview">
        <section className="dash-start">
          <div>
            <span className="glass-pill">
              <Building2 size={15} /> CHENNAI APARTMENTS
            </span>
            <h2>
              Start with the right
              <br />
              square-foot rate.
            </h2>
            <p>
              Your locality and area set the benchmark. Every number stays
              traceable.
            </p>
            <button
              className="button white"
              onClick={() => onNavigate("estimate")}
            >
              Open full estimator <ArrowRight size={17} />
            </button>
          </div>
          <img
            src="/apartment.png"
            alt="Illustrative modern Chennai-style apartment architecture"
          />
          <small>Illustrative image</small>
        </section>
        <section className="dash-quick">
          <div className="panel-heading">
            <h2>Quick estimate</h2>
            <Ruler size={19} />
          </div>
          <Select value={locality} onValueChange={onLocality}>
            <SelectTrigger aria-label="Quick estimate locality">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rates.map((r) => (
                <SelectItem value={r.name} key={r.name}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="quick-area">
            <span>Listed area</span>
            <strong>
              {inr(area)} <small>sq ft</small>
            </strong>
          </div>
          <Slider
            aria-label="Quick estimate area in square feet"
            min={300}
            max={5000}
            step={50}
            value={[area]}
            onValueChange={(v) => onArea(v[0])}
          />
          <div className="quick-result">
            <div>
              <small>Area × ₹{inr(selected.average)}/sq ft</small>
              <strong>{compact(result.price)}</strong>
            </div>
            <button
              aria-label="Open this estimate"
              onClick={() => onNavigate("estimate")}
            >
              <ArrowUpRight size={22} />
            </button>
          </div>
          <p className="microcopy">
            Benchmark only. Match the listed area basis before using the
            estimate.
          </p>
        </section>
      </div>
      <div className="dashboard-metrics">
        <div>
          <span className="stat-icon purple">
            <MapPin size={22} />
          </span>
          <div>
            <span>Sourced localities</span>
            <strong>
              {rates.length}
              <small> across Chennai</small>
            </strong>
          </div>
          <button
            aria-label="Explore localities"
            onClick={() => onNavigate("explore")}
          >
            <ArrowUpRight size={16} />
          </button>
        </div>
        <div>
          <span className="stat-icon cyan">
            <ChartNoAxesCombined size={22} />
          </span>
          <div>
            <span>{locality} average rate</span>
            <strong>
              ₹{inr(selected.average)}
              <small> / sq ft</small>
            </strong>
          </div>
          <button
            aria-label="See rate sources"
            onClick={() => onNavigate("method")}
          >
            <ArrowUpRight size={16} />
          </button>
        </div>
        <div>
          <span className="stat-icon pink">
            <FlaskConical size={22} />
          </span>
          <div>
            <span>ML demonstration</span>
            <strong>
              5 <small>models compared</small>
            </strong>
            <p>Synthetic data · {meta.best_model} selected</p>
          </div>
        </div>
      </div>
      <div className="dashboard-lower">
        <section className="chart-panel">
          <div className="panel-heading">
            <div>
              <h2>What changes with area?</h2>
              <p>
                {locality} · ₹{inr(selected.average)} / sq ft average
              </p>
            </div>
            <span className="chart-key">
              <i />
              Published average
            </span>
          </div>
          <div className="price-sensitivity">
            <svg
              viewBox="0 0 680 225"
              role="img"
              aria-label={`Area sensitivity for ${locality}: each extra square foot adds ${selected.average} rupees to the average benchmark. Shaded band shows low to high published rates.`}
            >
              <defs>
                <linearGradient id="band" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#7b65d8" stopOpacity=".23" />
                  <stop offset="100%" stopColor="#4793d8" stopOpacity=".03" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                  <line
                    x1="45"
                    x2="638"
                    y1={32 + i * 50}
                    y2={32 + i * 50}
                    stroke="#e9ebf3"
                    strokeDasharray="4 5"
                  />
                  <text x="42" y={28 + i * 50} fill="#91a0b5" fontSize="11">
                    {compact((3 - i) * 1000 * selected.high)}
                  </text>
                </g>
              ))}
              <polygon
                points={`${poly(selected.high)} ${[...points]
                  .reverse()
                  .map((a) => `${x(a)},${y(a * selected.low)}`)
                  .join(" ")}`}
                fill="url(#band)"
              />
              <polyline
                points={poly(selected.average)}
                fill="none"
                stroke="#7663d6"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {points.map((a) => (
                <g key={a}>
                  <circle
                    cx={x(a)}
                    cy={y(a * selected.average)}
                    r="4"
                    fill="white"
                    stroke="#7663d6"
                    strokeWidth="2"
                  >
                    <title>
                      {a} sq ft: {compact(a * selected.average)}
                    </title>
                  </circle>
                  <text
                    x={x(a)}
                    y="213"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#7a879e"
                  >
                    {inr(a)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="chart-foot">
            <span>Apartment area · sq ft</span>
            <span>Shaded band = published low–high range</span>
          </div>
          <p className="microcopy">
            An area-based calculation, not a price trend or a future forecast.
          </p>
        </section>
        <section className="budget-panel">
          <div className="panel-heading">
            <div>
              <h2>Find your budget fit</h2>
              <p>At {inr(area)} sq ft · published averages</p>
            </div>
          </div>
          <div className="budget-number">
            <span>Budget ceiling</span>
            <strong>{compact(budget * 100000)}</strong>
          </div>
          <Slider
            aria-label="Budget ceiling in lakh rupees"
            value={[budget]}
            min={20}
            max={500}
            step={5}
            onValueChange={(v) => setBudget(v[0])}
          />
          <div className="budget-match">
            <strong>{within.length}</strong>
            <span>
              of {rates.length} localities fall within your benchmark budget
            </span>
          </div>
          <div className="budget-list">
            {within.slice(0, 3).map((r) => (
              <button
                key={r.name}
                onClick={() => {
                  onLocality(r.name);
                  onNavigate("estimate");
                }}
              >
                <span>
                  <MapPin size={14} />
                  {r.name}
                </span>
                <strong>{compact(r.average * area)}</strong>
                <ArrowUpRight size={15} />
              </button>
            ))}
            {!within.length && (
              <p className="microcopy">
                No locality averages fit this area and budget. Increase the
                ceiling or reduce the area.
              </p>
            )}
          </div>
          <p className="microcopy">
            Excludes taxes and extra charges. These are benchmarks, not
            available listings.
          </p>
        </section>
      </div>
      <section className="market-board">
        <div className="panel-heading">
          <div>
            <h2>Across the city</h2>
            <p>Six highest average rates in the current catalogue</p>
          </div>
          <button className="text-button" onClick={() => onNavigate("explore")}>
            Compare all localities <ArrowRight size={15} />
          </button>
        </div>
        <div className="market-bars">
          {leaders.map((r, i) => (
            <button
              key={r.name}
              className="market-bar"
              onClick={() => {
                onLocality(r.name);
                onNavigate("estimate");
              }}
            >
              <span className="market-rank">0{i + 1}</span>
              <div>
                <span>{r.name}</span>
                <div className="market-track">
                  <i
                    style={{
                      width: `${(r.average / leaders[0].average) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <strong>
                ₹{inr(r.average)}
                <small>/sq ft</small>
              </strong>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
