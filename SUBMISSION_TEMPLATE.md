# Submission: [Your Name]

## Time Spent

Total time: **\_\_** (approximate)

- Analysis & triage: **slightly over 1h**. I read README, CONTEXT.md and TICKETS.md in full, checked every ticket against the code and then reproduced the key bugs in the running app before planning anything. Several tickets turned out to have a wrong label, a misleading note or a suggested fix that would not help (details below), and reproducing them corrected a few of my own first reads from the code, so this time decided what was worth fixing at all.

## Ticket Triage

### Triage Overview

**How I prioritized:** the TechStyle demo is the goal, so I ranked tickets by what TechStyle said they care about (CONTEXT.md): 1) reliability - no crashes, accurate pricing, 2) accessibility - WCAG 2.1 AA is in their MSA, 3) performance, 4) UX polish. I didn't trust the board labels, the ticket notes or Marcus's suggested fixes until I had confirmed them in the code and, where possible, in the running app. Within the same tier, smaller must-haves go first, so that the time box can't cut them.

**Planned order** (one branch + PR per ticket, stacked on each other):

| #   | Ticket  | Board label | My read     | Root cause found / reason for the position                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ------- | ----------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | CFG-142 | 🔴 Critical | 🔴 Critical | **Reproduced:** after any change the total stays at `$0.00` and no breakdown is shown. `usePriceCalculation` compares `response.timestamp` (a request counter: 1, 2, 3...) with `Date.now()`, so a response is never applied. `isLoading` is also cleared in `finally` by stale responses, which breaks the existing loading state (see CFG-149), so I fix both here.                                                                                                                                                                                                                                                                                                                                                                                           |
| 2   | CFG-148 | 🔴 Critical | 🔴 Critical | **Reproduced:** white screen with exactly the reported error. Dependent add-on cleanup in `handleOptionChange` only runs for `select` options (the comment says toggles are handled elsewhere - they aren't), so Gift Wrap stays selected after packaging is turned off and the summary renders `availableAddOns.get(id)!.price` for it. The same cleanup also mutates state with `splice`.                                                                                                                                                                                                                                                                                                                                                                     |
| 3   | CFG-147 | 🔴 Critical | 🔴 Critical | **Reproduced:** white screen (`InvalidCharacterError` from `btoa`) as soon as the configuration name contains a character outside Latin1 - the customer's emoji, but also any Polish name such as "Dział IT". So it's not a dev-only flake. `btoa` runs inside a `useEffect` and there's no error boundary. The base64 string also isn't URL-safe, but I couldn't produce a broken link from that with realistic data, so I treat it as hardening, not the root cause.                                                                                                                                                                                                                                                                                          |
| 4   | CFG-145 | 🟠 High     | 🔴 Critical | TechStyle's PM called the hotkey mandatory for the demo. It's small, so it goes before CFG-152 (the biggest and most open-ended item), so the time box can't cut a must-have. The hotkey must reuse the Add to Cart guards: `handleQuickAdd` doesn't check `isPriceLoading`, so as-is it could add a stale price to the cart. See CFG-144 below.                                                                                                                                                                                                                                                                                                                                                                                                                |
| 5   | CFG-152 | ⚪ Low      | 🔴 Critical | Contract risk (accessibility clauses in TechStyle's MSA). Checked each audit point: (1) color swatches are `div`s with `tabIndex -1` - confirmed; (2) `.quantity-btn` has no focus style - confirmed; (3) Escape does nothing while focus is still on the trigger, because focus is never moved into the modal; closing from inside the modal does return focus to the trigger, so this point is only partly accurate; (4) there is no custom dropdown, only native `<select>`s, which already support arrow keys. Extra finding: add-on checkboxes and the packaging toggle have no accessible name (no `<label>` / `aria-labelledby`). Also covers announcing the price loading state to screen readers (`aria-busy` / `aria-live`), moved here from CFG-149. |
| 6   | CFG-143 | 🟠 High     | 🟠 High     | Two suspects, neither proven yet. The `resize` listener is never removed, but it's a single listener that doesn't multiply on resize, so in this app it only leaks when the widget is remounted (e.g. a host page opening and closing it). The stronger suspect: every settled change sets a new cache-busted preview URL (`&t=Date.now()`), so each change downloads a new image that can never be reused (the URL is also malformed - it has two `?`). I start with a heap snapshot to confirm before fixing.                                                                                                                                                                                                                                                 |
| 7   | CFG-151 | 🟡 Medium   | 🟡 Medium   | Map error codes to user-facing messages with a next step. Found while checking: `setError(null)` is never called in the component, so once an error appears it stays on screen until reload. That's worse than the wording, so it gets fixed here too.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 8   | CFG-149 | 🟡 Medium   | 🟡 Medium   | **Resolved by CFG-142, no separate PR.** The dimmed price (`.price-loading`) and the "Calculating..." button already existed and only looked broken because of CFG-142. After that fix both show reliably (checked in the app, also on the first render), which meets the ticket's own acceptance criteria ("just dim the price text"). Screen reader support (`aria-live` / `aria-busy`) isn't in the ticket and is a WCAG requirement, so I moved it to CFG-152. I didn't use Marcus's `'...'` suggestion (layout shift, flicker, nothing for screen readers).                                                                                                                                                                                                |

**Stretch goal:** CFG-150.

**Not planned for this sprint:** CFG-144 (rejected in favour of CFG-145), CFG-154 (escalated to PM/Finance - urgently), CFG-146 (needs a repro), CFG-156 (couldn't reproduce), CFG-153, CFG-155, CFG-157, CFG-158. Reasons are in the tables below.

### Tickets I Addressed

List the ticket numbers you worked on, in the order you addressed them:

1. **CFG-142**: The price is applied again, and only the response for the latest configuration is used. The loading state can no longer be ended by a stale response, so Add to Cart stays disabled until the current price arrives. Details in Issue 1.
2. **CFG-149**: Resolved by the CFG-142 fix, no extra code. The existing dimmed price and "Calculating..." button now show reliably while a price loads, which is what the ticket asks for. Screen reader support for the loading state moved to CFG-152.
3. **CFG-XXX**: [Brief description of what you did]
4. ...

### Tickets I Deprioritized

List tickets you intentionally skipped and why:

| Ticket  | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CFG-144 | Rejected for now, in favour of CFG-145. The two tickets contradict each other: Product wants Quick Add removed (low usage across all customers), while TechStyle - our biggest prospect and the whole reason for the demo (CONTEXT.md) - explicitly confirmed the Quick Add hotkey as **mandatory** for the demo. CFG-145 is also the newer information (4 days vs 1 week old). Removing a feature the demo client wants to showcase would put the deal at risk, and removal is easy to do later, while restoring deleted code is not. I'd raise it with Sarah (Product) and the TechStyle account owner after the demo: maybe Quick Add stays as an enterprise-only feature instead of being sunset globally. |
| CFG-156 | Couldn't reproduce: with the app running, the console shows no missing `key` warnings. Every list already has a key. A few use the index or the name (`key={index}` on swatches, `key={addOn.name}`, `key={i}` in price lines), which is an anti-pattern but harmless for these static lists.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| CFG-158 | The suggested fix does nothing. `product` comes from a module-level constant (`mockProduct`), so its reference is already stable, and `currentConfig` is already wrapped in `useMemo`. The lag on the demo machine is more likely related to CFG-143.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| CFG-153 | A new feature estimated at 2-3 weeks. It doesn't fit a 4h budget or the 2-week demo window, and none of TechStyle's stated priorities depend on it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| CFG-155 | Nice-to-have, and the ticket says so itself. It touches every color in the stylesheet, which carries a lot of regression risk for little demo value compared to the crash, pricing and a11y fixes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| CFG-157 | A valid UX pattern, but not a demo blocker. Side finding: `isDirty` is effectively always `true` (see Things I Noticed), so the destructive "Discard" button shows on a fresh configuration and resets everything without confirmation. Has to be fixed as part of this ticket.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| CFG-150 | Stretch goal, after CFG-143 (same resize handler). Finding: the JS sets `--color-columns`, but `.color-picker` uses `flex-wrap` and never reads that variable, so the column calculation has no effect at all.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Tickets That Need Clarification

List any tickets where you couldn't proceed due to ambiguity:

| Ticket  | Question                                                                                                                                                                                                                                                                                                                      |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CFG-146 | Which screen, browser and timezone show the wrong time, and by how much? Both places in the code use local time (`lastSaved.toLocaleTimeString()` and `new Date(savedAt).toLocaleString()` on an ISO string), so I couldn't confirm a UTC bug from the code. I need a concrete repro from QA (Alex) before changing anything. |

### Tickets With a Misleading Priority Label

Our board labels aren't always right. List tickets where you disagreed with the label (e.g. a Low that's actually High, a High that's actually Low, a Medium that's actually Unclear) and explain why. If you didn't disagree with any, say so.

| Ticket  | Label on board | Your read   | Why                                                                                                                                                                                      |
| ------- | -------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CFG-152 | ⚪ Low         | 🔴 Critical | The ticket itself says Legal flagged it after it was filed: TechStyle's MSA includes accessibility compliance, so shipping without keyboard navigation is arguably a breach of contract. |
| CFG-145 | 🟠 High        | 🔴 Critical | TechStyle's PM confirmed the hotkey as mandatory for the demo, which by the legend means "blocks the demo".                                                                              |
| CFG-144 | 🟠 High        | 🧪 Unclear  | It directly contradicts CFG-145. Removing it would block a feature the demo client wants to showcase.                                                                                    |
| CFG-158 | 🟠 High        | ⚪ Low      | The proposed fix is a no-op (see Deprioritized). "Quick win" is not true here.                                                                                                           |
| CFG-146 | 🟡 Medium      | 🧪 Unclear  | Couldn't confirm in the code. Both timestamps already use local time, so it needs a repro first.                                                                                         |
| CFG-156 | 🟡 Medium      | 🧪 Unclear  | Couldn't reproduce - no `key` warnings in the console.                                                                                                                                   |
| CFG-147 | 🔴 Critical    | 🔴 Critical | The label is right, but the note is misleading: it's not a dev-only flake. `btoa` can't encode characters outside Latin1, reproduced locally.                                            |

### Tickets Where You Stopped to Ask Instead of Implementing

If a ticket was ambiguous enough that the right move was to escalate / ask PM / gather more context rather than ship a fix, list it here. We value this signal — picking one interpretation blindly and shipping it can cost more than stopping to ask.

| Ticket  | Who would you ask | What you'd ask                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CFG-154 | PM + Finance      | "What are the official discount tiers: does qty 50 (and qty 10) already qualify, and is the 50+ tier 10% or 15%?" The sources disagree: the code uses `>` (discount from 51 / 11), CONTEXT.md says 10-49 = 5% and 50+ = 10%, the marketing page says 50+ = 15%, Sarah's Slack says `>` is intentional (possibly about another tier), and the code comment says the boundary should get the higher discount. Changing it either way is a financial decision (customer overcharge vs. lost margin), not a frontend one, so I left the pricing logic untouched. This needs an answer **before** the demo, not after: accurate pricing is TechStyle's #1 priority and they configure high-volume orders. Side note: the UI hint and the price disagree at the boundaries - at qty 9 the UI says "Add 1 more for 5% discount!", but at qty 10 no discount is applied, and at qty 50 the hint already treats the top tier as reached. This part is frontend-only and could be fixed without touching prices (one shared tier check for the price and the hint), but it would lock in whichever comparison is current, so it should wait for the Finance answer. |

---

## Technical Write-Up

### Critical Issues Found

Describe the most important bugs you identified:

#### Issue 1: Price never updates - stuck at $0.00

**Ticket(s):** CFG-142 (also resolves CFG-149: the existing loading state works again)

**What was the bug?**

Two bugs in `usePriceCalculation`:

1. The stale-response guard compared two unrelated numbers. It stored `Date.now()` (about 1.7 trillion) as the latest request and applied a response only if `response.timestamp >= latest`. But `response.timestamp` is the mock API's request counter (1, 2, 3...), so the condition was never true and no price was ever applied.
2. With the comparison fixed, a second bug shows up. The mock answers in 150-800 ms, so responses arrive out of order, and `finally` cleared `isLoading` for every response, stale ones included. Add to Cart got enabled while the current price was still loading, i.e. with the price of an older configuration.

**How did you find it?**

Reproduced in the app: after any change the total stays at `$0.00` and no breakdown is shown, while the API returns real values. So I went to the place where the hook decides whether to apply a response and checked what each side of the condition actually contains. The ticket also mentions a price that "flashes and snaps back to zero". I couldn't reproduce that, and it can't happen with this code, because the price is never set at all. It would fit a real backend whose clock is slightly ahead of the client's - one more reason not to compare client and server values.

**How did you fix it?**

- Stale responses are dropped in the effect cleanup (the standard React pattern for fetching in an effect): when the inputs change or the component unmounts, the in-flight request is marked stale and its result is ignored. No client vs. server comparison at all.
- `isLoading` is derived instead of stored: it's `true` until the shown result belongs to the current pricing inputs (selections, add-ons, quantity). A stale response can't end it early. The first render is already in the loading state too, so the placeholder `$0.00` is dimmed and the button says "Calculating..." until the first price arrives.
- The effect depends only on the inputs that affect the price. The rest of the config is read through `useEffectEvent`, so typing a draft name doesn't send price requests.
- Removed the unused `useDebouncedPriceCalculation`: no callers, and it had the same stale-response flaw.
- After reviewing my own diff I simplified the state in a separate commit: the pricing inputs live in one memoized object (the effect dependency and the key stored with the result, so "is this result current" is a single reference check), the unused `refetch` is gone, and the placeholder total is formatted with the product's currency through the existing `formatPrice` instead of a hard-coded `'$0.00'`.

Verified in the app: 4 series of 6 rapid size/processor changes only ever showed the old (dimmed) price or the final correct one, never an intermediate one, and the loading state never ended early. Quantity, add-on and volume discount totals checked by hand. Typing a draft name doesn't trigger loading. No console errors.

**Why this approach?**

- Fixing only the comparison (e.g. a client-side request counter) would fix the `$0.00`, but keep the loading state as manually toggled flags - the pattern that caused bug 2. It also keeps a synchronous `setIsLoading(true)` in the effect, which the repo's ESLint config rejects (`react-hooks/set-state-in-effect`) and the pre-commit hook blocks. Deriving the loading state removes the whole class of bug, not just this instance.
- `AbortController`: the mock API doesn't accept a signal, changing the API contract is out of scope, and late results would still have to be ignored.
- Debounce: fewer requests, but it doesn't fix ordering - the removed debounced hook had exactly this bug.
- Git history: the pre-commit hook lints whole files, and this file had two existing errors, so no commit could touch it until both were gone. The refactor commit therefore disables the rule on one line, with a TODO, and the fix commit removes the disable. The simplification after self-review is its own refactor commit, so the fix itself stays readable.

---

#### Issue 2: [Title]

[Same structure as above]

---

### Other Changes Made

Brief description of any other modifications:

- CFG-142: removed the unused `useDebouncedPriceCalculation` hook (dead code with the same stale-response bug) and the unused `refetch` from `usePriceCalculation`.
- [Change 2]

---

## Code Quality Notes

### Things I Noticed But Didn't Fix

List any issues you noticed but intentionally left:

| Issue                                                                                                                                                                                                                                                 | Why I Left It                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| "✓ Configuration validated" is shown even when validation fails: `setIsValid(true)` runs after every validation, whatever the result.                                                                                                                 | Misleading status, but Add to Cart is still guarded by `validation.valid`. Not part of any ticket - worth its own ticket.              |
| `isDirty` is effectively always `true`: an effect sets it on mount, and again right after loading or discarding a draft (the effect reacts to the restored selections). Confirmed in the app - "Discard" is visible on a fresh configuration.         | Belongs to CFG-157.                                                                                                                    |
| A shared link drops the configuration name: `decodeConfigurationFromUrl` returns `name`, but the component never applies it.                                                                                                                          | Minor, no ticket asks for it. Could be added while fixing CFG-147 if it stays small.                                                   |
| When a price request fails, the old total stays visible next to the error message (only the breakdown is cleared). The mock `calculatePrice` never rejects, so this path can't be reached in the demo.                                                | Belongs to CFG-151 (error handling). I kept the existing behavior in the CFG-142 fix.                                                  |
| While a new price is loading, the hook still returns the previous `price` (it's shown dimmed). Add to Cart is disabled during loading, but Quick Add isn't and doesn't check `isPriceLoading`, so it can add the old price for the new configuration. | Fixed as part of CFG-145, since the hotkey calls the same handler.                                                                     |
| A price result is matched to the current pricing inputs, not to the `product`. If a host swapped the `product` prop without changing the selections, the old product's price would briefly count as current.                                          | Can't happen in this app (`product` is a module constant). One extra field in the result if the widget ever gets a switchable product. |
| The repo ships with ESLint errors (`ProductConfigurator.tsx`, `types.ts`), so `pnpm lint` fails on a clean checkout and the pre-commit hook blocks any commit that touches those files.                                                               | Each ticket that touches one of these files has to make that file lint-clean first. A full cleanup isn't part of any ticket.           |

### Potential Improvements for the Future

If you had more time, what would you improve?

1. [Improvement 1]
2. [Improvement 2]

---

## Questions for the Team

Questions you would ask in a real scenario:

1. [Question 1]
2. [Question 2]

---

## Assumptions Made

List any assumptions you made to proceed:

1. **pnpm is the required package manager, not optional.** The README lists "pnpm (or npm/yarn)", but the repo ships `pnpm-lock.yaml` and `pnpm-workspace.yaml`, and the `lefthook.yml` pre-commit hooks call `pnpm exec prettier` / `pnpm exec eslint`. With npm or yarn the lockfile would be ignored (different dependency versions) and every commit would fail on the hook. I used pnpm. The README could drop the "or npm/yarn" part, or the hooks could use a package-manager-agnostic command.
2. **Node.js 22.13+ is the real minimum.** The invitation email mentions Node 18+, while the README, `package.json` (`engines.node: >=22.13.0`) and `.nvmrc` (`24`) require 22.13+ / 24. I treated the repo as the source of truth and worked on Node 24.

---

## Self-Assessment

### What went well?

[Your reflection]

### What was challenging?

[Your reflection]

### What would you do differently with more time?

[Your reflection]

---

## AI Assistance Notes (optional)

If you used AI tools (Copilot, Claude, Cursor, ChatGPT, etc.), we'd love a short note on how. **We don't score the fact that you used AI — we score the quality of your reasoning and verification.**

Useful things to share:

- What kinds of prompts you sent (paraphrase is fine, no need to paste logs)
- Where the AI helped and where you overrode it
- Anything the AI suggested that you rejected — and why
- Anything you verified manually that the AI got wrong

---

## Additional Notes

Anything else you want us to know:

[Your notes]
