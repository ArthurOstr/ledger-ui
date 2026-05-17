# Frontend Notes — shadcn/ui in Dashboard & TransactionTable

Reference extracted from `src/pages/Dashboard.tsx` and `src/components/TransactionTable.tsx`.
Companion to `frontend_notes.md` (LoginScreen).

---

## Installation

Add all components used across both files in one command:

```bash
npx shadcn@latest add card skeleton alert table badge scroll-area
```

Each command generates a file under `src/components/ui/`.
You only run it once per component — after that, the file is yours to edit.

---

## shadcn/ui Components Used

---

### `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>`

**File:** `src/components/ui/card.tsx`

Card is a layout container — a `div` with border, rounded corners, and
a subtle shadow baked in. The sub-components handle internal spacing
so you don't set padding manually on every usage.

**Sub-component responsibilities:**
- `CardHeader` — top section, used for the title + icon row. Adds top padding.
- `CardTitle` — applies `font-semibold` and `tracking` by default.
- `CardContent` — body section. Adds horizontal padding + bottom padding.

**Usage pattern (SummaryCard):**
```tsx
<Card className="bg-[#1c1c1b] border-white/10">
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-xs font-medium uppercase tracking-widest text-[#a09d98]">
      Total income
    </CardTitle>
    <TrendingUp size={16} className="text-[#6b6864]" />
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-semibold tabular-nums text-emerald-400">
      1 234,50 ₴
    </p>
  </CardContent>
</Card>
```

**Dark theme override — only two things:**
- `bg-[#1c1c1b]` — replaces the default white background
- `border-white/10` — replaces the default light border

Everything else (radius, shadow, padding structure) comes from shadcn untouched.

**`pb-2` on CardHeader** — shadcn's default bottom padding on CardHeader is
larger than needed for compact stat tiles. `pb-2` tightens it. This is a
normal override — shadcn expects you to adjust spacing via className.

**When to use Card:** any time you need a visually contained block — stat
tiles, settings panels, form sections, info boxes. It's the most
general-purpose container in shadcn.

---

### `<Skeleton>`

**File:** `src/components/ui/skeleton.tsx`

Renders an animated shimmer placeholder. You control the size entirely
with `h-` and `w-` Tailwind classes. Shadcn handles the pulse animation.

**The key idea — mimic the real layout:**
```tsx
// Real card has a title and a value
// Skeleton card mimics the same shape
<Card className="bg-[#1c1c1b] border-white/10">
  <CardHeader className="pb-2">
    <Skeleton className="h-3 w-24 bg-white/10" />   {/* title placeholder */}
  </CardHeader>
  <CardContent>
    <Skeleton className="h-8 w-36 bg-white/10" />   {/* value placeholder */}
  </CardContent>
</Card>
```

This is called a skeleton screen. The user sees the shape of the content
before the data arrives — it feels faster than a spinner because the
layout doesn't shift when real data loads in.

**Dark theme override:**
`bg-white/10` — shadcn's default skeleton is a light grey (`bg-muted`),
which is invisible on a dark background. Override with a white/opacity value.

**Sizing guide used in this project:**
| Element | Height | Width |
|---|---|---|
| Label / caption | `h-3` | `w-24` |
| Stat value | `h-8` | `w-36` |
| Table header | `h-10` | `w-full` |
| Table row | `h-12` | `w-full` |

---

### `<Alert>`, `<AlertDescription>`

**File:** `src/components/ui/alert.tsx`

Used for the error state when the backend is unreachable.

**Variants:**
- `default` — neutral, informational
- `destructive` — red border + background, for errors

**Usage pattern:**
```tsx
<Alert
  variant="destructive"
  className="bg-red-950/40 border-red-900/50 text-red-400"
>
  <AlertCircle size={14} aria-hidden="true" />
  <AlertDescription className="font-mono text-sm ml-2">
    Failed to reach the vault. Is the backend server running?
  </AlertDescription>
</Alert>
```

**Dark theme override:**
`variant="destructive"` applies a light-mode red by default. Override with:
- `bg-red-950/40` — very dark red background
- `border-red-900/50` — dark red border
- `text-red-400` — readable red text on dark

**`AlertDescription`** — a `<div>` with `text-sm` applied. Use it to wrap
the message text so shadcn's internal spacing rules apply correctly.
`ml-2` pushes it right of the icon.

