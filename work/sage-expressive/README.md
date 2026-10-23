# Sage Expressive review

`index.html` retains the initial six-screen design reference from the supplied screenshots: Home, Transactions and Insights, light above dark, each at 390 × 844. Navigation links connect screens within each mode. It is a design reference rather than a live rendering of the current app. It never inserts its screenshot data into the app database. Regenerate it with `python3 work/sage-expressive/build-preview.py`.

## Current app behavior

- Settings → Interface presents Classic followed by Sage Expressive layout choices as square cards.
- Settings → Appearance contains matching theme-style cards, system/light/dark and AMOLED controls, and 12 accent colors, including Sage, Terracotta and Citrus. Classic style requires Classic layout; changing layouts selects a compatible style automatically.
- The Expressive theme covers the main app and Settings. Its surfaces follow the selected accent; it uses bundled Figtree fonts, rounded tonal cards, and larger controls.
- The three Expressive tabs share one UI-thread position for a transformed page rail and bottom pill. Page swipes and pill drags move that position directly; native scroll events and per-frame React updates are not involved. Fixed tab slots animate only transforms, opacity and icon tint. Pages retain their scroll positions; changing the month returns affected lists to the top. Reduced-motion settings suppress settling animations.
- Expressive Insights uses the same screen, calculations and actions as Classic. Configured budgets, currencies, category details/history, payment accounts, daily activity and year/month totals are directly available. View-mode and month-comparison controls have been removed from both layouts; budget information appears directly with spending and categories. The reduced “More insights” modal has been removed.
- Month selection shares the selected month across all Expressive screens. Month/control sheets fit their contents up to a bounded maximum height.
- The Home month stepper is compact and sits beside Settings. Search stays visible wherever its query applies and clearing it removes the query. Transaction long-press deletion and unsaved drafts remain available.
- Amounts retain fractional purchases and keep different currencies separate. Category and account badges share the transaction-row color treatment across lists, pickers, reassignment and editor previews, while respecting minimal-icons preferences. Settings rows retain their individual action colors; header controls use matching 44-point targets and 21-point icons. The progress ring uses smooth native arcs with reduced-motion support.

## Latest polish

Home retains the original Balance hero, including its original typography, overspend chip and tappable Income/Spent detail pills. The “Go to” heading and shortcut cards have been removed; the rest of Home is reserved for a later design decision. The full timeline, search, sorting and filtering live on Transactions. The summary retains currency boundaries and identifies its balance as income minus spending. Settings is available at the right of every Expressive main header, beside the month chip in Insights. The Insights information architecture is reserved for the next redesign.

Navigation performance review: all three tab slots exist at their final widths from the first layout, and the rail/pill start at the same selected position. Main list entrances no longer replay on tab changes. Onboarding targets retain their wrappers and only switch registration, preventing overview remounts and chart animation replays. Tabs publish React selection only after settling. Native Android checks passed page swipes, pill dragging, interrupted taps, Settings return navigation and both Settings shortcuts. The same debug-emulator drag sequence reduced slow drawing-command events from 60 to 12 and reported missed deadlines from 72/145 frames to 20/198 frames after replacing scroll commands with the transform rail. Median frame time was 17ms, so steady 60fps is not certified; release profiling on a physical device remains necessary. A page-caching experiment did not improve timings and was removed. Release checks and Android/iOS production exports pass.

- Home has no Add FAB. Transactions keeps its Add FAB, drops the quick-filter pills, and puts title and month/count/total before one row containing Sort, Filter, Fold and a flexible search field.
- Budget lists, Budget details, Defaults tiles and sort sheets use tonal icons in Expressive; category icons match transaction rows. Header search, Workspace add/delete and Budget sort controls use 44-point targets and 21-point icons.
- Interface hides Hide labels and Bottom bar for Expressive layout, including the bottom-bar search result. Expressive navigation always shows its full bar and labels; Classic preferences remain saved for Classic.
- Both design selectors show Classic first. The twelve accents run from neutrals through blue, violet, rose, earth, yellow, green and teal hues.
- Expressive Settings routes use native push transitions with a stable native container and no screen freezing. Defaults no longer stacks delayed opacity entrances over navigation. Shared icon containers retain native clipping hosts when theme/minimal-icon styles change. The pager restores its selected tab after native content sizing and route focus, preventing a Home pill from appearing over Transactions after a layout switch.
- Android checks covered Defaults/search, Budget, Workspace add/editor/delete-button sizing, Interface choice order and Classic-only visibility, and the revised Transactions controls. Navigation checks kept Settings content visible. No workspace or transaction data was changed.

