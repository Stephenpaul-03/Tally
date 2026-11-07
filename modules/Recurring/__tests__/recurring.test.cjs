const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loader}=require('../../../scripts/test-support/load-ts.cjs');
const {repository}=require('../../../scripts/test-support/finance-db.cjs');
const {occurrenceDate,nextOccurrence,windowStatus,monthlyEstimate}=loader()('modules/Recurring/model.ts');
const form={title:'Electricity',amount:100,date:'2026-10-10',type:'expense',category:'Bills',account:'Cash',currencyCode:'INR',currencySymbol:'₹'};
async function fixture(frequency='monthly',date=form.date){
 const source=repository();
 await source.repo.addCategory('Bills','expense','lightning-bolt-outline','#123456');
 const recurring=source.load('modules/Recurring/repository.ts');
 const original=await recurring.saveRecurringTransaction('personal',{...form,date},{enabled:true,frequency});
 const id=source.sqlite.prepare('SELECT id FROM recurring_transactions').get().id;
 return {...source,...recurring,original,id};
}
const count=source=>source.sqlite.prepare('SELECT count(*) AS count FROM transactions').get().count;
test('monthly/yearly schedules retain their original anchor across short months and leap years',()=>{
 assert.equal(occurrenceDate('2026-01-31',1,'monthly'),'2026-02-28');
 assert.equal(occurrenceDate('2026-01-31',2,'monthly'),'2026-03-31');
 assert.equal(occurrenceDate('2024-02-29',1,'yearly'),'2025-02-28');
 assert.equal(occurrenceDate('2024-02-29',4,'yearly'),'2028-02-29');
 assert.equal(nextOccurrence('2026-01-31','monthly','2026-02-28'),'2026-03-31');
 assert.equal(nextOccurrence('2026-12-28','weekly','2026-12-31'),'2027-01-04');
 assert.equal(nextOccurrence('2027-03-31','monthly','2026-12-31'),'2027-03-31');
 assert.throws(()=>occurrenceDate('2026-02-30',1,'monthly'),/Invalid/);
});
test('reminder windows are inclusive local-calendar dates across month and year boundaries',()=>{
 assert.equal(windowStatus('2027-01-02','2026-12-27'),'future');
 assert.equal(windowStatus('2027-01-02','2026-12-28'),'pending');
 assert.equal(windowStatus('2027-01-02','2027-01-07'),'pending');
 assert.equal(windowStatus('2027-01-02','2027-01-08'),'missed');
});
test('creating a schedule records only its original entry; missed reminders never affect the ledger',async()=>{
 const source=await fixture('monthly','2026-01-31');
 let data=await source.loadRecurring('personal','2026-03-03');
 assert.equal(count(source),1);
 assert.equal(data.occurrences.find(item=>item.dueDate==='2026-01-31').status,'confirmed');
 assert.equal(data.occurrences.find(item=>item.dueDate==='2026-02-28').status,'pending');
 await source.loadRecurring('personal','2026-03-03');
 assert.equal(source.sqlite.prepare('SELECT count(*) AS count FROM recurring_occurrences').get().count,2);
 data=await source.loadRecurring('personal','2026-03-06');
 assert.equal(data.occurrences.find(item=>item.dueDate==='2026-02-28').status,'missed');
 assert.equal(count(source),1);
 data=await source.loadRecurring('personal','2027-01-03');
 assert.ok(data.occurrences.filter(item=>item.status==='missed').length>=10);
 assert.equal(count(source),1);
});
test('concurrent or repeated confirmations produce exactly one normal transaction per due date',async()=>{
 const source=await fixture();
 await source.loadRecurring('personal','2026-11-07');
 const args=['personal',source.id,'2026-11-10',{...form,date:'2026-11-07',amount:120},false,undefined,'2026-11-07'];
 const [a,b]=await Promise.all([source.confirmRecurring(...args),source.confirmRecurring(...args)]);
 assert.equal(a.id,b.id);assert.equal(count(source),2);
 const data=await source.loadRecurring('personal','2026-11-07');
 assert.equal(data.templates[0].form.amount,100);
 assert.equal(data.occurrences.find(item=>item.dueDate==='2026-11-10').status,'confirmed');
 await source.loadRecurring('personal','2026-12-10');
 await source.confirmRecurring('personal',source.id,'2026-12-10',{...form,date:'2026-12-10',amount:140},true,undefined,'2026-12-10');
 assert.equal((await source.loadRecurring('personal','2026-12-10')).templates[0].form.amount,140);
 assert.equal((await source.repo.getTransactions()).find(item=>item.id===a.id).amount,120);
});
test('overlapping weekly windows remain independent; skip is idempotent and does not pause a schedule',async()=>{
 const source=await fixture('weekly','2026-01-01');
 const data=await source.loadRecurring('personal','2026-01-11');
 assert.deepEqual(data.occurrences.filter(item=>item.status==='pending').map(item=>item.dueDate).sort(),['2026-01-08','2026-01-15']);
 await source.skipRecurring('personal',source.id,'2026-01-08','2026-01-11');
 await source.skipRecurring('personal',source.id,'2026-01-08','2026-01-11');
 await assert.rejects(source.confirmRecurring('personal',source.id,'2026-01-08',{...form,date:'2026-01-08'},false,undefined,'2026-01-11'),/no longer actionable/);
 await source.confirmRecurring('personal',source.id,'2026-01-15',{...form,date:'2026-01-11'},false,undefined,'2026-01-11');
 assert.equal(count(source),2);
 assert.equal((await source.loadRecurring('personal','2026-01-11')).templates[0].paused,false);
});
test('pause suppresses reminders; resume restarts from the next due date without a paused-period backlog',async()=>{
 const source=await fixture('weekly','2026-01-01');
 await source.loadRecurring('personal','2026-01-11');
 await source.setRecurringState('personal',source.id,'pause','2026-01-11');
 let data=await source.loadRecurring('personal','2026-02-01');
 assert.ok(data.templates[0].paused);
 assert.equal(data.occurrences.find(item=>item.dueDate==='2026-01-15').status,'pending');
 await source.setRecurringState('personal',source.id,'resume','2026-02-01');
 data=await source.loadRecurring('personal','2026-02-01');
 assert.deepEqual(data.occurrences.filter(item=>item.status==='pending').map(item=>item.dueDate),['2026-02-05']);
 assert.equal(count(source),1);
});
test('already-paid links a manually recorded payment without creating another or reusing a linked payment',async()=>{
 const source=await fixture('weekly','2026-01-01');
 await source.loadRecurring('personal','2026-01-11');
 const manual=await source.repo.addTransaction({...form,date:'2026-01-10',amount:83});
 await source.confirmRecurring('personal',source.id,'2026-01-08',form,false,manual.id,'2026-01-11');
 assert.equal(count(source),2);
 await assert.rejects(source.confirmRecurring('personal',source.id,'2026-01-15',form,false,manual.id,'2026-01-11'),/already linked/);
 assert.equal(count(source),2);
 await assert.rejects(source.confirmRecurring('other',source.id,'2026-01-15',form,false,manual.id,'2026-01-11'),/no longer exists/);
});
test('schedule edits and deletion preserve confirmed transactions and keep future templates outside actual totals',async()=>{
 const source=await fixture();
 await source.loadRecurring('personal','2026-11-10');
 const recorded=await source.confirmRecurring('personal',source.id,'2026-11-10',{...form,date:'2026-11-10'},false,undefined,'2026-11-10');
 await source.editRecurringTemplate('personal',source.id,{...form,title:'New bill',amount:900},'monthly');
 assert.equal((await source.repo.getTransactions()).find(item=>item.id===recorded.id).amount,100);
 await source.setRecurringState('personal',source.id,'delete','2026-11-10');
 assert.equal((await source.loadRecurring('personal','2027-01-01')).templates.length,0);
 assert.equal(count(source),2);
});
test('a failed schedule save or confirmation rolls back the normal transaction as well',async()=>{
 const source=await fixture();
 await assert.rejects(source.saveRecurringTransaction('personal',{...form,account:'Missing account'},{enabled:true,frequency:'monthly'}),/category or account/);
 assert.equal(count(source),1);
 await source.loadRecurring('personal','2026-11-10');
 source.sqlite.exec("CREATE TRIGGER fail_confirmation BEFORE UPDATE ON recurring_occurrences WHEN NEW.status='confirmed' BEGIN SELECT RAISE(ABORT,'storage failure'); END");
 await assert.rejects(source.confirmRecurring('personal',source.id,'2026-11-10',{...form,date:'2026-11-10'},false,undefined,'2026-11-10'),/storage failure/);
 assert.equal(count(source),1);
 assert.equal((await source.loadRecurring('personal','2026-11-10')).occurrences.find(item=>item.dueDate==='2026-11-10').status,'pending');
});
test('monthly expense estimates exclude income and paused schedules and never combine currencies',()=>{
 const templates=[{form:{type:'expense',amount:120,currencyCode:'INR'},frequency:'monthly'},{form:{type:'expense',amount:120,currencyCode:'USD'},frequency:'yearly'},{form:{type:'income',amount:999,currencyCode:'INR'},frequency:'monthly'},{form:{type:'expense',amount:100,currencyCode:'INR'},frequency:'monthly',paused:true}];
 assert.deepEqual(monthlyEstimate(templates),{INR:120,USD:10});
});
test('recurring backups round-trip with catalog remapping and never downgrade terminal confirmations',async()=>{
 const source=await fixture();
 await source.loadRecurring('personal','2026-11-10');
 const older=await source.workspaceRepo.getDatabaseBackup();
 const confirmed=await source.confirmRecurring('personal',source.id,'2026-11-10',{...form,date:'2026-11-10'},false,undefined,'2026-11-10');
 const backup=await source.workspaceRepo.getDatabaseBackup();
 const {validateBackup,selectBackupSections}=loader()('modules/Backup/model.ts');
 const app=validateBackup({format:'tally-backup',version:1,exportedAt:'2026-11-10',sections:['transactions','catalogs','workspaces','budgets','recurring'],database:backup,preferences:{}});
 const section=selectBackupSections(app,['recurring']);
 validateBackup(section);
 const target=repository();await target.repo.addCategory('Earlier category','expense');
 await target.workspaceRepo.restoreAppDatabase(section.database);
 await target.workspaceRepo.restoreAppDatabase(section.database);
 assert.equal(count(target),2);
 await target.workspaceRepo.restoreAppDatabase(older);
 assert.equal(target.sqlite.prepare("SELECT transaction_id FROM recurring_occurrences WHERE template_id=? AND due_date='2026-11-10'").get(source.id).transaction_id,confirmed.id);
 const restored=await target.load('modules/Recurring/repository.ts').loadRecurring('personal','2026-11-10');
 assert.equal(restored.templates[0].form.category,'Bills');
 assert.equal(restored.occurrences.find(item=>item.dueDate==='2026-11-10').status,'confirmed');
 const bad=JSON.parse(JSON.stringify(app));bad.database.recurringOccurrences.push(bad.database.recurringOccurrences[0]);
 assert.throws(()=>validateBackup(bad),/duplicate recurring/);
});