**When to use Alert vs error banner from scratch:**
Use `<Alert>` for page-level messages (data fetch failed, session expired).
Use a custom inline error (like in LoginScreen) for field-level form errors
where you need tighter control over position and size.

---

### `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>`

**File:** `src/components/ui/table.tsx`

A set of wrappers around standard HTML table elements. They add consistent
padding, font sizes, and border utilities — nothing more. All standard
HTML table props pass through normally.

**Component map:**
```
<Table>               → <table>
  <TableHeader>       → <thead>
    <TableRow>        → <tr>
      <TableHead>     → <th>
  <TableBody>         → <tbody>
    <TableRow>        → <tr>
      <TableCell>     → <td>
```

**Usage pattern:**
```tsx
<Table>
  <TableHeader className="sticky top-0 bg-[#1c1c1b] z-10">
    <TableRow className="border-white/10 hover:bg-transparent">
      <TableHead className="text-[#a09d98] font-medium">Date</TableHead>
      <TableHead className="text-[#a09d98] font-medium">Description</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {rows.map((row) => (
      <TableRow key={row.id} className="border-white/5 hover:bg-white/[0.03] transition-colors">
        <TableCell className="text-[#a09d98] text-sm">{row.date}</TableCell>
        <TableCell className="text-[#f0ede8] text-sm">{row.description}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Sticky header:**
`sticky top-0` on `TableHeader` keeps column labels visible while scrolling.
This only works when the table is inside a `<ScrollArea>` with a fixed height —
without a scroll container, `sticky` has nothing to stick against.
`z-10` ensures the header sits on top of row content as rows scroll under it.

**`hover:bg-transparent` on the header row** — shadcn's `TableRow` adds a
hover background by default. The header row shouldn't highlight on hover,
so this disables it.

**`hover:bg-white/[0.03]`** — the square bracket syntax lets you use
arbitrary opacity values not in Tailwind's default scale. `0.03` = 3%
white overlay, barely visible — just enough to signal interactivity
without being distracting on a dark background.

**`tabular-nums`** — applied to amount and balance cells. Forces all digits
to take equal width so decimal points and currency symbols align vertically
across rows. Always use this on financial figures in a table.

**`truncate` + `title` on description cell:**
```tsx
<TableCell
  className="max-w-[240px] truncate"
  title={tx.description}
>
  {tx.description}
</TableCell>
```
`truncate` clips long text with an ellipsis. `title` adds a native browser
tooltip showing the full text on hover — no extra library needed.

---

### `<Badge>`

**File:** `src/components/ui/badge.tsx`

A small pill label. Used for transaction categories in the table.

**Variants:**
- `default` — filled with primary color (used for food/groceries)
- `secondary` — muted fill (used for transport)
- `outline` — border only, no fill (used for unknown/uncategorised)
- `destructive` — red, for warning states

**Usage pattern:**
```tsx
<Badge
  variant={categoryVariant(tx.category)}
  className="text-[11px] border-white/10 text-[#a09d98] bg-white/5"
>
  {tx.category ?? '—'}
