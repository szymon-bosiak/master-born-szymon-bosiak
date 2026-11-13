# Submission: Szymon Bosiak

## Time Spent

Total time: **about 4.5h** (approximate)

- Analysis & triage: **slightly over 1h**. I read README, CONTEXT.md and TICKETS.md in full, checked every ticket against the code and then reproduced the key bugs in the running app before planning anything. Several tickets turned out to have a wrong label, a misleading note or a suggested fix that would not help (details below), and reproducing them corrected a few of my own first reads from the code, so this time decided what was worth fixing at all.
- CFG-142, CFG-148, CFG-147: **about 2.5h**, including checking each fix in the running app and writing it up.
- CFG-145 and finishing this document: **about 1h**.

That's about half an hour over the 4h budget. I finished CFG-145 properly (a must-have for the demo) instead of starting CFG-152 and leaving it half done, and stopped there.

## Ticket Triage

### Triage Overview

**How I prioritized:** the TechStyle demo is the goal, so I ranked tickets by what TechStyle said they care about (CONTEXT.md): 1) reliability - no crashes, accurate pricing, 2) accessibility - WCAG 2.1 AA is in their MSA, 3) performance, 4) UX polish. I didn't trust the board labels, the ticket notes or Marcus's suggested fixes until I had confirmed them in the code and, where possible, in the running app. Within the same tier, smaller must-haves go first, so that the time box can't cut them.

**Planned order** (one branch + PR per ticket, stacked on each other):

