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


## Classic dashboard and shared native page/bar motion

Classic Home is now a dedicated dashboard instead of the old collapsed Insights/transaction split. It reuses Home's greeting/date, balance with tappable Income/Spent summaries, conditional draft picker, rotating facts, one-card budget carousel/setup action and up to three recent transactions. A presentation context gives these shared features uniform 20-point corners, fine borders, neutral greeting/draft/fact surfaces and a 54-point Classic balance amount. The floating Classic navigation bar, hide-label/disabled-bar preferences and Classic transaction timeline remain. Home uses posted workspace records independently of ledger filters.

Classic has three persistently mounted horizontal pages. A shared Reanimated position drives both the pages and the floating pill; Gesture Handler tracks finger movement on the UI thread, with JavaScript selection updates only at settlement. Both page and bar drags use the tested one-neighbor clamp. Destination/progress checks reject stale commits after interruptions. The old per-move PanResponder/React state path is removed from the tab bar. Standalone Classic Insights has its own header/month/settings/comparison actions, retained content and once-only motion scope; Home clocks/facts pause when its native route loses focus. Transaction tools remain available above the timeline, with Add retained above the Classic bar.

The full release checks passed, followed by final typecheck/lint and 45 design tests including new fractional Classic pill geometry coverage. Android and iOS production bundles exported. Android screenshots verified Classic dashboard styling and transaction timeline, bar navigation across all three tabs, an extreme Transactions swipe stopping at Home, interrupted tab selections, and the Settings round trip. The initial Expressive layout was restored after verification. No transaction, draft or budget data was edited; frame rate has not been measured.


## Free navigation-pill drag and full Classic surfaces

Pill gestures in both tab bars now use the full three-tab range, independently of the adjacent-page limit retained for screen swipes. Icon/label layers blend from the live shared position on the UI thread as the pill enters and leaves each tab. Expressive retains neutral icon colors; Classic retains its accent selection. Regression coverage distinguishes end-to-end pill targets from adjacent screen-swipe targets.

Full Classic Home now uses neutral, finely outlined 12-point cards, a compact 42-point balance, plain income/spending summaries, neutral date and budget surfaces, and Classic typography. Its header has an unfilled month stepper/settings button. Standalone Insights also uses Classic header typography and plain controls when the Classic theme is selected. Expressive theme presentation and shared dashboard data/features remain available.

Android verification passed direct Transactions-to-Insights and reverse pill drags. Typecheck, lint, 46 design tests and 36 analytics tests passed. No ledger, draft or budget data was edited.


## Classic Transactions toolbar and modal handoff

Classic Transactions now starts with one compact toolbar: month, Sort, Filter, Fold and a small search field. Focusing search smoothly expands it across the row; clearing and closing search restore the controls. The Transactions title and Settings action are removed from this screen only. Timeline dividers sit outside the clipped accordion body, meeting the left rail in expanded and folded states. Each pager page clips its own content so dividers cannot bleed onto adjacent pages.

The Classic list no longer reserves a 300-point minimum footer. Clearance is based on the nav bar, floating Add action and safe area, accounting for the final section's existing padding. Expressive clearance similarly follows its nav/FAB footprint. The redundant footer rule is removed.

Both transaction themes now close the view sheet fully before presenting Edit. An optional shared-modal after-exit callback performs the handoff, rejects stale/cancelled closes, and supports reduced motion without timers. Header mode is established before entry rather than springing between view/edit configurations. No transaction fields are saved during this transition.

Validation: typecheck, clean lint, 47 design/motion tests and 36 analytics tests passed. Android review covered compact/full-width search, connected dividers, view-to-edit handoff in both themes, and expanded/folded final-row clearance. The original Classic layout/theme were restored after Expressive verification. No transaction, draft or budget data was modified.


## Edit re-entry lifecycle and Classic toolbar buttons

After-exit callbacks now run after the modal's closed render commits, rather than inside the animation-completion callback. This prevents the taller Edit form from reusing a still-mounted View panel and starting twice. The transaction mode is selected before releasing the local close state. Regression coverage verifies the old panel is absent before the handoff and that a taller presentation starts exactly once after it.