test('a short pause preserves a future reminder; repeated resume does not skip the current occurrence',async()=>{
 const source=await fixture('weekly','2026-01-01');
 await source.loadRecurring('personal','2026-01-11');
 await source.setRecurringState('personal',source.id,'pause','2026-01-11');
 await source.setRecurringState('personal',source.id,'resume','2026-01-12');
 await source.setRecurringState('personal',source.id,'resume','2026-01-15');
 const data=await source.loadRecurring('personal','2026-01-15');
 assert.equal(data.occurrences.find(item=>item.dueDate==='2026-01-15').status,'pending');
 assert.equal(data.occurrences.find(item=>item.dueDate==='2026-01-08').status,'skipped');
 assert.equal(count(source),1);
});

test('a deleted schedule can be re-enabled on its original transaction without duplicating its confirmation',async()=>{
 const source=await fixture();
 await source.setRecurringState('personal',source.id,'delete','2026-11-07');
 await source.saveRecurringTransaction('personal',form,{enabled:true,frequency:'monthly'},source.original.id);
 const data=await source.loadRecurring('personal','2026-11-07');
 assert.equal(data.templates.length,1);
 assert.equal(data.templates[0].id,source.id);
 assert.equal(count(source),1);
 assert.equal(data.occurrences.filter(item=>item.status==='confirmed').length,1);
});

