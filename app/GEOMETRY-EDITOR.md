# VIBEU Nail Geometry Editor

Internal visual tool for calibrating the five nail masks in every photographed hand asset. It produces the same `HandData`/`coordinates.json` contract consumed by Studio, so exported geometry does not need a conversion script.

## Open it

```bash
cd app
npm install
npm run dev
```

Sign in with an admin account and open `http://localhost:5173/admin/geometry`.

The editor is available from the Admin sidebar. `AdminLayout` enforces a signed-in profile with `role = 'admin'` before the tool is rendered.

## Recommended pixel-calibration workflow

1. Select skin tone, form, and length. The editor loads that asset's real `base.jpg` and `coordinates.json`.
2. Select one finger, then use **Focus** and zoom to 400–800%.
3. Use **Point mode (V)** to drag individual boundary nodes onto the photographic nail edge. Double-click an edge to add a node; `Delete` removes the selected node.
4. Use **Move mode (M)** only when the whole mask is displaced. Use the numeric transform fields to adjust nail-local width, length, rotation, or sub-pixel translation without imposing one template on all fingers.
5. After hand tracing, use **Smooth boundary** at Light or Medium strength. It resamples by closed-curve arc length, applies a periodic low-pass filter, then restores the original centroid and signed area so smoothing does not move or shrink the nail. The action is undoable and can target one finger or all five.
6. Reduce mask opacity to compare the polygon against the cuticle and both sidewalls. Toggle the grid when checking single-pixel errors.
7. Click **Save draft** before switching combinations. Drafts are stored per combination in browser local storage.
8. Click **Export JSON** and replace the exact repository path shown in the right panel.

## Import detection and saving

- New exports include a `_vibeuGeometry` metadata block with skin tone, shape, length, selected finger, editor version, and save timestamp. Studio ignores this extra block and continues to read the normal `HandData` fields.
- **Open JSON and auto-detect** switches to the encoded hand combination and selected finger before loading the geometry. Legacy files are detected from the `<tone>-<shape>-<length>-coordinates.json` filename; files with neither metadata nor a standard filename stay on the current combination.
- Imported geometry is immediately retained as that combination's browser draft.
- **Save current file** overwrites the file opened through the native browser picker. When the File System Access API is unavailable, the editor safely falls back to downloading a new JSON file.

## Publish directly to Studio

1. Run `supabase/migrations/20260905_nail_geometry_variants.sql` once in the Supabase SQL Editor.
2. In `/admin/geometry`, select or import a hand combination and calibrate its five paths.
3. Click **Save & apply to Studio**. The row is upserted by `(tone, shape, length)`; RLS allows public reads but only an authenticated admin can write.
4. Click **Render in Studio** to open `/studio?tone=…&shape=…&length=…`. Studio clears any locked template state, selects that whole-hand combination, and loads the published geometry.

Studio always falls back to the repository `coordinates.json` when Supabase is not configured, the migration has not been applied, the request fails, or the remote payload is invalid. Publishing invalidates both the coordinate loader and prepared-lighting cache in the admin session, so the next Studio render uses the saved paths immediately.

## Precision controls

- Arrow keys: move selected node, or the selected nail when no node is selected, by 1 px.
- Shift + arrow: 10 px.
- Alt + arrow: 0.1 px.
- Snap steps: off, 0.1 px, 0.5 px, or 1 px.
- Undo/redo: `Ctrl+Z`, `Ctrl+Y`, or `Ctrl+Shift+Z` (100-state history).
- Middle-button drag or Alt-drag: pan without changing tools.
- Mouse wheel: zoom from 50% to 1200%.

`bbox`, `center`, normalized `axis`, and all `uvFrame` ranges are recalculated after every geometry edit. Imported JSON is validated for all five required finger IDs and valid polygon paths before it replaces the current document.