Classic search is now a 44-point icon button matching Sort/Filter/Fold, expanding to the existing full-width search input. The month selector now has the same outlined neutral surface and corner radius, with a calendar icon, month label and chevron. Android screenshots verified the toolbar, search expansion/return and Edit entry; a frame-by-frame recording showed the View exit followed by a single Edit entrance. Typecheck, lint and 48 design/motion tests passed. No transaction data was changed.


## Isolate View and Edit portal instances

The previous after-unmount callback still reused one AnimatedPaperModal instance and its shared animation values. View-to-Edit now increments the modal presentation key only after View exits, creating fresh animation state for Edit. A small presentation hook keeps the replacement hidden until Edit mode and the matching transaction id arrive, preventing cached View content from reopening during delayed state updates. External closure cancels the handoff.

New behavioral tests cover duplicate Edit taps, the closed waiting state, distinct presentation ids, delayed Edit content and cancellation. Typecheck, clean lint and all 50 design/motion tests passed. The exact Android reproduction was recorded and reviewed across 65 consecutive samples covering View exit, the empty interval and Edit entry; View did not flash back and Edit entered once. No transaction data was saved or changed.


## Classic Home composition and interruption-safe budgets

Full Classic Home now uses a distinct composition with the same shared dashboard information: inline greeting/name and date, a ruled two-column overview (balance beside stacked tappable Income/Spent), a full-width budget card, conditional full-width draft resume row, a compact horizontal rotating fact row, and a plain recent-transaction list. Expressive's composition remains unchanged. Draft selection, budget thresholds, transactions, month selection and currencies still use the same existing models/actions.

Both budget carousels now have one UI-thread gesture/scroll owner. Horizontal drags claim the carousel before the outer page gesture; end/cancel/finalize settle to a complete bounded card. Resizing, changed card counts and leaving/returning to Home also align the selected card. Native scrolling/paging no longer competes with gesture-driven offset updates. Accessibility next/previous budget actions are available, and reduced motion is respected.

Android checks passed short drags, diagonal drags, explicit ACTION_CANCEL, and leaving Home/returning in both Classic and Expressive; each resulting carousel had exactly one fully visible card. Classic was restored afterward. Typecheck, clean lint, 52 design/motion tests and 36 analytics tests passed, including new carousel settling tests across widths/counts and extreme velocities. No ledger, draft or budget data was changed.


## Selected Home concept C, with header balance

Implemented the chosen concept's restrained colored cards, unboxed statistic and recent-entry timeline. Per clarification, the compact balance replaces the header month selector; month navigation moves into the Overview section. Greeting/name sits beside a pronounced date card (42-point day, accent container). Income and Spent use separate subtle green/red tonal cards with existing detail actions. Budget/drafts/facts data and gesture handling remain shared and unchanged.

Android review verified the header/date hierarchy and previous/next month controls. Typecheck, clean lint and 52 design/motion tests passed. SHA checks confirmed BottomTabBar.tsx, ExpressiveTabBar.tsx and AppNavigator.tsx are byte-for-byte unchanged during this task. Classic Insights concepts are previews only.


## Classic Insights concept B

Implemented B's grouped balance/income/spending overview, spending donut with a compact four-row legend (three categories plus combined remainder), unchanged income-source list, and compact three-column accounts strip. The donut uses native clipped ring arcs, without a new native chart dependency. Its segment colors come from the same category colors as legend icons; current-period amounts/shares stay currency-separated through the existing analytics model. Category rows and remainder retain transaction/all-category drill-down actions. Narrow screens and large fonts stack the ring/legend and retain account rows. Existing comparison/month controls, Activity, Yearly and detail flows remain in place; Expressive keeps its existing composition.

Typecheck, clean lint, 39 analytics tests and 52 design/motion tests passed, including ring coverage, aggregate totals, recorded-zero and empty-state cases. Android review covered ring rendering, category/full-breakdown/account drill-down, account layout and switching September/October with October restored. Android and iOS Hermes bundles exported. Navigation-bar source hashes are unchanged. No ledger data was changed.


## Home balance/date and 80/20 refinement

