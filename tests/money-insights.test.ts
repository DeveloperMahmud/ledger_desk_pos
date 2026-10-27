import {describe,expect,it} from "vitest";
import {buildCashFlowSeries,categoryTotals,percentageChange,transactionsInRange} from "@/lib/money/insights";
import type {TrackerAccount,TrackerCategory,TrackerTransaction} from "@/lib/money/types";

const account:TrackerAccount={id:"cash",bookId:"book",name:"Cash",type:"cash",currency:"BDT",openingBalance:1000,balance:0,color:"#123456",includeInTotal:true,active:true};
const categories:TrackerCategory[]=[{id:"sales",bookId:"book",type:"income",name:"Sales",color:"#16a34a",active:true},{id:"food",bookId:"book",type:"expense",name:"Food",color:"#ef4444",active:true}];
const rows:TrackerTransaction[]=[
  {id:"old",bookId:"book",accountId:"cash",categoryId:"sales",type:"income",amount:100,currency:"BDT",occurredAt:"2026-09-01T10:00:00Z",status:"cleared",tags:[],source:"manual"},
  {id:"income",bookId:"book",accountId:"cash",categoryId:"sales",type:"income",amount:500,currency:"BDT",occurredAt:"2026-10-26T10:00:00Z",status:"cleared",tags:[],source:"manual"},
  {id:"expense",bookId:"book",accountId:"cash",categoryId:"food",type:"expense",amount:200,currency:"BDT",occurredAt:"2026-10-27T10:00:00Z",status:"cleared",tags:[],source:"manual"},
  {id:"transfer",bookId:"book",accountId:"cash",type:"transfer",transferDirection:"out",amount:50,currency:"BDT",occurredAt:"2026-10-27T12:00:00Z",status:"cleared",tags:[],source:"manual"},
];

describe("money insights",()=>{
  it("filters rolling ranges without leaking older transactions",()=>{expect(transactionsInRange(rows,"7d",new Date("2026-10-27T18:00:00+06:00")).map(row=>row.id)).toEqual(["income","expense","transfer"]);});
  it("excludes transfers from category totals",()=>{expect(categoryTotals(rows,categories,"expense")).toEqual([{id:"food",name:"Food",color:"#ef4444",total:200,percent:100}]);});
  it("builds balances while retaining transfer movement",()=>{const series=buildCashFlowSeries(rows,[account],"7d",new Date("2026-10-27T18:00:00+06:00"));expect(series.at(-1)).toMatchObject({income:0,expense:200,cashFlow:-200,balance:1350});});
  it("reports comparison change and new-period state",()=>{expect(percentageChange(150,100)).toBe(50);expect(percentageChange(25,0)).toBeNull();});
});
