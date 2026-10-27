import type {MoneySnapshot} from "./types";

export const demoMoney:MoneySnapshot={
  books:[{id:"book-freelance",name:"Freelancing",type:"freelancing",currency:"BDT",active:true}],
  accounts:[
    {id:"cash",bookId:"book-freelance",name:"Cash",type:"cash",currency:"BDT",openingBalance:12000,balance:18500,color:"#12A06A",includeInTotal:true,active:true},
    {id:"bkash",bookId:"book-freelance",name:"bKash",type:"bkash",currency:"BDT",openingBalance:5000,balance:11200,color:"#D12053",includeInTotal:true,active:true},
    {id:"bank",bookId:"book-freelance",name:"Bank",type:"bank",currency:"BDT",openingBalance:45000,balance:77000,color:"#246BFD",includeInTotal:true,active:true},
  ],
  categories:[
    {id:"client",bookId:"book-freelance",type:"income",name:"Client payment",color:"#12A06A",active:true},
    {id:"tools",bookId:"book-freelance",type:"expense",name:"Software & tools",color:"#EF4444",active:true},
    {id:"office",bookId:"book-freelance",type:"expense",name:"Office",color:"#F59E0B",active:true},
    {id:"marketing",bookId:"book-freelance",type:"expense",name:"Marketing",color:"#8B5CF6",active:true},
    {id:"communication",bookId:"book-freelance",type:"expense",name:"Communication & internet",color:"#06B6D4",active:true},
  ],
  transactions:[
    {id:"t1",bookId:"book-freelance",accountId:"bank",categoryId:"client",type:"income",amount:32000,currency:"BDT",occurredAt:"2026-10-25T10:00:00Z",status:"cleared",payee:"Northstar client",tags:["project"],source:"manual"},
    {id:"t2",bookId:"book-freelance",accountId:"bkash",categoryId:"tools",type:"expense",amount:2800,currency:"BDT",occurredAt:"2026-10-26T12:00:00Z",status:"cleared",payee:"Design tools",tags:["subscription"],source:"manual"},
    {id:"t3",bookId:"book-freelance",accountId:"bank",categoryId:"client",type:"income",amount:18000,currency:"BDT",occurredAt:"2026-10-10T10:00:00Z",status:"cleared",payee:"Website milestone",tags:["project"],source:"manual"},
    {id:"t4",bookId:"book-freelance",accountId:"cash",categoryId:"office",type:"expense",amount:4200,currency:"BDT",occurredAt:"2026-10-20T09:30:00Z",status:"cleared",payee:"Office supplies",tags:["office"],source:"manual"},
    {id:"t5",bookId:"book-freelance",accountId:"bkash",categoryId:"marketing",type:"expense",amount:3500,currency:"BDT",occurredAt:"2026-10-16T14:00:00Z",status:"cleared",payee:"Campaign boost",tags:["marketing"],source:"manual"},
    {id:"t6",bookId:"book-freelance",accountId:"bkash",categoryId:"communication",type:"expense",amount:1200,currency:"BDT",occurredAt:"2026-10-05T08:00:00Z",status:"cleared",payee:"Internet bill",tags:["recurring"],source:"manual"},
  ],
  budgets:[
    {id:"b1",categoryId:"tools",period:"monthly",amount:5000,startsOn:"2026-10-01",active:true},
    {id:"b2",categoryId:"marketing",period:"monthly",amount:6000,startsOn:"2026-10-01",active:true},
  ],
  goals:[{id:"g1",name:"Equipment fund",targetAmount:100000,currentAmount:28000,targetDate:"2027-03-01",color:"#8B5CF6"}],
  recurring:[{id:"r1",bookId:"book-freelance",accountId:"bkash",categoryId:"communication",type:"expense",amount:1200,frequency:"monthly",nextRunOn:"2026-11-01",payee:"Internet",active:true}],
};
