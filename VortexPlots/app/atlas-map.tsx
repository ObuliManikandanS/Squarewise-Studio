'use client';
import {useEffect,useRef,useState} from 'react';
import type {Map as LeafletMap,GeoJSON as GeoLayer,Path} from 'leaflet';
import {districts,money} from './data';
import {districtPriceGroups} from '../lib/district-prices';
import {RotateCcw,Maximize2} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './map-prices.css';
const aliases:Record<string,string>={Kanchipuram:'Kancheepuram',Thiruvallur:'Tiruvallur',Thiruvarur:'Tiruvarur',Tuticorin:'Thoothukudi',Villupuram:'Viluppuram'};
const categoryNames={asking:'Screened asking samples · not sale-verified',transaction:'Verified transaction observations',guideline:'Official guideline observations'};
type Filters={propertyType:string;basis:string;category:string};
function matching(id:string,filters:Filters){return districtPriceGroups(id).filter(g=>g.propertyType===filters.propertyType&&g.basis===filters.basis&&g.category===filters.category)}
function tooltip(name:string,id:string,filters:Filters){
 const box=document.createElement('div');box.className='district-price-content';
 const add=(tag:string,text:string)=>{const el=document.createElement(tag);el.textContent=text;box.appendChild(el)};
 add('strong',name);const group=matching(id,filters)[0];
 add('p',`Minimum: ${money(group?.min??null)} / sq ft`);add('p',`Average: ${money(group?.average??null)} / sq ft`);add('p',`Maximum: ${money(group?.max??null)} / sq ft`);return box;
}
export function AtlasMap({districtId,onSelect}:{districtId:string;onSelect:(id:string)=>void}){
 const container=useRef<HTMLDivElement>(null),map=useRef<LeafletMap|null>(null),geo=useRef<GeoLayer|null>(null),handler=useRef(onSelect),selected=useRef(districtId);
 const [filters,setFilters]=useState<Filters>({propertyType:'Land',basis:'Plot area',category:'asking'}),activeFilters=useRef(filters);activeFilters.current=filters;
 const [error,setError]=useState(''),[loaded,setLoaded]=useState(false),[retry,setRetry]=useState(0);
 handler.current=onSelect;selected.current=districtId;
 useEffect(()=>{let cancelled=false;const abort=new AbortController();(async()=>{try{
  const L=await import('leaflet');const res=await fetch('/maps/tamil-nadu.geojson',{signal:abort.signal});if(!res.ok)throw Error('District boundaries could not load.');const data=await res.json() as GeoJSON.GeoJsonObject;if(cancelled||!container.current)return;
  const m=L.map(container.current,{scrollWheelZoom:false}).setView([10.9,78.5],6);map.current=m;
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(m).on('tileerror',()=>{if(!cancelled)setError('Base map unavailable. District boundaries remain usable.')});
  const g=L.geoJSON(data,{style:f=>{const d=districts.find(d=>d.name===(aliases[f?.properties.name]||f?.properties.name));return {color:'#f9fffb',weight:1.5,fillColor:d?.id===selected.current?'#b8ef71':d&&matching(d.id,activeFilters.current).length?'#388b86':'#8b9ba6',fillOpacity:.7}},onEachFeature:(f,layer)=>{
    const name=aliases[f.properties.name]||f.properties.name,d=districts.find(d=>d.name===name);if(!d)return;
    layer.bindTooltip(()=>tooltip(name,d.id,activeFilters.current),{sticky:true,direction:'auto',className:'district-price-tooltip',opacity:1});
    layer.on('click',()=>{handler.current(d.id);layer.openTooltip()});
    layer.on('mouseover',()=>{(layer as Path).setStyle({weight:3});});
    layer.on('mouseout',()=>{(layer as Path).setStyle({weight:1.5});});
    layer.on('add',()=>{const el=(layer as Path).getElement();if(!el)return;el.setAttribute('tabindex','0');el.setAttribute('role','button');el.setAttribute('aria-label',`Explore ${name} prices`);el.addEventListener('focus',()=>layer.openTooltip());el.addEventListener('blur',()=>layer.closeTooltip());el.addEventListener('keydown',event=>{const e=event as KeyboardEvent;if(e.key==='Enter'||e.key===' '){e.preventDefault();handler.current(d.id);layer.openTooltip()}if(e.key==='Escape')layer.closeTooltip()});});
  }}).addTo(m);geo.current=g;m.fitBounds(g.getBounds(),{padding:[14,14]});setLoaded(true);
 }catch{if(!cancelled)setError('District map could not load. Use the district selector or try again.')}})();return()=>{cancelled=true;abort.abort();map.current?.remove();map.current=null;geo.current=null}},[retry]);
 useEffect(()=>{geo.current?.setStyle(f=>{const d=districts.find(d=>d.name===(aliases[f?.properties.name]||f?.properties.name));return {fillColor:d?.id===districtId?'#b8ef71':d&&districtPriceGroups(d.id).length?'#388b86':'#8b9ba6'}})},[districtId,loaded,filters]);
 function zoom(){geo.current?.eachLayer(l=>{const feature=(l as unknown as {feature:{properties:{name:string}}}).feature;const d=districts.find(d=>d.name===(aliases[feature.properties.name]||feature.properties.name));if(d?.id===districtId)map.current?.fitBounds((l as GeoLayer).getBounds(),{padding:[24,24],maxZoom:10})})}
 const current=districts.find(d=>d.id===districtId),groups=matching(districtId,filters);
 return <><div className="map-filters form-grid"><label className="field">Map property / area basis<select value={filters.propertyType+'|'+filters.basis} onChange={e=>{const [propertyType,basis]=e.target.value.split('|');setFilters(f=>({...f,propertyType,basis}))}}>{[...new Set(districts.flatMap(d=>districtPriceGroups(d.id).map(g=>g.propertyType+'|'+g.basis)))].map(key=><option key={key} value={key}>{key.replace('|',' · ')}</option>)}</select></label><label className="field">Price source category<select value={filters.category} onChange={e=>setFilters(f=>({...f,category:e.target.value}))}><option value="asking">Advertised asking prices</option><option value="transaction">Verified transactions</option><option value="guideline">Official guideline values</option></select></label></div><div className="atlas-canvas"><div ref={container} className="leaflet-host" aria-label="Interactive Tamil Nadu district price map"/>{!loaded&&!error&&<div className="map-loading">Loading district boundaries…</div>}<div className="map-controls"><button className="btn outline small" onClick={zoom} disabled={!loaded}><Maximize2 size={15}/>Zoom to district</button><button aria-label="Reset map" className="btn outline small" onClick={()=>{if(geo.current)map.current?.fitBounds(geo.current.getBounds())}}><RotateCcw size={15}/></button></div><div className="map-legend">Grey: data unavailable · Teal: source evidence · Green: selected</div></div>
 <section className="district-price-card" aria-live="polite"><div className="section-title"><h3>{current?.name} · price range</h3></div><label className="field">Explore a district<select value={districtId} onChange={e=>onSelect(e.target.value)}>{districts.map(d=><option value={d.id} key={d.id}>{d.name}</option>)}</select></label><p>Hover, focus or tap a district to inspect its minimum, average and maximum rates for the selected property type and area basis.</p>{groups.length?groups.map(g=><article key={g.category+g.propertyType+g.basis}><h4>{g.propertyType} · {g.basis}</h4><strong>Min {money(g.min)} — Max {money(g.max)} / sq ft</strong><p>Sample average: {money(g.average)} · Representative: {money(g.representative)} / sq ft</p><p>{categoryNames[g.category]} · {g.count} records · latest source/collection date {g.updated}</p><p>Sample locations: {g.places.join(', ')}</p><p>Observed sample range; not a district-wide valuation. Low confidence.</p><details><summary>View sources and methodology</summary><p>Screened uploaded advertisements and previously source-checked offers are included. Collection date is used when the effective date is unavailable. Property types, price categories and area bases are kept separate. A single record produces equal minimum and maximum values.</p>{g.sources.map(s=><p key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.name} ↗</a></p>)}</details></article>):<><strong>Minimum: Unavailable · Maximum: Unavailable</strong><p>Verified price data is currently unavailable for this district, property type and area basis. Select another category or inspect the district reference data.</p></>}</section>
 {error&&<div role="status" className="notice">{error} {!loaded&&<button onClick={()=>{setError('');setRetry(n=>n+1)}}>Retry map</button>}</div>}<p className="map-attribution">Boundary source: <a href="https://github.com/datta07/INDIAN-SHAPEFILES" target="_blank" rel="noreferrer">Indian Shapefiles (MIT)</a>. Reference boundaries, mixed vintages through 2022; not a cadastral survey.</p></>;
}