Classic Home restores the header month stepper and the C-style balance card beside stacked Income/Spent cards. The date is now a smaller 76×78 neutral outlined box with a 26-point day, alongside the greeting. Budget and rotating facts share one equal-height 80/20 row; the narrow fact card uses compact labels and fitted values while retaining its caption, paging dots, tap/swipe actions and accessibility text. Conditional drafts remain full-width below that row; an absent budget lets the fact card use the row. Expressive's composition and all bottom-bar files remain unchanged.

Android review confirmed the arrangement, statistic content and one complete budget card after gesture cancellation at the new width. Typecheck, clean lint and 52 design/motion tests passed. No ledger/draft/budget data was changed.


### Classic Home compact summary and 70/30 refinement

- Changed the budget/facts row from 80/20 to 70/30 while retaining whole-card carousel snapping.
- Reduced the summary minimum height from 150 to 112; Income and Spent now place their icon, label and amount on one row. Narrowed Balance to leave more room for those amounts.
- Replaced the Balance top stripe with the same subtle tint and border treatment as Income/Spent, using the selected accent; added a wallet icon.
- Applied the selected accent to the Classic Tally wordmark and date number only; weekday and month remain secondary.
- Verified the Android Home layout visually, including inline amounts and the narrower facts card. Typecheck, lint and all 52 design tests passed. Bottom bar/navigation source hashes remain unchanged during this refinement.


### Classic Home budget/facts tones and draft action

- Matched Classic budget/setup cards to the Balance accent wash and subtle accent border, retaining category-colored icons/progress and over/under budget details.
- Gave each Classic compact statistic a stable distinct tint: teal for daily average, lavender for entry count, amber for largest expense. Reduced labels and enlarged bold values to establish a clear hierarchy.
- Replaced the Classic draft card with a compact “Continue a draft” action, retaining single-draft resumption and the multiple-draft picker/count. Expressive draft presentation and navigation remain unchanged.
- Verified the Android Home rendering. Typecheck, lint, all 52 design tests and diff whitespace checks passed.


### Classic Home draft placement and budget category tint

- Moved the Classic draft action into the header between the month control and Settings, using an accessible icon with an unfinished-entry count. It appears only when drafts exist and retains direct single-draft resumption and the multiple-draft picker.
- Removed the standalone Classic draft button from the content flow.
- Corrected each Classic budget card wash/border to use its configured category color, retaining its category icon/progress colors. The empty setup prompt has no category and keeps its general accent treatment.
- Android visual review confirmed the header fits and the category tint is applied; typecheck, lint, all 52 design tests and diff whitespace checks passed. No bottom bar changes.


### Home date month control and consistent draft selection

- Removed the Home header month stepper in both Classic and Expressive. Both date cards are now accessible buttons opening the existing shared month selector; greeting/date styling is preserved.
- Both layouts now open the draft picker for any nonzero draft count, including one draft. Selecting an entry in that picker resumes it.
- Verified on Android that the Classic single-draft action opens the picker and tapping the date opens Choose month. Shared Expressive handlers use the same picker/month state. Typecheck, lint, all 52 design tests and diff whitespace checks passed.


### Classic theme surface hierarchy

- Created checkpoint commit `cb89f69` (“Moonlit waffles orbit quietly”) before palette edits, as requested.
- Captured and reviewed Classic Insights in light, dark and AMOLED before/after; comparison is `reviews/classic-insights-surfaces.png` (before on top, after below).
- Fixed identical white page/card colors in Light: cool-neutral #F2F2F5 page, white cards, #ECECF0 controls.
- Strengthened Dark hierarchy: #121214 page, #242428 cards, #303036 controls.
- Preserved true-black AMOLED page, with #141416 cards and #222226 controls; raised secondary text to #AAAAB2.
- Updated shared Classic tokens rather than individual page styles, retaining accent palettes, card layouts and navigation implementation. Expressive continues to derive its own surfaces.
- Added regression checks across all 12 accents and three modes for page/card/control separation, normal/secondary text contrast, true-black preservation, and unchanged accent roles. Typecheck, lint, 54 design tests and 39 analytics tests passed.


### Classic transaction day cards

