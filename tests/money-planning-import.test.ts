import {describe,expect,it} from "vitest";
import {defaultImportMapping,mapAndValidateImportRows} from "@/lib/money/importing";
import {budgetProgress,isRecurringDue} from "@/lib/money/rules";

describe("money planning and import",()=>{
 it("reports exceeded and predicted budget states",()=>{expect(budgetProgress(1000,1200,.5).status).toBe("exceeded");expect(budgetProgress(1000,600,.5).status).toBe("at_risk");expect(budgetProgress(1000,300,.5).remaining).toBe(700);});
 it("detects due recurring records",()=>{expect(isRecurringDue("2026-10-01","2026-10-27")).toBe(true);expect(isRecurringDue("2026-11-01","2026-10-27")).toBe(false);});
 it("maps valid import columns and reports bad rows",()=>{const result=mapAndValidateImportRows([{date:"2026-10-27",type:"expense",account:"Cash",category:"Food",amount:"125",currency:"BDT",status:"cleared",payee:"Cafe",reference:"",note:"",tags:"food"},{date:"bad",type:"other",account:"",category:"",amount:"zero",currency:"",status:"wrong",payee:"",reference:"",note:"",tags:""}],defaultImportMapping);expect(result[0].valid).toBe(true);expect(result[1].valid).toBe(false);expect(result[1].errors.length).toBeGreaterThan(3);});
});
