import {describe,expect,it} from "vitest";
import {calculateAccountBalance,moneySummary,signedAmount} from "@/lib/money/rules";
import {parseCsv,transactionsToCsv} from "@/lib/money/exchange";
import type {TrackerAccount,TrackerTransaction} from "@/lib/money/types";
const account:TrackerAccount={id:"cash",bookId:"book",name:"Cash",type:"cash",currency:"BDT",openingBalance:1000,balance:0,color:"#000000",includeInTotal:true,active:true};
const rows:TrackerTransaction[]=[
 {id:"income",bookId:"book",accountId:"cash",categoryId:"sales",type:"income",amount:500,currency:"BDT",occurredAt:"2026-10-01T00:00:00Z",status:"cleared",tags:[],source:"manual"},
 {id:"expense",bookId:"book",accountId:"cash",categoryId:"food",type:"expense",amount:200,currency:"BDT",occurredAt:"2026-10-02T00:00:00Z",status:"cleared",tags:[],source:"manual"},
 {id:"transfer",bookId:"book",accountId:"cash",type:"transfer",transferDirection:"out",transferGroupId:"group",amount:100,currency:"BDT",occurredAt:"2026-10-03T00:00:00Z",status:"cleared",tags:[],source:"manual"},
];
describe("money tracker rules",()=>{it("reproduces account balances from the ledger",()=>{expect(calculateAccountBalance(account,rows)).toBe(1200);});it("does not inflate income or expense with transfers",()=>{expect(moneySummary([account],rows)).toEqual({income:500,expense:200,cashFlow:300,balance:1200});});it("uses signed transfer direction",()=>{expect(signedAmount(rows[2])).toBe(-100);});it("round-trips quoted CSV fields",()=>{const csv=transactionsToCsv([{...rows[0],note:'Client said "thanks", paid'}],()=>"Cash",()=>"Sales");const parsed=parseCsv(csv);expect(parsed[0].note).toBe('Client said "thanks", paid');expect(parsed[0].account).toBe("Cash");});});