test('standalone schedules keep the first due date and create no financial entry until confirmation',async()=>{
 const source=repository();
 await source.repo.addCategory('Bills','expense');
 const recurring=source.load('modules/Recurring/repository.ts');
 const id=await recurring.createRecurringTemplate('personal',{...form,date:'2026-11-10'},'monthly');
 await recurring.createRecurringTemplate('personal',{...form,title:'Water',date:'2026-11-15'},'monthly');
 assert.equal(count(source),0);
 assert.equal(source.sqlite.prepare('SELECT count(*) AS count FROM recurring_occurrences').get().count,0);
 const backup=await source.workspaceRepo.getDatabaseBackup();
 const {validateBackup}=loader()('modules/Backup/model.ts');
 validateBackup({format:'tally-backup',version:1,exportedAt:'2026-11-07',sections:['recurring','catalogs','workspaces'],database:{workspaces:backup.workspaces,categories:backup.categories,accounts:backup.accounts,recurringTemplates:backup.recurringTemplates,recurringOccurrences:backup.recurringOccurrences},preferences:{}});
 const target=repository();
 await target.workspaceRepo.restoreAppDatabase(backup);
 assert.equal(count(target),0);
 const restored=await target.load('modules/Recurring/repository.ts').loadRecurring('personal','2026-11-07');
 assert.equal(restored.templates.length,2);
 let data=await recurring.loadRecurring('personal','2026-11-07');
 assert.equal(data.occurrences.find(item=>item.templateId===id).dueDate,'2026-11-10');
 assert.equal(data.occurrences.find(item=>item.templateId===id).status,'pending');
 assert.equal(count(source),0);
 const recorded=await recurring.confirmRecurring('personal',id,'2026-11-10',{...form,date:'2026-11-07'},false,undefined,'2026-11-07');
 assert.ok(recorded.id);assert.equal(count(source),1);
 data=await recurring.loadRecurring('personal','2026-12-07');
 assert.equal(data.occurrences.find(item=>item.templateId===id && item.dueDate==='2026-12-10').status,'pending');
});