## Motion and Insights refinement

- Programmatic tab changes own their destination until the next explicit tap or drag. Stale scroll completion events cannot reselect old destinations, including after the newest scroll has settled. Native rapid-tap checks remained on the final destination without additional interaction.
- Shared list motion fades/staggers rows on page entry. Transaction day groups animate measured height and row opacity during individual and all-day fold/unfold; Classic keeps row content mounted through collapse. Budget group/detail expansion and entity activity captions also animate. Delays are bounded for long lists. Page transitions, sheets and shared bars honor animation preferences and system reduced motion.
- Sort uses two-column rounded cards, tonal icons, a connected direction control and a full-size Apply button. Filter uses matching larger cards, header actions, a semantic type selector and a full-size footer. Category/account editor delete controls and Insights sheet buttons use circular 44-point targets. Shared entity editor type and primary actions follow Expressive too.
- Insights labels distinguish Income received, Money spent, and the percentage of income spent. Income and spending have distinct green and coral tones; overspending retains its error indicator. Category tiles, income segments and payment tiles retain their entity colors. Expense and account tiles now share one layout component.
- Both layouts omit view-mode and comparison controls. Currency remains available when needed; current configured budgets appear directly. Recorded entries form one connected group and scroll with the summary rather than in a separate region. Month, detail and history sheet actions match the Expressive control sizes.
- Android checks covered rapid tab taps followed by idle captures, Sort and Filter rendering, Fold/Unfold all, the category delete control, colored payment cards and connected recorded entries. No ledger data was edited or deleted.

## Transactions page review

- Title/subtitle spacing is compact. The subtitle contains only the month and the entry count, with singular/plural entry wording.
- Transactions controls are a separate sticky FlatList cell: title and subtitle scroll away, while Sort, Filter, Fold and Search remain above the list. Empty search results still render beneath the controls.
- Search shows a small clear action only with entered text. Both native scroll containers permit handled keyboard taps, so the first clear tap works while the keyboard is open; scrolling dismisses the keyboard.
- Daily Income and Spent totals remain separate, including mixed income/spending days and multiple currencies; days without recorded income omit its line, and drafts do not affect these totals. Transaction rows within each day have a 4-point vertical gap.
- Transactions disclosures start immediately with a 200ms height transition, without the former stagger/close delay or duplicate height layout animation. The Add action is a 56-point pill with icon and text.
- The Filter header aligns to the panel edges. Description spacing is tighter, Reset is vertically centered, and cards size to their content rather than stretching the caption area.
- Android checks verified sticky controls while scrolled, grouped row spacing, Filter alignment, clear-search with keyboard open, no-results rendering, individual disclosure and Fold/Unfold all. Test queries were cleared and the list was restored to expanded state.

## Add Transaction control surfaces

Expressive category/account pills use their selected entity tones and readable foregrounds. Note/title inputs and keypad numbers use raised surfaces, clear/backspace have distinct action containers, and the calendar uses the secondary container. The main Expressive card and amount area are transparent, leaving color on the individual controls. The note input remains rounded. Android rendering was checked without saving a transaction.

## Add Transaction animation performance

- Amount glyph entry/exit and bulk clearing run through Reanimated on the UI thread, without per-glyph React callbacks or timers. Functional keypad updates preserve fast input, and a stable amount-area height prevents the keypad moving when numbers shrink to fit.
- Note expansion animates a clipping surface on the UI thread while keeping the text input width stable. Tapping inside inputs no longer triggers the background blur handler. Mode transitions use the native animation driver, and opening no longer waits through the former initial delay.
- Memoized keypad, date picker, entity picker and input subtrees skip unrelated keystroke renders. Styles and callbacks remain stable; redundant note/title commits return the existing state.
- Android debug-emulator keypad stress checks improved from 12 missed deadlines out of 111 frames to 3 out of 114 after removing glyph layout interpolation. Final median frame time was 20ms, so a consistent 60fps is not certified; physical-device release profiling remains necessary. Note entry, keyboard dismissal, ordered digits and clearing passed without saving ledger data. Both production platform bundles exported successfully.