- Added a neutral surface card behind each Classic day’s transactions: single-entry days have one card; multiple entries share one continuous card with hairline inner separators.
- Retained timeline/date headings outside cards, transaction actions, and existing bottom clearance. Card surfaces follow Light/Dark/AMOLED theme tokens.
- Classic disclosure now runs immediately with a 200ms native height/opacity transition, animating the group as one unit without duplicate nested row entrances. Expressive disclosure behavior remains unchanged.
- Verified single and multi-entry day rendering plus collapse/reopen on Android; preview in `reviews/classic-transaction-cards.png`. Typecheck, lint, 54 design tests and whitespace checks passed.


### Classic bottom bar and Home recent cards

- Changed the Classic bottom bar to the shared card surface and hairline border, with active tint derived from that surface. Preserved its shape, dimensions, actions and drag/navigation behavior.
- Gave each Classic recent transaction on Home its own neutral card, matching transaction-day card radius, surface and subtle border. Replaced the old timeline rail with clean spacing between cards.
- Avoided outer overflow clipping, which hid Android row content inside the transformed Home pager; row ripple clipping remains intact.
- Verified the Android Home rendering; preview is `reviews/classic-home-and-nav-cards.png`. Typecheck, lint, 54 design tests and whitespace checks passed. Includes the preceding Classic surface/day-card work in the user-requested checkpoint before Insights.


### Main-page final refinement

- Vertically centered the Insights balance label/amount group beside Income/Spent; put the Classic month selector on a card surface with a fine border.
- Reused the Classic Spending donut/category component for Income, using income category colors/icons and placing the chart on the right. Existing category/detail/full-breakdown actions remain available; narrow/large-type screens stack responsively.
- Replaced Classic Accounts’ fixed three-column layout and vertical rules with a full-width row list that supports any account count, retaining account icons/colors, amounts and detail actions.
- Grouped Classic Home’s Recent transactions heading and rows inside one card with subtle internal separators, rather than separate row cards.
- Shared Home’s header draft action and 70/30 budget/facts row across Classic and Expressive. Removed the old Expressive draft card and duplicate draft-picker state; any nonzero draft count still opens the picker before resuming.
- Added the Classic Transactions title/calendar/Settings header. Calendar was moved out of the toolbar; sort/filter/fold/search behavior remains intact.
- Android reviewed Classic Home/Transactions/Insights, Income/Accounts, and Expressive Home; verified the Expressive single-draft picker. Review sheet: `reviews/final-main-pages.png`.
- Typecheck, clean lint, 54 design tests, 39 analytics tests, and Android/iOS offline exports passed. No ledger, account or budget data changed during QA.


### Settings card-surface completion

- Classic SheetCard groups now use the shared card surface rather than the elevation tint, restoring white cards against the neutral light page. Expressive keeps its existing surface treatment; row geometry and interactions remain unchanged.
- Verified the light Settings page on Android (`reviews/classic-settings-light-cards.png`). Typecheck, clean lint, 54 design tests and whitespace checks passed.
- Included this fix and the completed main-page refinement in the user-requested checkpoint before new features.


### Calculator, Goals, complete backups and Insights reports

- Kept the transaction numpad and added a compact draggable + / − / × / ÷ control, separate Clear/Equals actions, and a subdued pending calculation above the amount. Invalid/division-by-zero results preserve input and explain recovery.
- Added manually tracked Goals in Settings and Home for both layouts. Reused the category/account editor and shared icon/color lists, added target/reason/optional date fields, and redesigned color-tinted goal cards. Goal editor and progress sheets are keyboard-aware.
- Added selectable complete or per-section JSON backups covering all workspaces, catalogs, transactions, budgets/defaults, goals, preferences/reminder settings and optional drafts (off by default). Restore validates and remaps references inside an atomic database merge.
- Added multi-file import with per-file problems, correction guidance, remove/reselect/retry, deduplication and pre-write conflict detection. Mixed legacy and complete backups are reviewed in separate batches. Export errors retain selections and show a reason/recovery/retry; fixed the All-time card to use one rounded frame.
- Updated the existing Insights PDF renderer with Classic/Expressive layouts, selected accent, embedded fonts, category charts/tables, comparison and budget data. Available through Insights → Compare → Share Insights PDF. Both generated two-page reports were rendered and visually reviewed in output/pdf.
- Android QA: shared goal customization/editor scrolling, keyboard-raised progress input and Save, 12 × 3 = 36, All-time export card, valid-plus-invalid multi-import and removing the invalid file. No transactions or goal progress were saved during QA. Screenshots in reviews/.
- Validation: full release checks passed (including 58 design, 41 analytics and 9 feature tests); clean TypeScript/lint; Android and iOS offline production exports passed. Restored preferences apply after reopening Tally, as explained in the import preview.