| #   | Ticket  | Board label | My read     | Root cause found / reason for the position                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ------- | ----------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | CFG-142 | 🔴 Critical | 🔴 Critical | **Reproduced:** after any change the total stays at `$0.00` and no breakdown is shown. `usePriceCalculation` compares `response.timestamp` (a request counter: 1, 2, 3...) with `Date.now()`, so a response is never applied. `isLoading` is also cleared in `finally` by stale responses, which breaks the existing loading state (see CFG-149), so I fix both here.                                                                                                                                                                                                                                                                                                                                                                                           |
| 2   | CFG-148 | 🔴 Critical | 🔴 Critical | **Reproduced:** white screen with exactly the reported error. Dependent add-on cleanup in `handleOptionChange` only runs for `select` options (the comment says toggles are handled elsewhere - they aren't), so Gift Wrap stays selected after packaging is turned off and the summary renders `availableAddOns.get(id)!.price` for it. The same cleanup also mutates state with `splice`.                                                                                                                                                                                                                                                                                                                                                                     |
| 3   | CFG-147 | 🔴 Critical | 🔴 Critical | **Reproduced:** two root causes. 1) White screen (`InvalidCharacterError` from `btoa`) as soon as the configuration name contains a character outside Latin1 - the customer's emoji, but also any Polish name such as "Dział IT". So it's not a dev-only flake. `btoa` runs inside a `useEffect` and there's no error boundary. 2) The base64 string isn't URL-safe: a `+` turns into a space in the query string, so some links can't be decoded and the widget silently shows the defaults ("loads the wrong configuration"), e.g. the plain ASCII name "Team >10". In triage I filed 2) as hardening; checking it systematically while planning the fix proved it's a real cause.                                                                            |
| 4   | CFG-145 | 🟠 High     | 🔴 Critical | TechStyle's PM called the hotkey mandatory for the demo. It's small, so it goes before CFG-152 (the biggest and most open-ended item), so the time box can't cut a must-have. The hotkey must reuse the Add to Cart guards: `handleQuickAdd` doesn't check `isPriceLoading`, so as-is it could add a stale price to the cart. See CFG-144 below.                                                                                                                                                                                                                                                                                                                                                                                                                |
| 5   | CFG-152 | ⚪ Low      | 🔴 Critical | Contract risk (accessibility clauses in TechStyle's MSA). Checked each audit point: (1) color swatches are `div`s with `tabIndex -1` - confirmed; (2) `.quantity-btn` has no focus style - confirmed; (3) Escape does nothing while focus is still on the trigger, because focus is never moved into the modal; closing from inside the modal does return focus to the trigger, so this point is only partly accurate; (4) there is no custom dropdown, only native `<select>`s, which already support arrow keys. Extra finding: add-on checkboxes and the packaging toggle have no accessible name (no `<label>` / `aria-labelledby`). Also covers announcing the price loading state to screen readers (`aria-busy` / `aria-live`), moved here from CFG-149. |
| 6   | CFG-143 | 🟠 High     | 🟠 High     | Two suspects, neither proven yet. The `resize` listener is never removed, but it's a single listener that doesn't multiply on resize, so in this app it only leaks when the widget is remounted (e.g. a host page opening and closing it). The stronger suspect: every settled change sets a new cache-busted preview URL (`&t=Date.now()`), so each change downloads a new image that can never be reused (the URL is also malformed - it has two `?`). I start with a heap snapshot to confirm before fixing.                                                                                                                                                                                                                                                 |
| 7   | CFG-151 | 🟡 Medium   | 🟡 Medium   | Map error codes to user-facing messages with a next step. Found while checking: `setError(null)` is never called in the component, so once an error appears it stays on screen until reload. That's worse than the wording, so it gets fixed here too.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 8   | CFG-149 | 🟡 Medium   | 🟡 Medium   | **Resolved by CFG-142, no separate PR.** The dimmed price (`.price-loading`) and the "Calculating..." button already existed and only looked broken because of CFG-142. After that fix both show reliably (checked in the app, also on the first render), which meets the ticket's own acceptance criteria ("just dim the price text"). Screen reader support (`aria-live` / `aria-busy`) isn't in the ticket and is a WCAG requirement, so I moved it to CFG-152. I didn't use Marcus's `'...'` suggestion (layout shift, flicker, nothing for screen readers).                                                                                                                                                                                                |

**Stretch goal:** CFG-150.

**Status at the end of the time box:** 1-4 are done, and 8 is resolved by 1. 5-7 and the stretch goal are not done. CFG-152 is the most important open item before the demo (contract risk), so it should be next, then CFG-143 (heap snapshot first). The findings in the table above are meant as a handoff for both.

**Not planned for this sprint:** CFG-144 (rejected in favour of CFG-145), CFG-154 (escalated to PM/Finance - urgently), CFG-146 (needs a repro), CFG-156 (couldn't reproduce), CFG-153, CFG-155, CFG-157, CFG-158. Reasons are in the tables below.

### Tickets I Addressed

List the ticket numbers you worked on, in the order you addressed them:

1. **CFG-142**: The price is applied again, and only the response for the latest configuration is used. The loading state can no longer be ended by a stale response, so Add to Cart stays disabled until the current price arrives. Details in Issue 1.
2. **CFG-149**: Resolved by the CFG-142 fix, no extra code. The existing dimmed price and "Calculating..." button now show reliably while a price loads, which is what the ticket asks for. Screen reader support for the loading state moved to CFG-152.
3. **CFG-148**: Turning off "Include Packaging" no longer crashes the widget. Add-ons whose requirement stops being met are now deselected for every option type (before only dropdowns did this), so Gift Wrap is removed and no longer charged. The summary can no longer crash on an inconsistent add-on list (e.g. from a share link). Details in Issue 2.
4. **CFG-147**: Share links work for any configuration name (emoji, Polish letters) and no longer break when the encoded data contains a `+`. Links shared before the fix still open. Opening a link restores the name, drops values the product doesn't allow (e.g. Gift Wrap without packaging) and shows an error instead of silently loading the defaults when the link is broken. Details in Issue 3.
5. **CFG-145**: Ctrl+Enter (Cmd+Enter on Mac) runs Quick Add whenever focus is inside the widget or nowhere on the page (e.g. right after it loads), and the button shows the shortcut. Quick Add now has the same guards as Add to Cart, so it can no longer add the previous configuration's price while a new one is loading. Details in Issue 4.

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

| Ticket  | Label on board | Your read   | Why                                                                                                                                                                                                          |
| ------- | -------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CFG-152 | ⚪ Low         | 🔴 Critical | The ticket itself says Legal flagged it after it was filed: TechStyle's MSA includes accessibility compliance, so shipping without keyboard navigation is arguably a breach of contract.                     |
| CFG-145 | 🟠 High        | 🔴 Critical | TechStyle's PM confirmed the hotkey as mandatory for the demo, which by the legend means "blocks the demo".                                                                                                  |
| CFG-144 | 🟠 High        | 🧪 Unclear  | It directly contradicts CFG-145. Removing it would block a feature the demo client wants to showcase.                                                                                                        |
| CFG-158 | 🟠 High        | ⚪ Low      | The proposed fix is a no-op (see Deprioritized). "Quick win" is not true here.                                                                                                                               |
| CFG-146 | 🟡 Medium      | 🧪 Unclear  | Couldn't confirm in the code. Both timestamps already use local time, so it needs a repro first.                                                                                                             |
| CFG-156 | 🟡 Medium      | 🧪 Unclear  | Couldn't reproduce - no `key` warnings in the console.                                                                                                                                                       |
| CFG-147 | 🔴 Critical    | 🔴 Critical | The label is right, but the note is misleading: it's not a dev-only flake. `btoa` can't encode characters outside Latin1 (reproduced locally), and a `+` in the base64 breaks some links in any environment. |

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

#### Issue 2: Crash when deselecting "Include Packaging"

**Ticket(s):** CFG-148

**What was the bug?**

Three problems in `ProductConfigurator.tsx` that together give the white screen:

1. `handleOptionChange` removed dependent add-ons only for `select` options. The comment said toggles are handled in `handleAddOnToggle`, but they aren't - that handler only guards selecting an add-on, not changing the option it depends on. So Gift Wrap (requires "Include Packaging") stayed selected after packaging was turned off.
2. The cleanup that did run mutated state: `selectedAddOns.splice(...)` and then `setSelectedAddOns` with the same array. React sees the same reference, and the handler read `selectedAddOns` from its closure, so it could work on an outdated list.
3. The crash itself: the summary read each selected add-on's price with `availableAddOns.get(id)!.price`. `availableAddOns` only holds add-ons whose requirement is met, so for Gift Wrap it returned `undefined`. It was the wrong lookup - the summary needs the price of what's selected, availability doesn't matter there.

Because of point 3 the same crash could also be hit without the toggle, e.g. by a share link with Gift Wrap but no packaging.

**How did you find it?**

Reproduced with the ticket steps during triage - exactly the reported error. The error points to a `.price` read, and the only unsafe one is the summary's non-null assertion on `availableAddOns`. Then the real question was why an add-on that isn't available is still selected, which led to the `select`-only cleanup in `handleOptionChange`.

**How did you fix it?**

- `handleOptionChange` now deselects dependent add-ons for every option type, in one functional state update that returns a new array (no mutation, no closure over `selectedAddOns`). It only needs the changed option and its new value. If nothing is removed, the same array is returned, so there's no extra render.
- The summary looks up add-ons in `product.addOns`, the same way `utils/pricing.ts` does, so the summary always matches the computed price. The now unused `availableAddOns` memo is removed. The selected add-ons are resolved once and that list drives both the count and the prices, so an id the product doesn't know (e.g. from an old share link) is neither counted nor shown. I found this mismatch when I reviewed my own diff, and fixed it in its own commit.

Verified in the app: the ticket steps no longer crash, Gift Wrap is unchecked and disabled, the total drops by exactly $14.99 and the summary updates. Turning packaging back on doesn't bring Gift Wrap back. The dropdown dependency (Premium Engraving needs Aluminum) still works. A crafted share link with Gift Wrap but no packaging renders, the summary matches the price, and Add to Cart / Quick Add stay disabled until packaging is turned on. No console errors.

**Why this approach?**

- Fixing only the summary would hide the crash but keep Gift Wrap in the configuration, so the customer would still be charged for gift wrapping without packaging. The invalid state has to be removed where it's created.
- I didn't derive "effective" add-ons (selected ones filtered by availability). Then Gift Wrap would silently come back - and be charged again - when packaging is turned back on, which the user didn't ask for.
- The summary fix stays anyway as defense in depth: state can also come from outside (share link, draft), and a wrong add-on list should never white-screen the widget. Validation already blocks checkout for it.
- Git history: the pre-commit hook lints the whole file, and `ProductConfigurator.tsx` had 4 existing errors from other tickets, so a separate refactor commit made the file lint-clean first without changing behavior (a comment in the empty `catch`, and three single-line disables with a TODO naming the ticket that should fix each one: CFG-147, CFG-157). The two fixes are separate commits: the root cause first, then the defensive summary change.

---

#### Issue 3: Share link broken for some configurations

**Ticket(s):** CFG-147

**What was the bug?**

Two independent bugs in `encodeConfigurationToUrl` / `decodeConfigurationFromUrl` (`services/api.ts`), which is why the ticket looked random:

1. `btoa` only accepts Latin1 characters. Any configuration name with an emoji or a Polish letter such as "ł" threw `InvalidCharacterError` in the effect that built the share URL, and with no error boundary the widget went white as soon as the customer clicked Share.
2. Standard base64 uses `+`, `/` and `=`, and the code put it into the query string unescaped. `URLSearchParams` decodes `+` as a space, so whenever the encoded data happened to contain a `+`, the link decoded to garbage: `atob` or `JSON.parse` failed, the decoder returned `null` and the widget silently showed the default configuration. Whether a `+` appears depends on the exact bytes and their position: "Team >10" breaks (plain ASCII, so links broke this way even before the emoji problem), "Budget ~2k" doesn't. That's the "loads the wrong configuration" part of the ticket, and why it couldn't be reproduced consistently.

On top of that, opening a link had no checks at all: selections, add-ons and quantity were restored as they were (e.g. Gift Wrap without packaging, or a quantity above the limit), an add-on list that wasn't an array crashed the summary, and the name in the link was never applied.

**How did you find it?**

The customer's name contains an emoji, so the encoder was the first suspect, and `btoa("Żółć test 🎨")` throws right away - in dev and in a production build alike. In triage I filed the missing URL escaping as hardening, because I couldn't produce a broken link. While planning the fix I checked it systematically in Node (encode, pass through `URLSearchParams`, decode) over many names: with UTF-8 bytes a `+` shows up regularly (an emoji at certain positions), and so does it in ASCII names like "Team >10". So it's a second root cause, and I corrected my triage note.

The ticket's example (10" Large, Blue (Custom #3), quantity 5) comes from `mockProductSimple`, which the app doesn't render. Next to the `10" Large` choice there's a comment saying that label "will break URL sharing". That's a red herring: only option values (`10_large`, `blue_custom_3`) go into the link, never labels. The name is the only free text in it.

**How did you fix it?**

- The link is now UTF-8 JSON encoded as base64url without padding (`TextEncoder` + `btoa`, then `-` / `_` instead of `+` / `/`), so it contains only URL-safe characters for any text.
- Decoding stays backward compatible: it accepts both alphabets, turns a space back into `+` (this repairs old links that were mangled in the query string) and falls back to Latin1 when the bytes aren't valid UTF-8 (old links with e.g. "Café").
- The starting configuration is treated as untrusted input - the share link, or `initialConfiguration` when there's no link (either can be crafted or outdated). One sanitize step starts from the product defaults, keeps only known options with an available value and only known add-ons whose dependency is met (the same rule as `handleOptionChange` since CFG-148), and clamps the quantity with a helper now shared with the quantity input. Partial selections are now merged over the defaults instead of replacing them.
- A link that can't be decoded shows the existing error banner with its own code (`ERR_INVALID_SHARE_LINK`) instead of silently loading the defaults. The wording belongs to CFG-151.
- The name from the link is restored into the draft name field.
- The shared configuration is read once in the initial state instead of a mount effect, so the first render already shows it. Before, every link first rendered the defaults and requested their price, validation and preview. The share URL is derived while the modal is open instead of copied into state. Together this removed both `set-state-in-effect` disables left with TODO(CFG-147) in CFG-148.
- After reviewing my own diff I made two changes in separate commits: the sanitize step first covered only share links, so I extended it to `initialConfiguration` (one step for every starting configuration also replaced three `||` fallback chains per field), and the broken link first used the generic `ERR_UNKNOWN`, so I gave it its own code. That needed `types.ts` lint-clean first, done in its own refactor commit.

Verified in the app: with the customer's name, Share opens without a crash and the link restores quantity, price and name. An old-format link with a `+` (broken before) loads correctly. A crafted link with Gift Wrap without packaging, an unknown processor, an unknown and a duplicated add-on and quantity 5000 loads as a valid configuration (Gift Wrap and unknown values dropped, i5, quantity 999) with a hand-checked price. An invalid `initialConfiguration` (tested with a temporary prop in `App.tsx`) is sanitized the same way. Wrong data types fall back to the defaults, and `?config=abc` shows the error banner with `ERR_INVALID_SHARE_LINK`. Node round-trip checks (9 names, 3 old links) pass. No console errors apart from the existing decode log for the broken link.

**Why this approach?**

- `encodeURIComponent` around the old base64 would fix bug 2 but not bug 1. `encodeURIComponent` on the JSON alone would work, but makes links much longer with non-ASCII names. base64url fixes both, keeps links short and is the standard format for this.
- `Uint8Array.prototype.toBase64` with the base64url alphabet would be shorter code, but it's only been in all major browsers since late 2025, the widget runs on customers' sites in browsers we don't control, and it isn't in the project's `ES2022` lib types.
- Keeping old links working matters: the ticket is about links customers already sent around, and a plain format change would break every existing link at once.
- Sanitizing on load instead of relying on validation: validation blocks checkout, but leaves the customer looking at a configuration the UI can't produce, and the CFG-148 summary change only stopped the crash. Invalid state is removed where it enters the app, the same reasoning as in CFG-148.
- Git history: the encoding fix comes first and alone, because it's the root cause and the smallest unit to revert. The two refactors (no behavior change) come next, so the remaining fixes are small diffs on top of the initial state. The changes from my self-review come last.

---

#### Issue 4: Quick Add keyboard shortcut

**Ticket(s):** CFG-145 (CFG-144 rejected, see Deprioritized)

**What was the bug?**

The ticket is a feature request, but the feature it extends had a bug: `handleQuickAdd` had no guards, and its button was disabled only for read-only mode and a failed validation. While a new price is loading, `usePriceCalculation` still returns the previous `price` (shown dimmed), so Quick Add could add the old configuration's price to the cart. Add to Cart had the extra `isPriceLoading` check, Quick Add didn't. A hotkey that calls the same handler would make this even easier to hit. The disabled Quick Add button also looked exactly like the enabled one.

**How did you find it?**

While triaging CFG-145 I compared the two cart buttons, since the hotkey had to behave like one of them. Before writing the listener I also checked what Ctrl+Enter already does inside the widget: Enter clicks a focused `<button>`, and the packaging switch's own `onKeyDown` reacts to Enter with any modifier. So a plain bubbling listener would add twice (button click + shortcut), or toggle packaging and then add the configuration from before the toggle. Color swatches and add-on rows aren't focusable, so a click on them moves focus to `<body>`, out of the widget. Right after the page loads nothing has focus either, so key events go to `<body>` as well. I missed that case at first and only found it by testing the finished branch.

**How did you fix it?**

- One derived `canAddToCart` (not read-only, validation passed, the price is current and present) disables both buttons, and one handler shared by Add to Cart, Quick Add and the shortcut checks it again, because a shortcut bypasses `disabled`. The two buttons can't drift apart again, and that drift was the bug. A disabled Quick Add now looks disabled.
- The shortcut is Ctrl+Enter, plus Cmd+Enter for Mac users. It works the same on every keyboard layout, including Polish, which matters here (the CFG-147 customer is Polish): it only checks the Enter key and the modifier flags, and none of them depend on the layout. Only AltGr+Enter is ignored: Windows reports AltGr as Ctrl+Alt, so without the Alt check the right Alt key would add to the cart too. Shift+Ctrl+Enter is ignored as well.
- It listens on the document, but reacts only when focus is inside the widget or nowhere (`<body>`: right after the page loads, or after a click on something that can't take focus, like a swatch). A focused element of the host page keeps its own Ctrl+Enter.
- It runs in the capture phase, before the focused control: `preventDefault` stops a focused button's own Enter click, and `stopPropagation` keeps the packaging switch's handler from also running.
- It's ignored while the Drafts or Share modal is open (typing a draft name must not add to the cart behind the modal), and holding the keys adds once (`e.repeat`).
- The button shows a `Ctrl+Enter` hint, and `aria-keyshortcuts` exposes the shortcut to screen readers. The visible hint is `aria-hidden`, so the button's name isn't read twice.

Verified in the app with real key presses (adds counted through a stubbed `alert`): right after the page loads, after a click outside the widget, after clicking a swatch, with Add to Cart focused and with the packaging switch focused, Ctrl+Enter adds exactly once, and packaging doesn't change. With a text field outside the widget focused (added temporarily), it adds nothing and the field gets its Enter. Plain Enter still toggles the switch. Right after a size change the shortcut and the button do nothing until the new price arrives, then add once with the new total. Held keys add once, and Ctrl+Enter in the draft name field adds nothing. Key events shaped like the ones Windows sends: left Ctrl, right Ctrl and numpad Enter each add once, AltGr+Enter (Ctrl+Alt) adds nothing. There are no console errors.

**Why this approach?**

- Widget or nothing focused, instead of a plain `window` listener: the widget is embedded via iframe or directly into a customer's page (CONTEXT.md). A plain `window` listener would take Ctrl+Enter from the host page's own focused fields in a direct integration, e.g. a chat box where it means "send". My first version listened only on the widget and missed the most common case: nobody clicks into the widget before pressing the shortcut. When nothing has focus, no control is waiting for the key, so the widget takes it. Whether that's fine for TechStyle's page is in Questions for the Team.
- A guard in the handler instead of only `disabled` on the button: a shortcut never looks at the button, so every way into the action has to pass the same check.
- I didn't queue a shortcut press that comes while the price is loading. It would have to decide what happens if the configuration changes again in the meantime, and the dimmed price and button already show why nothing happened. Noted in Things I Noticed.
- Git history: the guard fix comes first and alone, because it's a bug on its own, even without the shortcut. The shortcut and its visible hint are separate commits.
- After reviewing my own diff and testing the finished branch I made three more commits. Add to Cart still had its own handler with its own guards, so the drift was still possible in the handlers: now there is one handler, and its unreachable validation error branch is gone. The first version made the widget's root focusable (`tabIndex={-1}`) so a click on a swatch kept focus inside, and that root got a focus ring around the whole widget after a plain key press, which I fixed first. Then testing showed the bigger problem: right after the page loads the shortcut did nothing, which is exactly how a demo starts. The listener moved to the document (widget or nothing focused), and the focusable root, with its focus-ring fix, is gone.

---

### Other Changes Made

Brief description of any other modifications:

- CFG-142: removed the unused `useDebouncedPriceCalculation` hook (dead code with the same stale-response bug) and the unused `refetch` from `usePriceCalculation`.
- CFG-148: made `ProductConfigurator.tsx` lint-clean without changing behavior, so commits touching it pass the pre-commit hook. The empty validation `catch` got a comment (TODO(CFG-151)), and the three `set-state-in-effect` errors got single-line disables with a TODO for the ticket that owns them (CFG-157 for `isDirty`, CFG-147 for the share URL and reading a shared config).
- CFG-147: removed both CFG-147 disables by deriving the share URL and reading the share link in the initial state (only the CFG-157 one is left). Extracted `clampQuantity`, now used by the quantity input and by the starting configuration. Made `types.ts` lint-clean (`any` to `unknown` in the unused `ConfigChangeEvent`) to add the new error code, so `pnpm lint` now passes for the whole repo.
- CFG-145: Add to Cart now uses the same `canAddToCart` check and the same handler as Quick Add. That also disables it when there is no price at all (a failed request) instead of leaving a button that does nothing, and removed an error branch that the disabled button made unreachable. Added a disabled style for the Quick Add button.

---

## Code Quality Notes

### Things I Noticed But Didn't Fix

List any issues you noticed but intentionally left:

| Issue                                                                                                                                                                                                                                                   | Why I Left It                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "✓ Configuration validated" is shown even when validation fails: `setIsValid(true)` runs after every validation, whatever the result.                                                                                                                   | Misleading status, but Add to Cart is still guarded by `validation.valid`. Not part of any ticket - worth its own ticket.                                                                                                                           |
| `isDirty` is effectively always `true`: an effect sets it on mount, and again right after loading or discarding a draft (the effect reacts to the restored selections). Confirmed in the app - "Discard" is visible on a fresh configuration.           | Belongs to CFG-157.                                                                                                                                                                                                                                 |
| When a price request fails, the old total stays visible next to the error message (only the breakdown is cleared). The mock `calculatePrice` never rejects, so this path can't be reached in the demo.                                                  | Belongs to CFG-151 (error handling). I kept the existing behavior in the CFG-142 fix.                                                                                                                                                               |
| A price result is matched to the current pricing inputs, not to the `product`. If a host swapped the `product` prop without changing the selections, the old product's price would briefly count as current.                                            | Can't happen in this app (`product` is a module constant). One extra field in the result if the widget ever gets a switchable product.                                                                                                              |
| The repo ships with ESLint errors (`ProductConfigurator.tsx`, `types.ts`), so `pnpm lint` fails on a clean checkout and the pre-commit hook blocks any commit that touches those files.                                                                 | Each ticket that touches one of these files has to make that file lint-clean first. A full cleanup isn't part of any ticket. `ProductConfigurator.tsx` is clean since CFG-148 and `types.ts` since CFG-147, so `pnpm lint` passes from CFG-147 on.  |
| A draft is restored as stored (`handleLoadDraft`), without the checks a share link and `initialConfiguration` now get. If the product changes (e.g. a choice is removed), an old draft can bring back values the UI can't produce.                      | Not part of CFG-147 (share links). `sanitizeConfiguration` could be reused in `handleLoadDraft` as is.                                                                                                                                              |
| A broken share link has its own code (`ERR_INVALID_SHARE_LINK`), but the banner still says "Please try again", which can't help here, and like every error it never clears.                                                                             | Wording and clearing belong to CFG-151.                                                                                                                                                                                                             |
| The widget reads the share link from `window.location` during its first render. A server-rendered host page (direct integration) would fail on `window`, and a host page that uses its own `config` query parameter would have it read as a share link. | The demo is client-only, so I kept the link handling inside the widget. Question for the team: is the widget ever server-rendered? If so, the host should read the link and pass it as `initialConfiguration`, which is now sanitized the same way. |
| The share URL is built from `origin + pathname`, so other query parameters or a hash on the host page (e.g. a product id) are dropped from the link.                                                                                                    | Existing behavior, kept in CFG-147. `new URL(window.location.href)` with `searchParams.set('config', ...)` would keep them, but I'd want a real host page to test it against.                                                                       |
| Option-level dependencies (`ProductOption.dependsOn`) are checked by validation, but not removed when a configuration is loaded or an option changes (only add-on dependencies are).                                                                    | No product uses them today. If one does, the same sanitize step and `handleOptionChange` should cover them.                                                                                                                                         |
| The packaging toggle's `onKeyDown` ignores `readOnly`: in read-only mode the mouse can't change it, but Enter / Space can.                                                                                                                              | Not part of CFG-148. Small, fits CFG-152 (keyboard handling) when the toggle gets a proper accessible name.                                                                                                                                         |
| Both cart actions trust the latest validation result, but it isn't tied to the configuration it was made for, so right after a change it may still describe the previous one.                                                                           | Not reachable today: the mock validates in 50-150 ms and prices in 150-800 ms, so validation is current by the time the cart unlocks, and since CFG-147/148 the UI can't produce an invalid configuration. A real backend has no such guarantee.    |
| The Quick Add shortcut does nothing while the price is loading (e.g. pressed right after typing a quantity), with no message.                                                                                                                           | Same as the disabled button, and the dimmed price shows why. If users find it confusing, the press could be announced or queued until the price arrives.                                                                                            |
| A disabled add-on says "(Requires include_packaging)" - a raw option id instead of the option's name.                                                                                                                                                   | User-facing wording, fits CFG-151.                                                                                                                                                                                                                  |

### Potential Improvements for the Future

If you had more time, what would you improve?

1. Unit tests for the share link encoding (round trip, `+` turned into a space, links from before CFG-147). They're pure functions with tricky edge cases, and I could only check them with an ad hoc Node script, because the repo has no test runner yet. Vitest would fit the existing Vite setup.
2. More tests where bugs actually happened: out-of-order price responses in `usePriceCalculation` (fake timers), and `sanitizeConfiguration` / the add-on dependency rule.
3. An error boundary around the widget. CFG-147 and CFG-148 both ended in a white screen on the customer's page. A widget embedded in someone else's site should fail inside its own box, with a message.
4. One pattern for async results tied to the configuration they belong to. The price hook does this since CFG-142, but validation and preview each repeat their own `cancelled` flag, and validation isn't tied to its configuration (see Things I Noticed).
5. Split `ProductConfigurator` (about 1000 lines) into options, add-ons, price panel and modals, once there are tests to catch regressions. A real modal component (focus trap, `role="dialog"`, focus returned to the trigger) would also cover part of CFG-152.

---

## Questions for the Team

Questions you would ask in a real scenario:

1. **PM + Finance (before the demo):** what are the official quantity discount tiers? Details under CFG-154 in "Stopped to Ask".
2. **Sarah (Product) + the TechStyle account owner:** Quick Add is removed (CFG-144) or kept with a hotkey (CFG-145)? Could it stay as an enterprise-only feature?
3. **TechStyle / whoever sets up the demo:** is the widget embedded via iframe or directly into the page? The Quick Add shortcut reacts when focus is inside the widget or nowhere on the page, and never takes Ctrl+Enter from a focused field of the host page. In a direct integration, a host page with its own page-wide Ctrl+Enter shortcut would lose it while nothing has focus. Is that acceptable?
4. **QA (Alex):** a concrete repro for CFG-146 (screen, browser, timezone, how far off).
5. **Engineering:** is the widget ever server-rendered? It reads the share link from `window.location` during its first render (see Things I Noticed).

---

## Assumptions Made

List any assumptions you made to proceed:

1. **pnpm is the required package manager, not optional.** The README lists "pnpm (or npm/yarn)", but the repo ships `pnpm-lock.yaml` and `pnpm-workspace.yaml`, and the `lefthook.yml` pre-commit hooks call `pnpm exec prettier` / `pnpm exec eslint`. With npm or yarn the lockfile would be ignored (different dependency versions) and every commit would fail on the hook. I used pnpm. The README could drop the "or npm/yarn" part, or the hooks could use a package-manager-agnostic command.
2. **Node.js 22.13+ is the real minimum.** The invitation email mentions Node 18+, while the README, `package.json` (`engines.node: >=22.13.0`) and `.nvmrc` (`24`) require 22.13+ / 24. I treated the repo as the source of truth and worked on Node 24.

---

## Self-Assessment

### What went well?

- Checking every ticket in the code and in the running app before trusting it. It changed the plan several times: CFG-147 isn't a dev-only flake, Marcus's fix for CFG-158 does nothing, CFG-149 was a symptom of CFG-142, CFG-156 couldn't be reproduced at all, and CFG-152's real priority was hidden in its notes.
- Fixing root causes instead of symptoms: the stale price logic replaced instead of patched, the invalid add-on removed where it's created (not only hidden in the summary), and the starting configuration treated as untrusted input.
- Verifying each fix in the app, including the edge cases (out-of-order responses, old share links, crafted links), and writing down what I checked.
- A history that's easy to review: one stacked PR per ticket, refactors without behavior change separated from fixes, and the docs in their own commits.

### What was challenging?

- Time. Triage took over an hour, and the repo ships with lint errors that the pre-commit hook enforces, so most tickets needed a cleanup commit before the actual fix.
- Contradictory or messy tickets (CFG-144 vs CFG-145, CFG-154) where the right move was a decision or a question, not code.
- Being wrong in my own triage: I first filed the `+` in share links as hardening, and only a systematic check while planning the fix showed it was a second root cause. I corrected the note instead of hiding it.

### What would you do differently with more time?

- Do CFG-152 next. It's the biggest risk left for the demo, and I'd rather ship it before any polish.
- Set up Vitest at the start. Several fixes are pure functions with tricky edge cases that I could only check with ad hoc scripts.
- Time-box triage harder and ask the questions about CFG-144 / CFG-154 on day one, in parallel with the fixes.

---

## AI Assistance Notes (optional)

If you used AI tools (Copilot, Claude, Cursor, ChatGPT, etc.), we'd love a short note on how. **We don't score the fact that you used AI — we score the quality of your reasoning and verification.**

Useful things to share:

- What kinds of prompts you sent (paraphrase is fine, no need to paste logs)
- Where the AI helped and where you overrode it
- Anything the AI suggested that you rejected — and why
- Anything you verified manually that the AI got wrong

I worked with Claude Code (Claude) as a pair programmer for the whole task.

- **How:** for each ticket I asked it to check the ticket against the code, reproduce it in the browser. I proposed a plan fro Claude to validate and refine (root cause, commit split). I reviewed the plan, then had it prepare one commit at a time with build and lint run. I reviewed each diff and made every commit myself. It also drafted parts of this document, which I edited.
- **Where I steered it:** the workflow (stacked PRs, conventional commits with the ticket id), the priorities (TechStyle first, CFG-144 rejected), and the rule that nothing counts as fixed until it's checked in the running app, not only in the code. I carefully reviewed each change and highlighted anything that seemed suspicious or caught my attention.
- **What verification caught:** first reads of the code that reproducing in the app corrected (e.g. the `+` in share links first filed as hardening). A lint run that looked clean but was a false pass: a `return` inside `try/finally` made the React Compiler skip the function, so `react-hooks/set-state-in-effect` never ran on it. We confirmed real results with a deliberate canary error. And when I tested the finished shortcut myself, Ctrl+Enter did nothing right after the page loaded: all of the AI's browser checks had started with a click inside the widget. The fix also made the design simpler (Issue 4).
- **Rejected:** the ticket's own suggested fixes (Marcus's `'...'` for CFG-149, `useMemo` for CFG-158), and shortcuts that would have hidden symptoms instead of fixing causes, e.g. only guarding the summary in CFG-148.

---

## Additional Notes

Anything else you want us to know:

- **How to review:** the work is a stack of PRs, one per ticket, each based on the previous branch, so each PR shows only its own ticket's diff. Review order: #1 CFG-142 (base `main`) -> #2 CFG-148 -> #4 CFG-147 -> CFG-145 (the last PR). This document is complete on the last branch.
- **Checks:** `pnpm build` passes and `pnpm lint` has 0 errors on the last branch. On the branches below CFG-147, lint still reports the two `types.ts` errors the repo shipped with (fixed in CFG-147). One warning is left (`react-hooks/exhaustive-deps` on the `isDirty` effect), and it was there before. It belongs to CFG-157.
- The repo has no test runner, so verification was manual in the running app plus ad hoc Node scripts for the share link encoding. The steps are listed in each issue above.
