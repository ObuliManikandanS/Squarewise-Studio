import {usablePrices,type PriceRecord} from './price-summary.ts';
export type PriceFilters={propertyType:string;basis:string;category:string;days?:number;checkedOnly?:boolean};
/** Shared observation population for maps, tables and comparisons. */
export function filterPrices<T extends PriceRecord>(rows:T[],filters:PriceFilters,now=Date.now()):T[]{
 return usablePrices(rows,now).filter(row=>
  (filters.propertyType==='All'||row.propertyType===filters.propertyType)&&
  (filters.basis==='All'||row.basis===filters.basis)&&row.category===filters.category&&
  (!filters.checkedOnly||row.verified&&row.reuseApproved)&&
  now-Date.parse(row.effectiveDate||row.collectedDate)<(filters.days??365)*86400000
 );
}
