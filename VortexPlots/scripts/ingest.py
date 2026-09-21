"""Validate licensed observations; atomic replacement only if the entire batch passes.
Usage: python scripts/ingest.py input.csv --approve
Without --approve creates a validation report and leaves production unchanged.
"""
import argparse,csv,datetime,hashlib,json,pathlib,shutil,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
def ingest(source,approve=False):
 (ROOT/'data/raw').mkdir(exist_ok=True);(ROOT/'data/versions').mkdir(exist_ok=True)
 raw=source.read_bytes();digest=hashlib.sha256(raw).hexdigest();rawpath=ROOT/'data/raw'/f'{digest}.csv';rawpath.write_bytes(raw)
 districts=json.loads((ROOT/'data/locations.json').read_text());import re
 ids={d['id']+'--'+re.sub('[^a-z0-9]+','-',l.lower()) for d in districts for l in d['localities']}
 rows=[];errors=[];seen=set();today=datetime.date.today();duplicates=0
 for n,r in enumerate(csv.DictReader(raw.decode('utf-8-sig').splitlines()),2):
  try:
   assert r['localityId'] in ids,'Unknown locality ID'
   assert r['propertyType'] in ['Land','Apartment','Independent house','Villa','Commercial'],'Property type'
   assert r['basis']==('Plot area' if r['propertyType']=='Land' else 'Built-up area'),'Area basis'
   assert r['category'] in ['asking','guideline','transaction'],'Price category'
   assert r['currency']=='INR','Currency must be INR'
   assert r['rateUnit'] in ['sq ft','sq m'],'Rate unit'
   rate=float(r['rate'])/(10.76391041671 if r['rateUnit']=='sq m' else 1)
   assert 0<rate<=1000000,'Invalid/anomalous rate'
   observed=datetime.date.fromisoformat(r['effectiveDate']);collected=datetime.date.fromisoformat(r['collectedDate'])
   assert observed<=collected<=today,'Future/inconsistent dates'
   assert (today-observed).days<=365,'Stale observation'
   assert r['sourceUrl'].startswith('https://') and r['sourceName'].strip(),'Missing source'
   assert r['reuseApproval'].strip() and r['verifiedBy'].strip(),'Document permission and reviewer'
   assert int(r['sampleSize'])>=1,'Sample size must be known'
   assert r['propertyId'].strip(),'Stable source property ID required'
   identity=(r['sourceUrl'],r['propertyId'],r['effectiveDate'],r['category'])
   if identity in seen:duplicates+=1;continue
   seen.add(identity)
   rows.append(dict(id=hashlib.sha256('|'.join(identity).encode()).hexdigest()[:24],localityId=r['localityId'],propertyType=r['propertyType'],basis=r['basis'],category=r['category'],rate=rate,effectiveDate=r['effectiveDate'],collectedDate=r['collectedDate'],sourceUrl=r['sourceUrl'],sourceName=r['sourceName'],sampleSize=int(r['sampleSize']),verified=True,reuseApproved=True))
  except (AssertionError,KeyError,ValueError) as e:errors.append({'row':n,'reason':str(e)})
 report={'inputHash':digest,'validRows':len(rows),'duplicates':duplicates,'errors':errors,'approved':approve}
 (ROOT/'data/versions'/f'{digest}-audit.json').write_text(json.dumps(report,indent=2))
 if errors or not rows:raise ValueError('Validation failed or empty batch; last valid dataset preserved')
 if approve:
  out=ROOT/'data/observations.json';shutil.copy2(out,ROOT/'data/versions'/f'before-{digest}.json');tmp=out.with_suffix('.tmp');tmp.write_text(json.dumps(rows,indent=2));tmp.replace(out)
 return report
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('csv',type=pathlib.Path);p.add_argument('--approve',action='store_true');a=p.parse_args()
 try:print(json.dumps(ingest(a.csv,a.approve),indent=2))
 except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)
