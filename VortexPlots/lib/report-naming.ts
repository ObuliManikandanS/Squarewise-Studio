export const sectionTitles={Estimator:'Estimator',PriceIntelligence:'Price Intelligence',LocationAtlas:'Location Atlas',MyPortfolio:'My Portfolio',Overview:'Overview',Reviews:'Reviews',AreaEfficiency:'Area & Efficiency'};
export type ReportSection=keyof typeof sectionTitles;
export function reportFilename(section:ReportSection,district?:string,locality?:string,date=new Date().toISOString()){
 const safe=(text:string)=>text.normalize('NFKD').replace(/[^a-zA-Z0-9 -]/g,'').trim().replace(/[ -]+/g,'_').slice(0,80);
 const day=date.slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day)))throw Error('Invalid report date');
 return ['VortexPlots',section,district&&safe(district),locality&&safe(locality),day].filter(Boolean).join('_')+'.pdf';
}
