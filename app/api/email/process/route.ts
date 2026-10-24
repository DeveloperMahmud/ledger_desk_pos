import {processEmailOutbox} from "@/lib/email/process-outbox";

export const runtime="nodejs";

export async function POST(request:Request){const secret=process.env.EMAIL_WORKER_SECRET;if(!secret)return Response.json({error:"Email worker is not configured"},{status:503});if(request.headers.get("authorization")!==`Bearer ${secret}`)return Response.json({error:"Unauthorized"},{status:401});try{const body=await request.json().catch(()=>({}));const results=await processEmailOutbox(typeof body.limit==="number"?body.limit:10);return Response.json({processed:results.length,results});}catch(error){return Response.json({error:error instanceof Error?error.message:"Email processing failed"},{status:500});}}
