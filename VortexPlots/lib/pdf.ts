import PDFDocument from 'pdfkit';
import fontData from './pdf-font.json' with {type:'json'};
import boundaries from '../data/map-boundaries.json' with {type:'json'};
export type ReportSnapshot={id:string;createdAt:string;title:string;mapDistrict?:string;sections:{title:string;lines:string[]}[]};
export async function pdf(snapshot:ReportSnapshot):Promise<Buffer>{
 const doc=new PDFDocument({size:'A4',margin:48,bufferPages:true,font:Buffer.from(fontData,'base64') as unknown as string});
 const chunks:Buffer[]=[];doc.on('data',c=>chunks.push(c));const complete=new Promise<Buffer>((res,rej)=>{doc.on('end',()=>res(Buffer.concat(chunks)));doc.on('error',rej)});
 doc.rect(0,0,595,118).fill('#10243a');doc.fillColor('#7fddd0').fontSize(12).text('VORTEXPLOTS',48,30);doc.fillColor('#ffffff').fontSize(21).text(snapshot.title,48,54,{width:490});doc.fillColor('#495d70').fontSize(9).text(`Report ${snapshot.id}\nGenerated ${snapshot.createdAt}`,48,138,{width:490});
 doc.moveDown(1.8);for(const section of snapshot.sections){if(doc.y>690)doc.addPage();doc.fillColor('#096d64').fontSize(13).text(section.title);doc.moveDown(.5);for(const line of section.lines){if(doc.y+doc.heightOfString(line,{width:490})>735)doc.addPage();doc.fillColor('#21384a').fontSize(10).text(line,{width:490,lineGap:4});doc.moveDown(.55)}doc.moveDown(.7)}
 if(snapshot.mapDistrict){
 doc.addPage();doc.fillColor('#173b3d').fontSize(20).text('District map context',48,45);doc.fontSize(12).text(snapshot.mapDistrict,48,78);doc.fontSize(9).fillColor('#5d6e7d').text('District highlighted. Precise locality coordinates are not verified.',48,101,{width:490});
 const boundary=boundaries;
 for(const f of boundary.features){const polys:number[][][][]=f.geometry.type==='Polygon'?[f.geometry.coordinates as number[][][]]:f.geometry.coordinates as number[][][][];for(const poly of polys){for(const ring of poly){let route='';for(let i=0;i<ring.length;i++){const [lon,lat]=ring[i];const x=58+(lon-76)*92,y=665-(lat-8)*92;route+=(i?'L':'M')+x.toFixed(2)+','+y.toFixed(2);}doc.path(route+'Z').lineWidth(.4).fillAndStroke(f.properties.name===snapshot.mapDistrict?'#a9d970':'#dbe9e5','#40685f');}}}
 doc.fontSize(9).fillColor('#526968').text('Boundary source: datta07 / Indian Shapefiles (MIT). Mixed vintages through 2022; simplified for display. Not a certified cadastral map. No verified-price heatmap is available.',48,709,{width:490});
 }
 const range=doc.bufferedPageRange();for(let i=0;i<range.count;i++){doc.switchToPage(i);doc.page.margins.bottom=0;doc.fontSize(8).fillColor('#5d6e7d').text(`VortexPlots • ${i+1} / ${range.count}`,48,785,{width:490,lineBreak:false});}doc.end();return complete;
}