### Settings surfaces, locked layout styles and main entrances

- Standardized Settings groups, category/account tiles, budget/default tiles and workspace rows on the shared card surface. Raised controls and category icon tones retain their own roles.
- Removed the Appearance theme-style selector and its search result. Layout selection now determines the style in both directions, including migration of old mixed Classic/Expressive preferences; mode, accent and AMOLED remain in Appearance.
- Added UI-thread opacity/translation entrances for main-route entry and return from Settings. Home staggers header, greeting/date, summary, Goals and budget/activity content without animating dimensions. Expressive navigation slides/fades; Classic navigation fades as one unit, replacing independent icon mount motion. Tab changes and modal presentation do not restart these entrances. Reduced motion and the animation preference are respected.
- Verified the current Android bundle removes the style selector and renders both Home layouts and Settings card surfaces. Restored Expressive after QA. Full release checks (58 design tests included), clean typecheck/lint, whitespace check, and Android/iOS offline production exports passed.


### Home simplification and text reveals

- Removed the Goals card and the budget/facts carousel row from both Home layouts. Goals and budget management remain available in Settings; draft access remains in the header.
- Preserved greeting/date, balance/income/spending and recent transactions. Added staged content reveals within card shells: labels first, amounts next, then recent rows. Updated amounts replay their reveal; unchanged text does not replay on ordinary rerenders or tab changes. Animation preferences and system reduced motion remain respected.
- Shared text wrappers retain the existing typography, responsive amount fitting and flex allocation; motion uses only opacity/translation. No balance counting or ledger values are changed.
- Full release checks, typecheck/lint and whitespace validation passed. No Android emulator was connected for live motion QA in this pass.

- Follow-up: amount reveals now animate glyphs individually using the add-modal 140ms fade/rise, staggered by 28ms. Card shells complete before the 500ms content start; labels precede the amount sequence. A hidden full-string measure preserves final geometry and fitting, and assistive technology reads the amount once. Typecheck, lint, whitespace and 58 design tests passed; live device motion remains unverified with no emulator connected.

- Extended the same glyph reveal to the welcome name and every numeric Home label, including calendar/date metadata and recent transaction amounts. Mixed labels reveal their nonnumeric text before digits. Recent-row reveal is opt-in on Home, preserving list behavior elsewhere. The temporary 4× Home timing preview remains enabled.


### Home motion performance pass

- Replaced per-character entrance components/focus subscriptions with one UI-thread timeline per text line. Glyphs now render as native animated Text nodes, sharing the existing typography resolver; mixed captions group nonnumeric runs instead of animating each letter.
- Gated the timeline on text measurement, preserving final text geometry, and retained the initial delay while an asynchronously loaded welcome name arrives. Kept once-only Settings-return behavior and live value-change reveals.
- Shortened card motion from 320ms to 240ms with a brief initial layout buffer. Content starts at 470ms after all card shells settle at 410ms; labels finish before digits. Stagger is now 20ms or less, capped to 220ms for long names; glyph rise is 6px.
- Reviewed Android recording and sampled frames; preview: reviews/home-motion-optimized.mp4. Data was not edited. Development reload metrics include bundle/startup work and are not a reliable physical-device FPS benchmark: baseline 47 frames / 8 janky, final 95 frames / 18 janky, with different rendered-frame counts. The overall jank rate is not demonstrably lower; startup frame spikes remain.
- Full release checks, 62 design tests, clean TypeScript/lint and Android/iOS offline production exports passed during this pass.


### Home icons, whole dates and navigation stagger

- Added once-only icon fades aligned with Home's label content start for Settings, greeting pencil, summary icons, draft action and recent-row category/chevron icons. Icon/label reveals retain native opacity/translation and reduced-motion handling.
- Calendar text and recent transaction date captions now reveal as complete phrases, avoiding visible ordinal/month fragments before their day numbers. Amounts and the welcome name retain the glyph sequence.
- Added staggered icon/label entrances to both Expressive and Classic bottom bars after the bar surface appears, preserving the measured pill geometry, drag behavior and no-replay-on-Settings-return policy.
- Android recording captured; UI inspection verified complete date text nodes, including “22nd October 2026”. Typecheck, clean lint, 62 design tests, whitespace checks and Android/iOS offline exports passed.


