import { financeDb as db, SQLiteFinanceRepository, mapTransactionRow, type FinanceExecutor, type TransactionRow } from "@/modules/Core/Repository/SQLiteRepo";
import type { Transaction, TransactionFormData } from "@/utils/Types";
import { notifyRecurring } from "./events";
import { localDate, nextOccurrence, shiftDays, validateRecurringForm, windowStatus, type Frequency, type RecurringConfig, type RecurringOccurrence, type RecurringTemplate } from "./model";
// Serialize local confirmations; the SQLite unique keys also protect against duplicate imports/retries.
let writing: Promise<void> = Promise.resolve();
function exclusive(task: (executor: FinanceExecutor) => Promise<void>) {
  const next = writing.catch(() => {}).then(() => db.withExclusiveTransactionAsync(task));
  writing = next.catch(() => {});
  return next;
}
export type RawTemplate = { id: string; workspace_id: string; source_transaction_id: string; category_id: number; account_id: number | null; data_json: string; frequency: Frequency; start_date: string; next_date: string; paused: number; deleted: number; created_at: string; updated_at: string };
export type RawOccurrence = { template_id: string; due_date: string; status: RecurringOccurrence["status"]; transaction_id: string | null; resolved_at: string | null };
const templateSelect = `SELECT r.*, c.name AS category_name, c.icon AS icon, c.color AS color, a.name AS account_name FROM recurring_transactions r JOIN categories c ON c.id=r.category_id AND c.workspace_id=r.workspace_id LEFT JOIN accounts a ON a.id=r.account_id AND a.workspace_id=r.workspace_id`;
type TemplateRow = RawTemplate & { category_name: string; account_name: string | null; icon: string | null; color: string | null };
const mapTemplate = (row: TemplateRow): RecurringTemplate => ({ id: row.id, workspaceId: row.workspace_id, sourceTransactionId: row.source_transaction_id,
  form: { ...JSON.parse(row.data_json), category: row.category_name, ...(row.account_name ? { account: row.account_name } : {}) },
  icon: row.icon || "repeat", color: row.color || "#006B5B", frequency: row.frequency, startDate: row.start_date, nextDate: row.next_date,
  paused: Boolean(row.paused), deleted: Boolean(row.deleted), createdAt: row.created_at, updatedAt: row.updated_at });
