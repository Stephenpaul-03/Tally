import { validateRecurringForm, validDate } from "./model";
import type { RawTemplate, RawOccurrence } from "./repository";
export function validateRecurringBackup(templates: RawTemplate[] = [], occurrences: RawOccurrence[] = [], catalogs: { workspaces?: { id:string }[]; categories?: any[]; accounts?: any[]; transactions?: any[] }) {
 const ids=new Map<string,RawTemplate>();
 for(const template of templates){
  if(!template || typeof template.id!=="string" || !template.id || ids.has(template.id) || !catalogs.workspaces?.some(workspace=>workspace.id===template.workspace_id) || !["weekly","monthly","yearly"].includes(template.frequency) || !validDate(template.start_date) || !validDate(template.next_date) || (template.next_date<template.start_date || (template.next_date===template.start_date && Boolean(template.source_transaction_id))) || ![0,1].includes(template.paused) || ![0,1].includes(template.deleted) || typeof template.source_transaction_id!=="string" || typeof template.created_at!=="string" || typeof template.updated_at!=="string") throw Error("Invalid recurring schedule in backup");
  let form;try{form=JSON.parse(template.data_json);validateRecurringForm(form);}catch{throw Error("Invalid recurring transaction details in backup");}
  const category=catalogs.categories?.find(category=>category.id===template.category_id && category.workspace_id===template.workspace_id && category.type===form.type);
  if(!category || (template.account_id!==null && !catalogs.accounts?.some(account=>account.id===template.account_id && account.workspace_id===template.workspace_id))) throw Error("Recurring schedule is missing its category or account");
  ids.set(template.id,template);
 }
 const dates=new Set<string>(),links=new Set<string>();
 for(const occurrence of occurrences){
  const template=ids.get(occurrence?.template_id),key=`${occurrence?.template_id}:${occurrence?.due_date}`;
  if(!template || dates.has(key) || !validDate(occurrence.due_date) || !["pending","confirmed","skipped","missed"].includes(occurrence.status)) throw Error("Invalid or duplicate recurring occurrence");
  if(occurrence.status==="confirmed"){
   if(typeof occurrence.transaction_id!=="string" || !occurrence.transaction_id || links.has(occurrence.transaction_id) || !occurrence.resolved_at) throw Error("Invalid recurring confirmation link");
   const transaction=catalogs.transactions?.find(transaction=>transaction.id===occurrence.transaction_id);
   if(transaction && transaction.workspace_id!==template.workspace_id) throw Error("Recurring confirmation belongs to another workspace");
   links.add(occurrence.transaction_id);
  }else if(occurrence.transaction_id!==null) throw Error("Only confirmed occurrences can link a transaction");
  dates.add(key);
 }
}
