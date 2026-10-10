#!/usr/bin/env python3
"""Refresh only an existing Insights Demo workspace in a local DB or debug Android app.

Run: python3 scripts/update-insights-demo.py --adb /path/to/adb
The app is stopped before copying its DB; a backup is kept in the temporary directory.
No sample-data control or automatic seeding is added to the app.
"""
import argparse
from datetime import date
from pathlib import Path
import sqlite3
import subprocess
import tempfile

CATEGORIES = [
    ('Salary', 'income', 'briefcase-outline', '#428569', 0),
    ('Freelance', 'income', 'laptop', '#527DB0', 0),
    ('Interest', 'income', 'bank-outline', '#9A79B0', 0),
    ('Rental income', 'income', 'home-outline', '#4D9C94', 0),
    ('Refunds', 'income', 'cash-refund', '#6C9A65', 0),
    ('Groceries', 'expense', 'basket-outline', '#6C9A65', 7500),
    ('Dining', 'expense', 'silverware-fork-knife', '#C78954', 2500),
    ('Transport', 'expense', 'bus', '#527DB0', 3000),
    ('Rent', 'expense', 'home-outline', '#9A79B0', 18000),
    ('Shopping', 'expense', 'shopping-outline', '#B66F86', 4000),
    ('Health', 'expense', 'heart-outline', '#4D9C94', 2000),
    ('Utilities', 'expense', 'lightning-bolt-outline', '#C78954', 3500),
    ('Subscriptions', 'expense', 'play-circle-outline', '#527DB0', 1200),
    ('Travel', 'expense', 'airplane', '#9A79B0', 5000),
    ('Gifts', 'expense', 'gift-outline', '#B66F86', 1500),
    ('Household & maintenance', 'expense', 'tools', '#6C9A65', 2000),
    ('Learning', 'expense', 'book-open-outline', '#4D9C94', 1500),
]
ACCOUNTS = [('Bank', 'bank-outline'), ('Card', 'credit-card-outline'),
            ('Cash', 'cash'), ('Savings', 'piggy-bank-outline')]


def build_rows(today):
    rows = []
    for offset in range(23, -1, -1):
        month_index = today.year * 12 + today.month - 1 - offset
        year, month = divmod(month_index, 12)
        month += 1
        next_year, next_month = divmod(month_index + 1, 12)
        last = today.day if offset == 0 else (date(next_year, next_month + 1, 1) - date(year, month, 1)).days
        if offset == 17:  # Deliberately empty month for month selection / yearly gaps.
            continue

        def add(day, title, amount, category, kind, account='Card', currency='INR'):
            if day <= last and not (offset == 16 and kind == 'expense') and not (offset == 15 and kind == 'income'):
                rows.append((date(year, month, day).isoformat(), title, amount, category, kind, account, currency))

        phase = 23 - offset
        add(1, 'Monthly salary', 62000 + phase * 700, 'Salary', 'income', 'Bank')
        add(2, 'Website design project', 9200 + phase % 4 * 2200, 'Freelance', 'income', 'Bank')
        add(3, 'Savings interest', 310 + phase * 12, 'Interest', 'income', 'Savings')
        add(3, 'Rental income', 8500, 'Rental income', 'income', 'Bank')
        add(2, 'Returned order refund', 870 + phase % 3 * 150, 'Refunds', 'income', 'Card')
        add(19, 'Illustration commission', 4200 + phase % 5 * 850, 'Freelance', 'income', 'Bank')
        add(1, 'Monthly rent', 18000, 'Rent', 'expense', 'Bank')
        add(2, 'Electricity and broadband', 2850 + phase % 5 * 220, 'Utilities', 'expense', 'Bank')
        add(3, 'Streaming and cloud storage', 799, 'Subscriptions', 'expense')
        add(2, 'New trainers and everyday essentials', 2400 + phase % 4 * 600, 'Shopping', 'expense')
        add(3, 'Prescription and checkup', 950 + phase % 3 * 450, 'Health', 'expense', 'Cash')
        add(1, 'Birthday gift', 1250 + phase % 3 * 400, 'Gifts', 'expense')
        add(2, 'Kitchen repair and household supplies', 1700 + phase % 5 * 350, 'Household & maintenance', 'expense', 'Bank')
        add(3, 'Weekend course', 1350, 'Learning', 'expense')
        add(3, 'Weekend train tickets', 2100 + phase % 4 * 950, 'Travel', 'expense')
        for day in range(1, last + 1):
            add(day, ['Vegetables and fruit', 'Market groceries', 'Pantry essentials'][day % 3],
                150 + (day * 37 + phase * 53) % 420, 'Groceries', 'expense', 'Card' if day % 2 else 'Cash')
            add(day, ['Cafe lunch', 'Dinner with family', 'Morning coffee'][day % 3],
                85 + (day * 19 + phase * 31) % 310, 'Dining', 'expense')
            add(day, 'Bus and metro fares', 45 + day % 5 * 25, 'Transport', 'expense', 'Cash')
            if day % 4 == 0:
                add(day, 'Weekly grocery delivery', 900 + phase % 4 * 210, 'Groceries', 'expense')
            if day % 7 == 0:
                add(day, 'Clothes and home essentials', 1500 + phase % 5 * 600, 'Shopping', 'expense')
        if phase % 4 == 0:
            add(12, 'Family holiday accommodation', 22000, 'Travel', 'expense', 'Bank')
        if phase % 6 == 0:
            add(21, 'Annual health screening', 7800, 'Health', 'expense', 'Bank')
        # Secondary currency exercises currency filtering without mixing totals.
        add(2, 'International illustration project', 240 + phase % 3 * 60, 'Freelance', 'income', 'Bank', 'USD')
        add(3, 'Design software subscription', 24, 'Subscriptions', 'expense', 'Card', 'USD')
    return rows


