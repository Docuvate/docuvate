# Save building blocks (web)

Shared UI for **multi-field page forms** (ADR 011). Discrete actions (toggles, dialog confirm, delete) use toasts via `saveNotify` instead.

## Layout contract

1. Wrap the page root in `page page--with-save-bar` so content keeps a fixed bottom reserve (`--save-bar-reserve-height`, default `5.5rem`). The bar overlays that band; **no layout shift** when `dirty` toggles. `.app-main` uses matching `scroll-padding-bottom` so the last pane content is not hidden under the bar.
2. `SaveBarLayoutSync` in `AppShell` sets `--save-bar-left` / `--save-bar-width` from `.app-main` (bar stays out of the sidebar).
3. Do **not** add header save rows or inline “unsaved changes” strips.

## Recommended integration: `PageFormSaveKit`

Use one kit per page form. Parent owns server state, draft, and persist logic.

```tsx
import { useFormDraft } from '../../lib/useFormDraft';
import { PageFormSaveKit } from '../../components/save/PageFormSaveKit';
import { notifySaved, notifySaveError } from '../../lib/saveNotify';

export function ExampleSettingsSection() {
  const baseline = /* loaded DTO */;
  const form = useFormDraft(baseline);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await persist(form.draft);
      form.commit(form.draft);
      notifySaved();
    } catch (e) {
      const message = formatUserFacingError(e, 'errors.saveFailed');
      setError(message);
      notifySaveError(message, () => void save());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page page--with-save-bar">
      {/* bind inputs to form.draft / form.setDraft */}
      <PageFormSaveKit
        dirty={form.dirty}
        saving={saving}
        error={error}
        onDiscard={form.discard}
        onSave={() => void save()}
      />
    </div>
  );
}
```

### `PageFormSaveKit` props

| Prop        | Type                          | Description                                                         |
| ----------- | ----------------------------- | ------------------------------------------------------------------- |
| `dirty`     | `boolean`                     | Show SaveBar and enable guard / Cmd/Ctrl+S                          |
| `saving`    | `boolean`                     | Disable actions; bar shows saving copy                              |
| `error`     | `string \| null \| undefined` | Optional inline error in the bar (localized)                        |
| `onSave`    | `() => void`                  | Persist draft; parent updates baseline via `form.commit` on success |
| `onDiscard` | `() => void`                  | Reset draft to baseline                                             |

Includes: fixed `SaveBar`, `useUnsavedChangesGuard` (router + `beforeunload`), `UnsavedChangesDialog`, Cmd/Ctrl+S.

## Lower-level: `SaveBar` only

Use when the page already handles guards/keyboard (rare). **Do not** change prop names without updating ADR 011 (Appearance page).

| Prop        | Type                          | Description                                         |
| ----------- | ----------------------------- | --------------------------------------------------- |
| `visible`   | `boolean`                     | When false, renders nothing                         |
| `saving`    | `boolean`                     | Disables discard/save; status text uses saving i18n |
| `error`     | `string \| null \| undefined` | Shown above actions when set                        |
| `onSave`    | `() => void`                  | Primary action                                      |
| `onDiscard` | `() => void`                  | Secondary action                                    |

Rendered via portal on `document.body`; positioned with CSS vars from `SaveBarLayoutSync`.

## Hooks and helpers

- **`useFormDraft(baseline)`** — `{ draft, setDraft, dirty, discard, commit, saved }`. Baseline sync uses JSON snapshot to avoid reference loops.
- **`useUnsavedChangesGuard(active)`** — `{ pendingNavigation, confirmLeave, cancelLeave }` for custom dialogs.
- **`useSaveKeyboardShortcut(enabled, onSave)`** — Cmd/Ctrl+S.
- **`notifySaved(message?)` / `notifySaveError(message, retry?)`** — work outside React; require `ToastProvider` + `ToastGlobalBridge` in `AppShell`.

## App toasts (`useToast`)

Single generic toast stack (top-right, shared by save flows). Requires `ToastProvider` + `ToastGlobalBridge` in `AppShell`.

```tsx
import { useToast } from '../../components/save/ToastProvider';

export function ExampleAction() {
  const toast = useToast();

  async function onDone() {
    try {
      await persist();
      toast.success(); // default i18n save.saved
    } catch (e) {
      toast.error(formatUserFacingError(e, 'errors.saveFailed'), () => void onDone());
    }
  }
}
```

| Method                         | Description                                      |
| ------------------------------ | ------------------------------------------------ |
| `toast.success(message?)`      | Green status toast, check icon, ~3s auto-dismiss |
| `toast.error(message, retry?)` | Error toast, optional retry action               |

Behaviour: **16px** below the app header and from the right edge; `role="status"` + `aria-live="polite"` (errors use `role="alert"`); no autofocus; **Escape** dismisses only when focus is inside the toast; **pause on hover**; radius ≤12px (`--dv-radius-lg`); semantic ok/danger colors (light + dark tokens).

Older **`useToastNotify()`** exposes the same pushes plus `dismissSuccessToasts` / `dismissAllToasts` (used by `PageFormSaveKit`).

## i18n keys (`save.*`)

`saved`, `save`, `saving`, `discard`, `unsavedHint`, `unsavedTitle`, `unsavedDescription`, `leaveWithoutSaving`, `stay`, `retry`, `barAria`.

## Consumers (main)

- `RecognizedFieldsPage` — gate defaults (`PageFormSaveKit`)
- `DocumentDetailPage` — metadata tab
- **Theming** — Appearance / theme form should reuse `PageFormSaveKit` + `page--with-save-bar`