### Transaction mutation motion, calculator expansion and session date

- Added animated native list-cell and row wrappers for transaction insertions/removals in Classic and Expressive. Initial/recycled identities are tracked separately, newly created day groups avoid duplicate row entrances, and removed identities can animate again on real re-insertion. Cell retention and disabled clipping allow exit animations to complete.
- Mutation entrances/exits and open-group height adjustments wait 220ms so the movement remains visible after transaction/delete sheets close; existing accordion open/close remains immediate. Added registry regression checks for recycled and removed/reinserted identities.
- Calculator controls remain mounted and expand/collapse their clipped frame from 44px to 332px over 220ms, crossfading the compact button and expanded controls without changing keypad height. Reduced motion is respected.
- New-transaction date selections are remembered for the Transactions-page session using a ref, avoiding form resets while selecting. Leaving that tab/page, visiting Settings, or switching workspace clears the date. Edit/view transactions and resumed drafts do not overwrite this default.
- Android verified calculator expand/collapse without altering the user's open transaction. Live add/delete and date-session persistence were not exercised against the user's ledger. Full release checks, clean typecheck/lint, 64 design tests, whitespace checks and Android/iOS offline exports passed during this pass.


### Synchronized transaction mutations

- Created the requested checkpoint first: `79e1d37` (Refine Home motion and transaction interactions).
- Replaced independent native row exits, delayed group measurement animation and delayed cell-layout transitions with retained presence records. Each inserted/deleted row now drives height and opacity from one UI-thread progress value; open day cards remain in normal layout flow so following cards move in the same frame.
- Transaction-only FlowDisclosure preserves animated fold/unfold while allowing natural height changes when open. Restored the generic Settings disclosure behavior, and removed the superseded identity registry and nested transaction entrance wrappers.
- Removed rows stay in their original slot until their fade/collapse completes. Interrupted deletion can reverse without a stale completion removing the revived row. Virtualized/offscreen records settle without cutting off a mounted row animation.
- Fixed an onLayout/SharedValue race found during native QA: the first entrance trusts the event's measured height rather than reading an asynchronous height write back immediately. Added a regression test that simulates that pending UI-thread write.
- Native QA used a disposable emulator clone and a QA-only Oct 30/29/27 dataset, leaving the user's running device and ledger unchanged. Recorded insertion into an existing Oct 29 group and multi-row deletion in both Expressive and Classic; verified fold/unfold, new Oct 31 insertion and removal of its final row/day card. Review: `reviews/transaction-flow-synchronized.mp4` (Expressive add/delete, then Classic add/delete).
- Full release checks, 68 design tests, clean TypeScript/lint, whitespace checks and Android/iOS offline production exports passed. The synchronization fix remains uncommitted after the checkpoint for review.


### Saved transaction visibility recovery

- Completed entrance wrappers now explicitly restore automatic height and full opacity. Non-flattened native measurement nodes and a bounded presence watchdog prevent a missing layout/completion callback from leaving a saved row or day at zero height. Added regression coverage for stalled mounted entrances and final layout restoration.
- Transaction saves now await database success before closing or removing a resumed draft. Duplicate saves are blocked; failures retain the form and show the underlying error for correction/retry. Successful additions open their destination day and switch the displayed month when necessary.
- Verified on a disposable Android emulator clone: adding into a folded day unfolds it; a new date card remains visible after a Home/Transactions round trip and in Classic. A QA-only database failure retained all entered values and allowed a successful retry. The user's emulator and ledger were not modified. Screenshots: `reviews/tally-visibility-*.png`.
- Full release checks, 71 design tests, TypeScript/lint, whitespace checks and Android/iOS offline exports passed. Changes remain uncommitted after the requested checkpoint.


### Yearly and Daily Insights refinement