## Verification

Category completion-flash follow-up: category cards now derive their stagger from one persistent Reanimated timeline. The row entrance no longer uses React Native Animated's native-completion synchronization with React, and rows mounted after completion inherit the settled timeline instead of starting another entrance. Native clipping is disabled on the category scroll view. In repeated Android captures, the former path changed row pixels after the expected finish in all three visits; the replacement produced identical row-region pixels across all eight post-entrance samples in each of three visits (24 frames). This is sampled emulator verification rather than a guarantee against every device-specific intermittent frame. Release checks and Android/iOS production exports passed.

Settings entrance correction: Settings rows keep their entrance state while visiting nested pages, and animate again on a fresh visit from the main screen. Categories, Accounts and Budget use an explicit once-per-mount stagger instead of changing autoplay during the running animation. Budget rows no longer stack a second entrance on that stagger; initially open disclosure captions remain visible through the surrounding entrance. Defaults follows the same Settings motion scope. Regression tests cover rerenders, blur/focus round trips, newly mounted visits and data changes. Android navigation checks passed for Categories, Accounts, Budget and Defaults, with fully visible Settings rows on return and no data changes. Release checks and Android/iOS production exports passed.

The follow-up uses synchronous safe-area padding for the Settings routes and disables Settings item layout interpolation. Categories, Accounts, Budget and Defaults share a 260ms entrance with 30ms stagger, starting after the native route transition (with a bounded fallback for portal/no-transition routes). Category/account activity captions render at their final height instead of measuring an inner disclosure during entrance. Budget cards omit hidden detail containers and their gaps when no budget is set. Currency selection now shares one virtualized sheet across Defaults and form fields, using the shared modal close/search header, theme-aware selection cards, bounded height, and compact search results. Regression checks also verify that card entrances wait for page readiness. Android checks covered card rendering, budget fold/unfold and Currency search/close in both Classic and Expressive without selecting a currency; Expressive was restored after verification. Release checks and both production exports passed.

`npm run check:release` passes, including typecheck, lint and all test suites. The added design tests cover compatibility of saved preferences, accent propagation and contrast, currency-separated totals, 12 valid accent presets, and drag/snap boundaries. Expo Android and iOS production bundles export successfully. Android smoke checks confirmed Home and Insights rendering, including light sage and dark accent surfaces. Native Android checks also verified Home → Insights by swiping and Insights → Home by dragging the tab pill, as well as distinct Settings row colors and larger header controls. iOS runtime verification was unavailable because the Xcode installation lacks the Simulator app.


## Shared modal and system-bar refinement

- The visible layout and theme choice is now named Expressive; existing saved `sage` preferences remain compatible. Categories, Accounts, Budget and Defaults card titles use the same bold typeface as Settings rows.
- Android disables the system navigation contrast scrim through a persistent Expo config plugin. Unsupported edge-to-edge color calls and duplicate form-level system-bar updates were removed. The rebuilt Android app produced identical app-bar and system-bar surface pixels in both light and dark Expressive modes. A plugin regression test checks preservation and repeat application. This change requires a native Android rebuild.
- Shared sheets and dialogs use one Reanimated UI-thread timeline instead of stacking Paper and wrapper animations. Sheets travel their measured height, preserve content during exit, and drag through a UI-thread gesture. Add Transaction no longer runs a second entrance or delayed reverse-stagger exit. Reduced motion remains respected.
- The Transactions Add pill stays mounted for its exit, fades/slides up on arrival and down on departure, and hides its touch/accessibility target outside Transactions.
- Android checks covered month-sheet header dragging, nested category-picker dismissal, Add form rendering, and system-bar matching. Release checks, native Android build, system-bar regression test, and Android/iOS production exports passed. These checks do not certify a constant frame rate on physical devices; iOS runtime verification remains unavailable.


## Settings shape and month-picker consistency

Insights now renders the same MonthPickerSheet as Home and Transactions, including the year stepper, month grid, selected state, current-month action and close control. The duplicate Insights month-picker content and its year state were removed.

