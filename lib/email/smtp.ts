import "server-only";
import nodemailer from "nodemailer";

export interface OutboxMessage { id:string; recipient_email:string; subject:string; html_body:string; }

function smtpConfig(){const host=process.env.SMTP_HOST;const port=Number(process.env.SMTP_PORT||587);const user=process.env.SMTP_USER;const pass=process.env.SMTP_PASS;const from=process.env.EMAIL_FROM;if(!host||!user||!pass||!from)throw new Error("SMTP is not configured");return {host,port,user,pass,from};}

export async function sendSmtpMessage(message:OutboxMessage){const config=smtpConfig();const transport=nodemailer.createTransport({host:config.host,port:config.port,secure:config.port===465,auth:{user:config.user,pass:config.pass}});const result=await transport.sendMail({from:config.from,to:message.recipient_email,subject:message.subject,html:message.html_body});return result.messageId;}
