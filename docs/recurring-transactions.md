# Recurring transactions — Phase 1

Use **Settings → Recurring → +** to create a standalone schedule without recording a payment. Its selected date is the first due date. In the normal Add/Edit transaction editor, tap the repeat pill beside the calculator to choose Weekly, Monthly (default), or Yearly. Choose Off to stop recurrence. When created from a recorded transaction, that entry is the initial confirmed payment; future dates are reminders, not financial entries.

Home shows actionable occurrences from five local-calendar days before through five days after their due date. Quick Add opens the existing editor with the scheduled details. Amount changes apply only to that occurrence unless the **Future** pill beside the income/expense toggle is selected. **Already paid** links an existing same-type, same-currency entry within the reminder window without creating another entry. A recorded entry can confirm only one occurrence.

**Settings → Recurring** manages active and paused schedules and shows a currency-separated monthly expense estimate. Skipping affects one occurrence. Pausing hides reminders; resuming starts at the next due date without a backlog. Deleting a schedule preserves recorded transactions and confirmation history. A deleted schedule can be re-enabled from its original entry.

Monthly dates clamp to the last day in short months without losing the original day. Yearly February 29 schedules return to February 29 in leap years. Expired reminders become missed and never change income, expenses, or balance.

Transactions and confirmations are written atomically, with unique occurrence and transaction-link constraints. Full and selectable backups include recurring schedules, occurrence history, and required catalog/transaction references. Restore preserves existing confirmed/skipped occurrences.

Calendar indicators, notifications, and configurable reminder windows are deferred to Phase 2.