</Badge>
```

**Dark theme override:**
Default badges are designed for light backgrounds. On dark:
- `bg-white/5` — nearly transparent fill instead of the default solid color
- `text-[#a09d98]` — muted warm grey instead of dark text
- `border-white/10` — subtle border that reads on dark bg

**Dynamic variant from a function:**
```tsx
// Maps category string → Badge variant
const categoryVariant = (category: string | undefined) => {
  if (!category) return 'outline';
  const lower = category.toLowerCase();
  if (['food', 'groceries', 'dining'].some((k) => lower.includes(k))) return 'default';
  if (['transport', 'fuel', 'transit'].some((k) => lower.includes(k))) return 'secondary';
  return 'outline';
};
```
This pattern — a function that returns a variant string — is reusable
whenever you need conditional badge colors based on data. Extend the
`if` checks as you add more categories to your parser.

---

### `<ScrollArea>`

**File:** `src/components/ui/scroll-area.tsx`

Wraps content in a scrollable container with a styled scrollbar.
Used to cap the table height so the page doesn't grow infinitely
with large statement uploads.

**Usage pattern:**
```tsx
<ScrollArea className="h-[600px] rounded-xl border border-white/10">
  <Table>
    {/* ... */}
  </Table>
</ScrollArea>
```

**Why not just `overflow-y-auto`?**
The native browser scrollbar is unstyled and looks inconsistent across
operating systems. `ScrollArea` replaces it with a scrollbar that
automatically adapts to your theme via shadcn's CSS variables.

**The height is mandatory** — `ScrollArea` needs a fixed or max height to
know when to start scrolling. Without `h-[...]`, it expands to fit all
content and never scrolls.

**Sticky header dependency** — `sticky top-0` on `TableHeader` only works
because `ScrollArea` is the scroll container. The header sticks to the
top of the `ScrollArea`, not the page.

---

## React Patterns Used

### `useCallback` for stable function references

```tsx
const fetchVaultData = useCallback(async () => {
  setLoading(true);
  // ...fetch logic
}, []); // empty deps = created once, never recreated

useEffect(() => {
  fetchVaultData();
}, [fetchVaultData]);
```

**Why this matters here:** `fetchVaultData` is passed as a prop to
`FileUpload` via `onUploadSuccess`. If it were a plain `async function`
inside the component body, it would be recreated on every render — a new
function reference each time. `useCallback` with an empty dependency array
creates it once and keeps the reference stable, which prevents unnecessary
re-renders in child components that receive it as a prop.

**Rule of thumb:** wrap functions in `useCallback` when you pass them
as props to child components or include them in a `useEffect` dependency array.

### Conditional rendering — three states

The dashboard has three mutually exclusive states: loading, error, success.
The pattern used keeps them clean and non-overlapping:

```tsx
{loading && <LoadingSkeleton />}

{error && !loading && (
  <Alert>...</Alert>
)}

{!loading && !error && (
  <>
    <SummaryCards />
    <TransactionTable />
  </>
)}
```

The `!loading` guard on the error block prevents a flash where both the
skeleton and the error appear simultaneously during the state transition.

### `Intl.NumberFormat` for currency

```tsx
const formatAmount = (amount: number, currency = 'UAH') => {
  try {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};
```

`Intl.NumberFormat` is built into every modern browser — no library needed.
`'uk-UA'` locale gives Ukrainian number formatting (space as thousands
separator, comma as decimal: `1 234,50 ₴`).

The `try/catch` handles unknown currency codes — if your parser encounters
a code the browser doesn't recognise, it falls back to a plain number
string rather than crashing.

**Always use this instead of** `{tx.amount} {tx.currency}` — raw floats
render as `1234.5 UAH`, which is incorrect for a financial application.

---

## `<Button variant="ghost">` — Low-Priority Actions

```tsx
<Button
  variant="ghost"
  onClick={logout}
  className="text-red-400 hover:text-red-300 hover:bg-red-950/30 gap-2"
>
  <LogOut size={15} aria-hidden="true" />
  Lock vault
</Button>
```

`variant="ghost"` = no background, no border, hover state only.
Use it for actions that should be available but not compete visually
with primary CTAs — navigation items, secondary actions, utility buttons.

The red color override signals a destructive action without using
`variant="destructive"` (which adds a solid red background, too heavy
for a header button). This is the correct approach: use `ghost` for the
structure, override the color for the semantic meaning.

---

## Theming Consistency Across Pages

Both `Dashboard` and `LoginScreen` share the same color palette.
Keep this consistent as you add more pages:

| Role | Value | Used for |
|---|---|---|
| Page background | `#0f0f0e` | `min-h-screen bg-[#0f0f0e]` |
| Panel / card bg | `#1c1c1b` | `Card`, side panel, table header |
| Primary text | `#f0ede8` | Headings, values, input text |
| Muted text | `#a09d98` | Labels, table headers, secondary info |
| Hint text | `#6b6864` | Placeholders, timestamps, captions |
| Border | `white/10` | All borders on dark backgrounds |
| Income | `emerald-400` | Positive amounts |
| Expense | `red-400` | Negative amounts |

If you ever want to centralise these, add them to `tailwind.config.ts`
as named colors under `theme.extend.colors`:

```ts
colors: {
  vault: {
    bg:      '#0f0f0e',
    surface: '#1c1c1b',
    text:    '#f0ede8',
    muted:   '#a09d98',
    hint:    '#6b6864',
  }
}
```

Then use `bg-vault-bg`, `text-vault-muted` etc. across all files —
one place to change colors across the whole app.