Expressive Settings uses shared 24-point individual card corners and 28-point group corners. Management tiles, Defaults, Appearance choices, workspace cards, notification/security choices and import/export surfaces follow these sizes; shared entity-editor fields and icon controls also use Expressive geometry. Classic card geometry is preserved. The category Income/Expenses selector is borderless, with stronger semantic red/green tonal selection surfaces in Expressive.

Typecheck, lint, analytics and design checks passed. Android visual checks covered Categories, Defaults and Appearance, and Insights month selection using the shared Home sheet. No ledger data was edited.


## Home welcome and repeat-payment preview

- Each page or bottom-pill swipe is constrained to a neighbor of the active page, both while dragging and when velocity chooses the landing. Starting another gesture during a transition retains this active-page boundary. Direct tab taps still select their destination. Regression checks cover extreme distances and velocities in both directions.
- The original Home balance hero is unchanged. A locally saved welcome name edits inline above it, with a 30-character limit.
- Repeat a payment shows up to eight actual recurring expense matches from the current workspace/currency. A match requires the same title, category, account and amount on separate recorded dates. Deleted entries, drafts, future entries and other currencies are excluded. These are quick-add suggestions, not scheduled charges. The carousel owns its horizontal scroll independently of page swiping.
- A payment card opens a fresh Add form with today's local date and the recorded amount, category, account and currency. It does not post an expense; the user reviews and saves normally. Historical notes and metadata are not copied. The seed is transient and clears on close or another modal action; closing an untouched seed does not create a draft.
- Release checks passed, including financial grouping/prefill and single-page swipe tests. Android checks confirmed the welcome/carousel rendering and a prefilled payment form without saving ledger data. Both platform production bundles exported.


## Conditional Home attention cards and payment pins

Home shows Continue a draft only while an unfinished entry exists; it resumes the most recently updated draft and indicates when there are more. A single budget nudge appears only for the current month in the workspace's budget currency, when actual posted spending reaches the configured nearly-empty threshold. The most urgent overall/category warning wins, and tapping it opens Budgets. Deleted, draft, future, income and other-currency records do not contribute. The balance hero remains unchanged.

Repeat-payment cards have independent accessible 44-point pin controls. Pinned cards appear first in pin order and keep their recorded payment details; unpinning returns a card to the suggested order. Pins persist locally per workspace and do not schedule charges or add entries. A pin remains usable with one surviving history record, while deleted histories are not revived.

Typecheck, lint and design checks passed, including budget suppression/urgency, draft selection, pin ordering, persistence across remounts and workspace separation. Android checks confirmed empty attention sections remain hidden and pin/unpin works; the original pin state was restored. No ledger data was changed. Android/iOS production exports passed.


## Compact repeat cards and in-card greetings

The greeting now sits inside the balance hero and uses its container foreground colors. It follows the device's local hour: Up late (22:00–03:59), An early start (04:00–05:59), Good morning, Good afternoon and Good evening. It refreshes each minute while Home is active and on returning to the app. The saved name remains editable with the 30-character limit and no pencil after saving. Repeat cards are narrower (224 points maximum) with smaller padding/type and tighter gaps, retaining full-size pin and Add targets. Typecheck, lint, greeting boundary tests and an Android visual check passed.


## Greeting/date row and smaller payment cards

The greeting is a separate tonal card above the original balance hero, taking 70% of the available row width beside a square current-date card. One shared clock refreshes both the greeting and date while Home is active and on app foregrounding. Saved-name editing stays inline. Repeat-payment cards are now 196 points wide with tighter padding, title and amount only; category/account captions, counts and the pinned caption were removed. Pin and Add controls remain. Typecheck, lint, greeting boundary tests and Android visual verification passed.


## Name fitting and repeat-payment removal

The saved greeting name starts at 40 points and shrinks to fit a single line. Inline editing, the 30-character limit and the hidden pencil for saved names remain. Repeat-payment and pinning UI, models, preference hook and feature-specific tests have been removed, along with the transaction-form prefill path used only by that carousel. The greeting/date row, original balance hero, conditional draft and budget-nudge cards remain. Typecheck, lint, design tests and Android visual verification passed.


## Threshold-aware nudges, draft selection and varied Home cards

