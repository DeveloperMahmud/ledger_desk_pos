import type {ImportMapping,ImportValidation} from "./exchange";

export const defaultImportMapping:ImportMapping={date:"date",type:"type",account:"account",category:"category",amount:"amount",currency:"currency",status:"status",payee:"payee",reference:"reference",note:"note",tags:"tags"};

export function mapAndValidateImportRows(rows:Record<string,string>[],mapping:ImportMapping):ImportValidation[]{
 return rows.map((source,index)=>{
  const value=Object.fromEntries(Object.entries(mapping).map(([target,column])=>[target,source[column]??""]));
  const errors:string[]=[];const type=value.type.toLowerCase();const amount=Number(value.amount);const date=new Date(value.date);
  if(!["income","expense"].includes(type))errors.push("Type must be income or expense");
  if(!value.account.trim())errors.push("Account is required");
  if(!Number.isFinite(amount)||amount===0)errors.push("Amount must be a non-zero number");
  if(Number.isNaN(date.getTime()))errors.push("Date is invalid");
  if(value.status&&!['pending','cleared'].includes(value.status.toLowerCase()))errors.push("Status must be pending or cleared");
  return{row:index+2,valid:errors.length===0,errors,value};
 });
}
