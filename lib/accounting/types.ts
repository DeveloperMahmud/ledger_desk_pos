export type AccountingMode = "basic" | "full";
export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";
export type MoneyAccountKind = "cash" | "bank" | "online_bank";

export interface LedgerAccount { id:string; code:string; name:string; type:AccountType; parentId?:string; system:boolean; }
export interface JournalLine { id:string; accountId:string; accountName:string; debit:number; credit:number; }
export interface JournalEntry { id:string; number:string; date:string; memo:string; sourceType:string; sourceId?:string; status:"draft"|"posted"|"reversed"; lines:JournalLine[]; }
export interface MoneyAccount { id:string; name:string; kind:MoneyAccountKind; balance:number; currency:string; }
export interface BasicTransaction { id:string; date:string; type:"income"|"expense"|"transfer"; category:string; account:string; description:string; amount:number; reference?:string; attachment?:string; }