Nudges use both configured limits: below Safe below is hidden, the gap between Safe below and Nearly empty is a watch state, then nearly-empty, exhausted and overspent states. The highest severity wins, followed by highest percentage used; safe budgets cannot displace riskier ones. The card shows actual usage, money remaining/over, a progress bar and the configured thresholds. Existing currency/month exclusions remain.

Multiple drafts open a bounded, scrollable selection sheet listing every saved draft newest first, with amount, type, category, account and update time. Selecting a row opens that draft; a single draft retains direct resume. The sheet closes when leaving Home or changing workspace.

Greeting, date and draft surfaces use distinct lavender, green and cyan tones, with amber/red nudge tones by severity. All Home cards, including the balance hero, vary which corner uses the smaller radius. A random session rotation stays stable through re-renders, with different corner choices across card roles.

Typecheck, lint and 33 design tests passed, covering threshold boundaries and 50%/80% ranking, complete draft ordering, stable varied corners and distinct light/dark tones. Android Home visual checks confirmed the revised cards and real-budget warning. Both production platform bundles exported. No ledger records or draft contents were edited during verification.


## Category-colored budget carousel

Budget watch replaces the single warning with a horizontal carousel of every relevant category/overall budget, still filtered by configured thresholds and sorted by severity. The thresholds are no longer printed on Home. Each card uses the category's shared transaction-row tone and icon (or the primary container for the overall limit), with a large remaining/overspent amount, plain left/over-budget wording, a progress bar, percentage spent and the budget limit. A page counter and the next-card preview reveal additional budgets. Carousel gestures own their horizontal scroll and do not change main tabs.

Typecheck, lint and 35 design tests passed, including inclusion/ranking of all relevant categories, safe/unconfigured exclusions, currency separation and distinct keys for the overall limit versus a category with the same name. Android checks verified category colors, forward/back carousel paging, counter updates and remaining on Home. No ledger or budget data was edited.


## Fixed overall budget and setup prompt

With no valid budget limits, Home shows a Set a budget prompt linking to Budgets. Once any limit exists, a fixed card takes 30% of the budget row while category cards scroll independently in the remaining space. The fixed card always shows the configured overall limit's remaining/overspent amount, total and progress, even with zero or safe spending. Category limits are not summed into a fabricated overall budget: category-only setups show a Set overall budget action in the fixed slot. The category list contains only relevant category warnings; healthy category limits show an on-track state, and an overall-only setup offers category limits. Budget rows retain the current-month/workspace-currency boundary.

Typecheck, lint and 38 design checks passed, covering no-budget setup, safe/unused overall visibility, unbudgeted-category spending in the overall total, overspending and separation of fixed versus scrolling data. Android checks verified that category paging changes while the fixed card's bounds remain identical, and restored the first category. Both production platform exports passed. No ledger, draft or budget data was changed.


## Derived budgets and lighter transaction sheets

This supersedes the previous overall-budget behavior: overall budget is the sum of positive finite limits on active expense categories, shared by Home and Insights. The legacy persisted scalar remains readable for backup compatibility but is no longer used as a separate budget. Home shows a full-width setup card with no limits, a completion prompt for unbudgeted active categories, and a fixed 30% overall summary beside all configured category budgets. Category cards retain their colors and show explicit Under budget / Budget reached / Over budget labels. All posted spending in the selected workspace currency/current month counts toward overall remaining, including spending in categories without limits.

Delete confirmations now use Expressive typography, rounded surfaces, tonal icon/close controls and pill actions when Expressive is selected. Hidden row confirmations and transaction account/category/calendar picker content wait until first use, retaining their content afterward for exit animation. Detail rows omit unused delete dialogs, enter with the sheet rather than a second stagger, and render in smaller virtualized batches; longer lists have a stable sheet height while batches load. View switches directly to Edit without a close/timer/reopen sequence. Currency formatters and account/income/expense selectors are reused to avoid repeated construction and unrelated state-triggered work.

The full release checks passed, including typecheck, lint and 39 design tests. Both Android and iOS production bundles exported successfully. Budget tests cover derived totals, active-category coverage, invalid/unset limits, safe category visibility, overspending and currency/month boundaries. No frame-rate guarantee has been measured.

Android verification confirmed the derived total and partial-coverage prompt, budget setup navigation, Add with category/date pickers, View-to-Edit, a row opened from the spending detail list, and the Expressive delete alert (canceled). No transactions, budgets or drafts were saved/deleted during these checks.