const mapOccurrence = (row: RawOccurrence): RecurringOccurrence => ({ templateId: row.template_id, dueDate: row.due_date, status: row.status, transactionId: row.transaction_id, resolvedAt: row.resolved_at });
async function templateFor(executor: FinanceExecutor, workspaceId: string, id: string) {
  const row = await executor.getFirstAsync<TemplateRow>(`${templateSelect} WHERE r.workspace_id=? AND r.id=? AND r.deleted=0`, [workspaceId, id]);
  if (!row) throw Error("This recurring schedule no longer exists.");
  return mapTemplate(row);
}
async function catalog(executor: FinanceExecutor, workspaceId: string, form: TransactionFormData) {
  validateRecurringForm(form);
  const category = await executor.getFirstAsync<{ id: number }>("SELECT id FROM categories WHERE workspace_id=? AND name=? AND type=? AND is_deleted=0", [workspaceId, form.category, form.type]);
  const account = await executor.getFirstAsync<{ id: number }>("SELECT id FROM accounts WHERE workspace_id=? AND name=? AND is_deleted=0", [workspaceId, form.account]);
  if (!category || !account) throw Error("The category or account was removed. Edit this schedule and choose an available category and account.");
  return { categoryId: category.id, accountId: account.id };
}
async function actual(executor: FinanceExecutor, workspaceId: string, id: string) {
  const row = await executor.getFirstAsync<TransactionRow>(`SELECT t.*, c.name AS category FROM transactions t JOIN categories c ON c.id=t.category_id AND c.workspace_id=t.workspace_id WHERE t.workspace_id=? AND t.id=?`, [workspaceId, id]);
  if (!row) throw Error("The linked transaction no longer exists.");
  return mapTransactionRow(row);
}
export async function recurringForTransaction(workspaceId: string, transactionId: string) {
  const row = await db.getFirstAsync<TemplateRow>(`${templateSelect} WHERE r.workspace_id=? AND r.deleted=0 AND (r.source_transaction_id=? OR r.id IN (SELECT template_id FROM recurring_occurrences WHERE transaction_id=?)) LIMIT 1`, [workspaceId, transactionId, transactionId]);
  return row ? mapTemplate(row) : null;
}
async function writeTemplate(executor: FinanceExecutor, workspaceId: string, form: TransactionFormData, frequency: Frequency, sourceId: string, existing?: RecurringTemplate | null) {
  if (!["weekly","monthly","yearly"].includes(frequency)) throw Error("Choose a supported frequency.");
  const refs = await catalog(executor, workspaceId, form);
  const now = new Date().toISOString();
  if (existing) {
    const reschedule = existing.deleted || existing.frequency !== frequency || existing.startDate !== form.date;
    if (reschedule) await executor.runAsync("DELETE FROM recurring_occurrences WHERE template_id=? AND status='pending'", [existing.id]);
    await executor.runAsync("UPDATE recurring_transactions SET category_id=?,account_id=?,data_json=?,frequency=?,start_date=?,next_date=?,deleted=0,paused=?,updated_at=? WHERE id=? AND workspace_id=?",
      [refs.categoryId, refs.accountId, JSON.stringify(form), frequency, form.date, reschedule ? nextOccurrence(form.date, frequency, existing.sourceTransactionId ? localDate() : shiftDays(localDate(),-1)) : existing.nextDate, existing.deleted ? 0 : Number(existing.paused), now, existing.id, workspaceId]);
    return existing.id;
  }
  const id = `rec-${Date.now()}-${Math.random().toString(36).slice(2,12)}`;
  await executor.runAsync(`INSERT INTO recurring_transactions (id,workspace_id,source_transaction_id,category_id,account_id,data_json,frequency,start_date,next_date,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id,workspaceId,sourceId,refs.categoryId,refs.accountId,JSON.stringify(form),frequency,form.date,sourceId ? nextOccurrence(form.date,frequency,form.date) : form.date,now,now]);
  if (sourceId) await executor.runAsync("INSERT INTO recurring_occurrences (template_id,due_date,status,transaction_id,resolved_at) VALUES (?,?,'confirmed',?,?)", [id, form.date, sourceId, now]);
  return id;
}
/** Create a schedule without recording an income or expense. The selected date is its first due date. */
export async function createRecurringTemplate(workspaceId: string, form: TransactionFormData, frequency: Frequency) {
  let id = "";
  await exclusive(async executor => { id = await writeTemplate(executor,workspaceId,form,frequency,""); });
  loading.clear();
  notifyRecurring();
  return id;
}
/** Save the normal ledger transaction and its schedule together, or neither. */
export async function saveRecurringTransaction(workspaceId: string, form: TransactionFormData, config: RecurringConfig, editingId?: string) {
  let saved!: Transaction;
  await exclusive(async executor => {
    const finance = new SQLiteFinanceRepository(workspaceId);
    saved = editingId ? await finance.updateTransaction(editingId, form, executor) : await finance.addTransaction(form, executor);
    const row = await executor.getFirstAsync<TemplateRow>(`${templateSelect} WHERE r.workspace_id=? AND (r.source_transaction_id=? OR r.id IN (SELECT template_id FROM recurring_occurrences WHERE transaction_id=?)) LIMIT 1`, [workspaceId,saved.id,saved.id]);
    const existing = row ? mapTemplate(row) : null;
    if (config.enabled) {
      const templateForm = { ...form, date: existing && existing.sourceTransactionId !== saved.id ? existing.startDate : form.date };
      await writeTemplate(executor, workspaceId, templateForm, config.frequency, saved.id, existing);
    } else if (existing) {
      await executor.runAsync("UPDATE recurring_transactions SET deleted=1,updated_at=? WHERE id=? AND workspace_id=?", [new Date().toISOString(), existing.id, workspaceId]);
      await executor.runAsync("UPDATE recurring_occurrences SET status='skipped',resolved_at=? WHERE template_id=? AND status='pending'", [new Date().toISOString(),existing.id]);
    }
  });
  loading.clear();
  notifyRecurring();
  return saved;
}
export async function editRecurringTemplate(workspaceId: string, id: string, form: TransactionFormData, frequency: Frequency) {
  await exclusive(async executor => {
    const existing = await templateFor(executor, workspaceId, id);
    await writeTemplate(executor, workspaceId, form, frequency, existing.sourceTransactionId, existing);
  });
  loading.clear();
  notifyRecurring();
}
const loading = new Map<string, Promise<{ templates: RecurringTemplate[]; occurrences: RecurringOccurrence[] }>>();
export function loadRecurring(workspaceId: string, today = localDate()) {
  const key = `${workspaceId}:${today}`;
  const running = loading.get(key);
  if (running) return running;
  const task = (async () => {
    await exclusive(async executor => {
      await executor.runAsync("UPDATE recurring_occurrences SET status='missed' WHERE status='pending' AND due_date < ? AND template_id IN (SELECT id FROM recurring_transactions WHERE workspace_id=? AND paused=0 AND deleted=0)", [shiftDays(today,-5),workspaceId]);
      const templates = await executor.getAllAsync<RawTemplate>("SELECT * FROM recurring_transactions WHERE workspace_id=? AND paused=0 AND deleted=0", [workspaceId]);
      for (const template of templates) {
        let due = template.next_date;
        const cutoff = shiftDays(today,5);
        while (due <= cutoff) {
          await executor.runAsync("INSERT OR IGNORE INTO recurring_occurrences (template_id,due_date,status) VALUES (?,?,?)", [template.id,due,windowStatus(due,today) === "missed" ? "missed" : "pending"]);
          due = nextOccurrence(template.start_date,template.frequency,due);
        }
        if (due !== template.next_date) await executor.runAsync("UPDATE recurring_transactions SET next_date=? WHERE id=?",[due,template.id]);
      }
    });
    const templates = (await db.getAllAsync<TemplateRow>(`${templateSelect} WHERE r.workspace_id=? AND r.deleted=0 ORDER BY r.created_at DESC`, [workspaceId])).map(mapTemplate);
    const occurrences = (await db.getAllAsync<RawOccurrence>("SELECT o.* FROM recurring_occurrences o JOIN recurring_transactions r ON r.id=o.template_id WHERE r.workspace_id=? AND r.deleted=0 ORDER BY o.due_date DESC", [workspaceId])).map(mapOccurrence);
    return { templates, occurrences };
  })();
  loading.set(key,task);
  void task.finally(() => { if (loading.get(key) === task) loading.delete(key); }).catch(() => {});
  return task;
}
export async function setRecurringState(workspaceId: string, id: string, action: "pause" | "resume" | "delete", today = localDate()) {
  await exclusive(async executor => {
    const template = await templateFor(executor,workspaceId,id);
    const now = new Date().toISOString();
    if (action === "resume") {
      if (!template.paused) return;
      await executor.runAsync("UPDATE recurring_occurrences SET status='skipped',resolved_at=? WHERE template_id=? AND status='pending' AND due_date<=?", [now,id,today]);
      await executor.runAsync("UPDATE recurring_transactions SET paused=0,next_date=?,updated_at=? WHERE id=?", [nextOccurrence(template.startDate,template.frequency,today),now,id]);
    } else {
      if (action === "pause") {
        if (template.paused) return;
        await executor.runAsync("UPDATE recurring_occurrences SET status='missed' WHERE template_id=? AND status='pending' AND due_date<?", [id,shiftDays(today,-5)]);
      }
      await executor.runAsync(`UPDATE recurring_transactions SET ${action === "pause" ? "paused=1" : "deleted=1"},updated_at=? WHERE id=?`, [now,id]);
      await executor.runAsync(`UPDATE recurring_occurrences SET status='skipped',resolved_at=? WHERE template_id=? AND status='pending'${action === "pause" ? " AND due_date<=?" : ""}`, action === "pause" ? [now,id,today] : [now,id]);
    }
  });
  loading.clear();
  notifyRecurring();
}
async function actionable(executor: FinanceExecutor, workspaceId: string, id: string, due: string, today: string) {
  const template = await templateFor(executor,workspaceId,id);
  const occurrence = await executor.getFirstAsync<RawOccurrence>("SELECT * FROM recurring_occurrences WHERE template_id=? AND due_date=?", [id,due]);
  if (!occurrence) throw Error("This occurrence is not available. Refresh and try again.");
  if (occurrence.status === "confirmed") return { template, occurrence };
  if (template.paused || occurrence.status !== "pending" || windowStatus(due,today) !== "pending") throw Error("This occurrence is no longer actionable. Refresh to see its current status.");
  return { template, occurrence };
}
export async function skipRecurring(workspaceId: string, id: string, due: string, today = localDate()) {
  await exclusive(async executor => {
    const current = await executor.getFirstAsync<RawOccurrence>("SELECT o.* FROM recurring_occurrences o JOIN recurring_transactions r ON r.id=o.template_id WHERE r.workspace_id=? AND o.template_id=? AND o.due_date=?", [workspaceId,id,due]);
    if (current?.status === "skipped") return;
    const { occurrence } = await actionable(executor,workspaceId,id,due,today);
    if (occurrence.status === "confirmed") throw Error("This occurrence has already been recorded.");
    await executor.runAsync("UPDATE recurring_occurrences SET status='skipped',resolved_at=? WHERE template_id=? AND due_date=?",[new Date().toISOString(),id,due]);
  });
  loading.clear();
  notifyRecurring();
}
export async function confirmRecurring(workspaceId: string, id: string, due: string, form: TransactionFormData, updateFutureAmount: boolean, existingTransactionId?: string, today = localDate()) {
  let saved!: Transaction;
  await exclusive(async executor => {
    const { template, occurrence } = await actionable(executor,workspaceId,id,due,today);
    if (occurrence.status === "confirmed" && occurrence.transaction_id) {
      saved = await actual(executor,workspaceId,occurrence.transaction_id);
      if (saved.deleted) throw Error("This occurrence was already confirmed. Its recorded transaction was deleted.");
      return;
    }
    if (existingTransactionId) {
      saved = await actual(executor,workspaceId,existingTransactionId);
      if (saved.deleted || saved.type !== template.form.type || (saved.currencyCode || "INR") !== (template.form.currencyCode || "INR") || saved.date < shiftDays(due,-5) || saved.date > shiftDays(due,5)) throw Error("Choose a recorded transaction with the same type and currency, within five days of this due date.");
      const linked = await executor.getFirstAsync("SELECT 1 FROM recurring_occurrences WHERE transaction_id=?",[saved.id]);
      if (linked) throw Error("That transaction is already linked to a recurring occurrence.");
    } else {
      if (form.type !== template.form.type || (form.currencyCode || "INR") !== (template.form.currencyCode || "INR")) throw Error("Keep this schedule’s type and currency. Edit the schedule to change them.");
      await catalog(executor,workspaceId,form);
      saved = await new SQLiteFinanceRepository(workspaceId).addTransaction(form,executor);
    }
    await executor.runAsync("UPDATE recurring_occurrences SET status='confirmed',transaction_id=?,resolved_at=? WHERE template_id=? AND due_date=? AND status='pending'",[saved.id,new Date().toISOString(),id,due]);
    if (updateFutureAmount && !existingTransactionId) await executor.runAsync("UPDATE recurring_transactions SET data_json=?,updated_at=? WHERE id=?",[JSON.stringify({ ...template.form,amount:saved.amount }),new Date().toISOString(),id]);
  });
  loading.clear();
  notifyRecurring();
  return saved;
}