- Replaced the yearly monthly-totals table with month cards: full month names, selected/partial/upcoming states, and separate labeled income/spending values. Existing month navigation and accessibility descriptions are preserved.
- Daily toggle icons use white in dark mode. Added a 12px expressive header/content gap and a cancellable fade-out/swap/fade-in for calendar mode changes, respecting animation preferences.
- Added a compact draggable Classic/Expressive Insights style selector in Settings → Interface. The saved preference overrides Insights only, preserving the surrounding app layout and navigation. Until explicitly selected, Insights follows the app layout. Added preference backup support and invalid-value validation.
- TypeScript, lint and full release checks passed; backup tests cover the new preference. Physical-device visual/motion review remains outstanding.


### Configurable Insights PDF sharing

- Removed the Compare header action and comparison sheet. Share now opens PDF controls for Income, Expenses, Accounts, independent budget/past-month comparisons, and Simple/Detailed report geometry. Section toggles retain at least one selection.
- Added a checkbox picker scoped to included sections. Selected income/expense categories and accounts add escaped, date-sorted transaction detail tables to the report; other groups remain summaries. Type-qualified keys keep identically named categories/accounts distinct.
- PDF generation honors section inclusion, omits balance when either cash-flow section is excluded, supports reports with no comparison, and includes account summaries. Errors keep selections and expose the reason for retry. The export style defaults to the selected Insights type rather than changing the app preference.
- Full release checks, 47 analytics/report tests, TypeScript/lint and Android/iOS production exports passed. Rendered both PDF styles using embedded app fonts and reviewed all pages of synthetic multi-page reports. Fixed an orphaned Accounts heading with account-summary page-break rules. On-device share-sheet interaction remains to be reviewed.


### Share modal and parent-group report details

- Placed Include and Comparisons in adjacent primary/tertiary tonal cards and moved the compact Simple/Detailed toggle into the share-sheet header. Added an optional retained header accessory to ControlsSheet.
- Expanded-details controls now show only included sections, each with its own scoped category/account picker. Deselecting a section clears its expansion choices; export also filters inactive choices.
- Simple PDFs omit donut/chart markup. Expanded expense, income, and account groups now follow their corresponding summary rather than collecting at the report end.
- Full release checks passed, including 49 analytics/report tests. Rendered and visually checked every page of both updated three-page QA PDFs with embedded fonts. Native modal interaction remains to be reviewed.


### Shared multi-select report pickers

- Added a short secondary-text explanation under Expanded details. Report Income/Expense categories and Accounts now use the same management-picker modals as Add Transaction, scoped to included groups with entries in the report period.
- Added optional multi-selection arrays to the existing picker components. Multi-select tiles use checkbox indicators and stay open after a toggle; absent multi-selection props preserve Add Transaction's existing single-select and auto-close behavior. Retained lazy picker content preserves exit animations.
- Full release checks passed. Native picker interaction remains to be reviewed.


### Settings icon treatment and shared entrances

- Removed decorative Settings-row icon fills while preserving distinct action colors and button touch targets. Renamed Minimal icons to Colored icons throughout visible Settings labels, search, and notices. The existing preference/storage key is retained for backup compatibility.
- Colored icons now remove both fill and outline and preserve the item's own color across category/account tiles, transaction pickers/rows, budget/default controls, entity previews, workspaces, and goal icons.
- SettingsPage supplies a single management-style native entrance timeline to card shells and their rows, including fragment rows. Extended matching card entrances to layout choices, workspace lists, and goals. Returning from nested pages does not restart the mounted Settings timeline; animation preferences remain respected.
- Moved Goals immediately below Budget in the main Settings list and search ordering. Visually verified the main Settings page and row order on Android without changing ledger data. Full release checks, TypeScript and lint passed.


### Button surfaces and transaction inset rows

- Added a shared light-Expressive tonal-button surface that matches the brighter card color. Applied it to the transaction toolbar/search, Home/header controls, month navigation/options, shared modal close/back controls, sort track, alerts, and transaction utility buttons. Navigation surfaces and semantic selected/accent fills retain their roles.
- Transaction rows now use a subtle inset surface blended from 65% card and 35% page in Expressive light mode, rather than reusing the page background. Shared rows in Home and detail sheets inherit the same treatment. Classic and dark treatments are unchanged.
- Full release checks passed, with clean TypeScript/lint and whitespace verification.