def update_database(path, today):
    with sqlite3.connect(path) as db:
        db.execute('PRAGMA foreign_keys=ON')
        match = db.execute("SELECT id FROM workspaces WHERE owner_name=?", ('__tally_insights_demo_v1__',)).fetchone()
        if not match:
            raise RuntimeError('Existing Insights Demo workspace not found; no data changed.')
        workspace = match[0]
        ids = {}
        for name, kind, icon, color, budget in CATEGORIES:
            db.execute('INSERT OR IGNORE INTO categories(workspace_id,name,type,icon,color) VALUES(?,?,?,?,?)',
                       (workspace, name, kind, icon, color))
            category = db.execute('SELECT id FROM categories WHERE workspace_id=? AND name=? AND type=?',
                                  (workspace, name, kind)).fetchone()[0]
            ids[name] = category
            if budget:
                db.execute('INSERT INTO category_budgets(workspace_id,category_id,amount) VALUES(?,?,?) ON CONFLICT(workspace_id,category_id) DO UPDATE SET amount=excluded.amount', (workspace, category, budget))
        for order, (name, icon) in enumerate(ACCOUNTS):
            db.execute('INSERT OR IGNORE INTO accounts(workspace_id,name,icon,sort_order) VALUES(?,?,?,?)', (workspace, name, icon, order))
        db.execute('INSERT INTO budgets(workspace_id,monthly_amount) VALUES(?,?) ON CONFLICT(workspace_id) DO UPDATE SET monthly_amount=excluded.monthly_amount', (workspace, 52000))
        db.execute("DELETE FROM transactions WHERE workspace_id=? AND created_by='Demo' AND notes IN ('Sample transaction', 'Insights demo · generated')", (workspace,))
        rows = build_rows(today)
        for index, (day, title, amount, category, kind, account, currency) in enumerate(rows):
            symbol, currency_name = ('₹', 'Indian Rupee') if currency == 'INR' else ('$', 'US Dollar')
            db.execute('INSERT INTO transactions(id,workspace_id,title,amount,date,category_id,type,account,currency_code,currency_symbol,currency_name,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
                       (f'{workspace}-expanded-{index}', workspace, title, amount, day, ids[category], kind, account, currency, symbol, currency_name, 'Insights demo · generated', 'Demo'))
        return workspace, len(rows)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--database', type=Path, help='Update a local copy instead of the Android debug app')
    parser.add_argument('--adb', default='adb')
    parser.add_argument('--device', default='emulator-5554')
    parser.add_argument('--date', type=date.fromisoformat, default=date.today())
    args = parser.parse_args()
    if args.database:
        print(update_database(args.database, args.date))
        return
    adb = [args.adb, '-s', args.device]
    package = 'com.stephenpaul.tally'
    def run(*cmd, **kwargs):
        return subprocess.run(adb + list(cmd), check=True, capture_output=True, **kwargs)
    run('shell', 'am', 'force-stop', package)
    directory = Path(tempfile.mkdtemp(prefix='tally-insights-demo-'))
    database = directory / 'finance.db'
    raw = run('exec-out', 'run-as', package, 'cat', 'files/SQLite/finance.db').stdout
    database.write_bytes(raw[raw.index(b'SQLite format 3\x00'):])
    # Preserve any SQLite journal before opening the local copy.
    for suffix in ('-wal', '-shm'):
        result = subprocess.run(adb + ['exec-out', 'run-as', package, 'cat', 'files/SQLite/finance.db' + suffix], capture_output=True)
        if result.returncode == 0 and result.stdout:
            Path(str(database) + suffix).write_bytes(result.stdout)
    backup = directory / 'before.db'
    with sqlite3.connect(database) as source, sqlite3.connect(backup) as target:
        source.backup(target)
    workspace, count = update_database(database, args.date)
    with sqlite3.connect(database) as db:
        db.execute('PRAGMA wal_checkpoint(TRUNCATE)')
        assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
    run('push', str(database), '/data/local/tmp/tally-insights-demo.db')
    run('shell', 'run-as', package, 'cp', '/data/local/tmp/tally-insights-demo.db', 'files/SQLite/finance.db')
    run('shell', 'run-as', package, 'rm', '-f', 'files/SQLite/finance.db-wal', 'files/SQLite/finance.db-shm')
    run('shell', 'rm', '/data/local/tmp/tally-insights-demo.db')
    print(f'Updated {workspace}: {count} entries. Backup: {backup}')


if __name__ == '__main__':
    main()