## Single-pass sheet motion and revised Home cards

Sheet entrances are now guarded once per visibility cycle, including when the Portal lays out before the visibility effect. Entrance travel uses the window height rather than a content measurement that changes during transaction form/list hydration. Layout updates still measure drag/exit distance, but cannot move an opening sheet back toward its starting edge. Regression tests exercise both lifecycle orders, repeated opens and content growth at partial progress. The delete slider now uses Gesture Handler and Reanimated shared values for finger tracking, return motion and fill/label motion on the UI thread; confirmation crosses to JavaScript only after the distance threshold. Reduced-motion/addon preferences apply.

Home budgets return to full-width category carousel cards with over/under labels; the fixed overall side box is removed. No-budget and partial-setup prompts remain. A saved draft occupies half a row beside one rotating facts card (daily spending average over elapsed days, entry count and largest expense). Without drafts, facts fill the row. Facts rotate only while Home/app are active, support tap/swipe, and respect disabled/reduced motion. The final Home card previews up to three recent posted transactions with dates and opens their existing View sheet. Stats/previews exclude deleted, draft, future, invalid and other-currency rows; historical averages use the full month. The balance hero and greeting/date cards remain unchanged.

Full release checks passed, followed by the added partial-progress regression test; typecheck/lint passed after final UI adjustments. Android and iOS production bundles exported. Android verification covered the restored budget layout, rotating facts, recent-transaction list and opening View from a recent row. No records or budget settings were edited. Frame rate has not been measured.

The Android delete slider was tested with a short, below-threshold drag and canceled; no deletion occurred. Entrance distance remains fixed through viewport changes, while sheet dragging and interrupted reopen/close motion preserve the current pixel offset.


## Compact Home and clearer Insights

Draft and rotating-fact cards use the greeting/date row height. With no draft, a smaller fact card shares a 65/35 row with the budget carousel. The partial-budget completion nudge is removed; the no-budget setup action remains. Expressive navigation icons and captions use a consistent neutral foreground, with a neutral selected pill independent of accent choice.

Insights has a larger centered balance, and hides inactive ring arcs so a zero-length half cannot leave a hairline; a solid inner mask protects the center. A header comparison action opens Month and Budget modes. Month comparison uses the shared month picker, disallows the selected/future month, accepts empty historical periods, and displays aligned income/spending/balance totals. Budget mode compares posted spending with summed category limits for the current workspace month/currency; unavailable comparisons explain the boundary and link to Budgets.

Card headings use Spending by category, Income by category, Spending by account, Daily activity and Yearly overview. The daily toggle shows the active label with both icons, a border and accessible touch targets; its title stays on one line. Daily detail sheets now receive only the selected type's transactions and total. Yearly totals and bars use tonal income/expense colors. The additional income-source segmented chart and caption are removed, retaining category tiles.

Full release checks passed, including new mixed-day filtering and comparison-month validation tests; Android/iOS bundles exported. Android checks covered comparison month selection, budget comparison, the daily header/yearly tones, and the same day's four expenses versus one income row. No transactions or budget limits were changed.

Final Android Home review confirmed the greeting-height budget/stat cards sharing one row with no draft, the removed completion nudge, and neutral navigation icons.


## Plain section headers and draggable activity toggle

Insights Balance and its amount now share a centered row; the amount is 28 points, slightly larger than the 24-point income/spending amounts. Section headings are Spending, Income, Accounts, Activity and Yearly. Spending/Income omit header totals; preview spending tiles and their parent omit budget warnings (budgets remain available in comparison/detail views). Header icons have no colored backing. Expressive headings sit directly on the page background, above rounded tonal card bodies without divider lines.

The daily toggle uses one UI-thread progress value for its draggable indicator, changing segment widths, icon tints and label reveals. Only the selected label is visible at rest. Dragging blocks the Expressive main pager, supports cancellation and respects motion preferences. Android tests confirmed left drag selects Expenses and right drag selects Income, retaining the Insights tab in both cases. Android visual review confirmed the inline balance and simplified headers. Typecheck, lint, 36 analytics tests and 44 design tests passed; Android and iOS production bundles exported. No ledger/budget data was edited.
