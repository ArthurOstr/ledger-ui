# Frontend Notes — shadcn/ui in LoginScreen

Reference extracted from `src/pages/LoginScreen.tsx`.
Use this while building other pages and components in the project.

---

## Installation

Before importing any shadcn component, add it to the project with the CLI.
Each command generates a file under `src/components/ui/`.

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
```

`lucide-react` ships as a shadcn dependency — no separate install needed.

---

## shadcn/ui Components Used

### `<Button>`

**File:** `src/components/ui/button.tsx`

Shadcn's Button handles disabled state styling, focus ring (keyboard nav),
and base padding/border-radius/font-size. You don't style those yourself.

**Variants available out of the box:**
- `default` — used when no variant is specified
- `outline` — transparent bg with a visible border
- `secondary` — muted background, lower visual weight
- `ghost` — no border, no bg, hover only
- `destructive` — red, for destructive actions
- `link` — looks like an anchor tag

**Submit button (primary CTA):**
```tsx
<Button
  type="submit"
  disabled={isLoading}
  className="w-full mt-1 bg-[#f0ede8] text-[#0f0f0e] hover:bg-white transition-colors"
>
  Unlock vault
</Button>
```
No `variant` prop — defaults to `"default"`. The `className` overrides only
bg/text/hover to match the dark theme. Shadcn handles everything structural.

**Google OAuth button (secondary action):**
```tsx
<Button
  type="button"
  variant="outline"
  className="w-full border-white/10 text-[#a09d98] bg-transparent hover:bg-white/5 hover:text-[#f0ede8] hover:border-white/20 transition-colors"
>
  Continue with Google
</Button>
```
`variant="outline"` = border + transparent bg. Good pattern for secondary
actions that shouldn't compete visually with the primary CTA.

**The right way to scale this:** if you find yourself repeating the same
`className` overrides on multiple buttons across the app, open
`src/components/ui/button.tsx` and add a named variant there instead:
```tsx
// Inside buttonVariants in button.tsx
variants: {
  variant: {
    vault: "bg-[#f0ede8] text-[#0f0f0e] hover:bg-white",
  }
}
```
Then use `<Button variant="vault">` everywhere, with no per-button overrides.

---

### `<Input>`

**File:** `src/components/ui/input.tsx`

Shadcn's Input is a styled `<input>` element. Every standard HTML input prop
(`type`, `autoComplete`, `minLength`, `required`, `placeholder`, etc.)
passes through directly — nothing special needed.

**Usage pattern:**
```tsx
<Input
  id={emailId}
  type="email"
  placeholder="you@example.com"
  value={form.email}
  onChange={set('email')}
  autoComplete="email"
  className="pl-9 bg-[#0f0f0e] border-white/10 text-[#f0ede8] placeholder:text-[#6b6864] focus-visible:ring-white/20 focus-visible:border-white/25"
/>
```

The `className` overrides follow a consistent pattern — only these four
things change per theme:
- `bg-[...]` — background color
- `border-[...]` — border color
- `text-[...]` — typed text color
- `focus-visible:ring-[...]` — focus ring color

Everything else (height, padding, border-radius, transition) comes from
shadcn's base `input.tsx` and is left untouched.

**`pl-9` is required when using `InputWithIcon`** — it pushes the typed
text right so it doesn't sit under the icon. If you drop the icon, drop
the `pl-9` too.

---

### `<Label>`

**File:** `src/components/ui/label.tsx`

Shadcn's Label is Radix UI Label wrapped in Tailwind styles. It handles
focus management automatically — clicking the label focuses the linked input.

**Always pair with `htmlFor` + matching `id` on the input:**
```tsx
<Label htmlFor={emailId} className="...">
  Email
</Label>
<Input id={emailId} ... />
```

**`useId()` for the id values** — generates a unique ID per component
instance, so the label-input link works correctly even if the form is
rendered more than once on the same page:
```tsx
const emailId = useId();   // → e.g. ":r0:"
const passwordId = useId();
```

**`text-muted-foreground`** is a shadcn CSS variable used on the label.
It automatically adapts if you switch between light and dark themes later —
no hardcoded color needed.

---

## lucide-react Usage

All icons except `GoogleIcon` come from lucide-react.

```tsx
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, TrendingUp, History, Monitor } from 'lucide-react';
```

Pass `size` as a number prop and always add `aria-hidden="true"` on
decorative icons so screen readers skip them:
```tsx
<Lock size={18} aria-hidden="true" />
<Mail size={15} aria-hidden="true" />
```

**Why `GoogleIcon` is not from lucide:** it uses hardcoded brand colors
(`#4285F4`, `#34A853`, etc.) instead of `currentColor`, so a generic icon
library can't provide it. It lives as an inline SVG at the bottom of the
file.

---

## Theming Pattern for Dark Backgrounds

Shadcn components are designed for a light theme by default. On a dark
background, override exactly three things per component and leave the rest
alone:

| What to override | Example class |
|---|---|
| Background | `bg-[#0f0f0e]` |
| Border | `border-white/10` |
| Text | `text-[#f0ede8]` |
| Focus ring | `focus-visible:ring-white/20` |
| Placeholder | `placeholder:text-[#6b6864]` |

Everything structural (padding, border-radius, height, font-size,
transition) stays as shadcn ships it.

---

## Accessibility Patterns

**Error banner — screen reader announcement:**
```tsx
<div id="auth-error" role="alert" aria-live="polite">
  <AlertCircle size={14} aria-hidden="true" />
  {error}
</div>
```
- `role="alert"` + `aria-live="polite"` → screen reader announces the
  message when it appears, without interrupting the user mid-sentence.
- `id="auth-error"` → linked from the input via `aria-describedby` so
  the reader associates the error with the correct field.

**Linking error to input:**
```tsx
<Input aria-describedby={error ? 'auth-error' : undefined} ... />
```

**Tab switcher semantics:**
```tsx
<div role="tablist">
  <button role="tab" aria-selected={mode === m} ...>
```
`role="tab"` + `aria-selected` lets screen readers announce which mode
is active without any extra work.

**Decorative icons:**
Always `aria-hidden="true"` on icons that are purely visual.
Never on icons that carry meaning without surrounding text.

---

## Responsive Layout

Tailwind is mobile-first. Classes without a prefix apply to all screen
sizes. Prefixed classes (`md:`, `lg:`) apply from that breakpoint up.

**Two-column → single-column collapse:**
```tsx
// Card wrapper
className="flex flex-col md:flex-row ..."

// Form panel — full width on mobile, 52% from md up
className="flex flex-col ... md:flex-[0_0_52%]"

// Trust panel — hidden on mobile, shown from md up
className="hidden md:flex md:flex-[0_0_48%] ..."
```

**Responsive padding:**
```tsx
// Less padding on mobile, more on desktop
className="px-6 py-8 md:px-10 md:py-11"
```

**`min-h` only on desktop:**
```tsx
// Don't lock a minimum height on mobile — let content dictate height
className="md:min-h-[560px]"
```
