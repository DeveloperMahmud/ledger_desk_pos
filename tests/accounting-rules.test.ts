import {describe,expect,it} from "vitest";
import {accountBalance,balanceSheet,isBalanced,profitAndLoss,trialBalance} from "@/lib/accounting/rules";
import {journalEntries,ledgerAccounts} from "@/lib/accounting/demo-data";

describe("accounting rules",()=>{
 it("requires equal debits and credits",()=>expect(journalEntries.every(isBalanced)).toBe(true));
 it("calculates natural account balances",()=>{expect(accountBalance(ledgerAccounts.find(a=>a.id==="1100")!,journalEntries)).toBe(71500);expect(accountBalance(ledgerAccounts.find(a=>a.id==="4100")!,journalEntries)).toBe(78000);});
 it("produces a balanced trial balance",()=>{const rows=trialBalance(ledgerAccounts,journalEntries);expect(rows.reduce((s,r)=>s+r.debit,0)).toBe(rows.reduce((s,r)=>s+r.credit,0));});
 it("calculates profit and loss",()=>expect(profitAndLoss(ledgerAccounts,journalEntries)).toEqual({income:78000,expenses:6500,profit:71500}));
 it("builds balance sheet totals",()=>expect(balanceSheet(ledgerAccounts,journalEntries).assets).toBe(71500));
});
