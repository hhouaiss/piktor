# Prompt for Piktor Image Generator v3 (Multi-image Product)

Refactor the current Image Generator page in our SaaS **Piktor** to the following spec. Keep the UI minimal and consistent with the rest of Piktor. No database; store in memory/localStorage.

## Goal

Users upload **several photos of the same product** (multi-angle). Piktor fuses them into **one product profile (hidden JSON)**, auto-detects **color & materials**, allows **real dimensions + color overrides**, lets the user **name and save** the configuration, and then generates images via **OpenAI Images API** according to selected contexts (Packshot/Story/Hero). The JSON/profile/prompt stays under the hood.

## UX Flow (4 steps)

### Step 1 — Product block

* **Product Name** (required): text input. Use this as the key to save/load/duplicate configs (localStorage).
* **Upload images (multi)**: drag & drop or file picker (jpg/png/webp). Show thumbnails, allow reorder & delete.
* Allow choosing a **Primary reference image** (radio on each thumb) used for `images.edits`. Others are used only for analysis.

### Step 2 — Product specs (auto + override)

* Section **Detected by AI (read-only until user edits):**

  * Type (e.g., desk, seating\_ball)
  * Materials (concise)
  * **Detected color (hex)**
  * Style (e.g., modern minimalist)
  * Wall-mounted: true/false
  * Features (array)
* Section **Your overrides**:

  * **Real dimensions (cm):** width, depth, height (numeric)
  * **Color override (hex or color picker)**
  * Notes (optional)
* Rule: **overrides take precedence** over detection. Keep both values in the hidden profile with `source: 'detected' | 'override'`.

### Step 3 — Generation settings (context presets)

* **Context (radio):**

  * **Packshot / Instagram** → size `1024x1024`
  * **Story** → size `1024x1536`
  * **Hero** → size `1536x1024`
* **Background style**: `plain | minimal | lifestyle | gradient`
* **Product position** (Hero/Packshot): `left | right | center`
* **Reserved text zone** (Hero only): `left | right | top | bottom | none` (used as instruction; no text rendered)
* **Props (optional multi)**: `plant, lamp, rug, chair, artwork`
* **Lighting**: `soft daylight | studio softbox | warm ambient`
* **Strict Mode** (toggle ON by default): enforce no text, no extra furniture, respect dimensions/materials, keep wall-mounted off the floor.
* **Quality**: `high | medium | low` (default: medium)
* **Variations**: `1 | 2 | 3 | 4` (default: 2)

Include **Save Config** (to localStorage under product name) and **Duplicate Config** (creates “{name} – Copy”).

### Step 4 — Generate

* Build a **single product profile** by fusing all uploaded images (multi-image analysis).
* Build a **final prompt** from: profile (with overrides) + generation settings + negative constraints.
* Call **OpenAI Images API** `images.edits` **once per requested variation**, using the **Primary reference image** as `image`, the built prompt as `prompt`, `model='gpt-image-1'`, `size` by context, `quality` from UI, `background='auto'`, `moderation='auto'`.
* Show a **results grid** with preview, Download, Download All, Regenerate (same settings).

## Data model (in memory)

```ts
type DetectedField<T> = { value: T; source: 'detected' | 'override' };

type ProductProfile = {
  name: string;
  images: { id: string; path: string; primary: boolean }[];
  type: DetectedField<string>;
  materials: DetectedField<string>;
  colorHex: DetectedField<string>;      // detected from images; can be overridden
  style: DetectedField<string>;
  wallMounted: DetectedField<boolean>;
  features: DetectedField<string[]>;
  dimensionsCm: {
    width: DetectedField<number | null>;
    depth: DetectedField<number | null>;
    height: DetectedField<number | null>;
  };
};

type UiSettings = {
  context: 'packshot' | 'story' | 'hero';
  backgroundStyle: 'plain' | 'minimal' | 'lifestyle' | 'gradient';
  position: 'left' | 'right' | 'center';
  reservedTextZone?: 'left' | 'right' | 'top' | 'bottom' | 'none';
  props: string[];
  lighting: 'soft daylight' | 'studio softbox' | 'warm ambient';
  strictMode: boolean;
  quality: 'high' | 'medium' | 'low';
  variations: 1 | 2 | 3 | 4;
};
```

Persist `{ profile, uiSettings }` in `localStorage` under key `piktor.product.{slug}`. Provide **Load**, **Save**, **Duplicate**, **Delete**.

## Multi-image fusion (analysis)

* Create `analyzeImagesToProfile(files[]) => Partial<ProductProfile>` that:

  * infers `type`, `materials`, `colorHex`, `style`, `wallMounted`, `features`
  * sets `source='detected'`
* After user edits, wrap overrides to set `source='override'`.
* Color & dimensions logic:

  * Use detected color as default; allow override via color picker.
  * If user changes color later (e.g., to generate the same product in Blue), reflect it in the prompt: **“render the same geometry, hardware, and materials; change only the surface color to {colorHex}.”**
  * Dimensions: if set, include exact numbers in prompt as constraints (don’t display text in image).

## Size mapping

* Packshot/Instagram → `size="1024x1024"`
* Story → `size="1024x1536"`
* Hero → `size="1536x1024"`

## Prompt builder (server-side)

Create `buildPrompt(profile: ProductProfile, ui: UiSettings): string`. Output concise, explicit instructions (no raw JSON). Template:

```
Use the uploaded primary photo as reference to generate a {ui.context} image of the same product.

Product fidelity:
- Category: {profile.type.value}; style: {profile.style.value}.
- Materials: {profile.materials.value}.
- Base color: {profile.colorHex.value}. {if color was overridden: "Use this color override; change only surface color, keep identical geometry and hardware."}
- Dimensions (cm, if set): width {w}, depth {d}, height {h}; match proportions.

Layout & look:
- Background: {ui.backgroundStyle}. Lighting: {ui.lighting}.
- Product position: {ui.position}.
- Props allowed: {ui.props.join(', ') || 'none'}.
{if ui.context === 'hero' and reservedTextZone !== 'none':
  "For hero, leave clean negative space on the {ui.reservedTextZone} for HTML text overlay added later. Do not render any text."
}

Strict constraints:
- Photorealistic. Respect geometry, materials, and dimensions.
- If wall-mounted == true: keep attached to wall; no floor contact.
- Do NOT add text, labels, numbers, watermarks, or UI elements.
- Do NOT add extra furniture beyond allowed props.
- Keep a clean commercial look suitable for e-commerce.
```

Append a short negative block:

```
Avoid: text/captions/logos, duplicate products, floor contact (if wall-mounted), heavy reflections, cartoonish look, oversaturation.
```

## OpenAI call

Use the selected **Primary reference image** for `image`. Generate `ui.variations` outputs.

```ts
import fs from 'fs';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sizeMap = {
  packshot: '1024x1024',
  story: '1024x1536',
  hero: '1536x1024'
}[ui.context];

const resp = await client.images.edits({
  image: fs.createReadStream(primaryPath),
  prompt: finalPrompt,
  model: 'gpt-image-1',
  n: ui.variations,
  size: sizeMap,
  quality: ui.quality,
  background: 'auto',
  moderation: 'auto'
});
// render response previews; provide Download/Regenerate
```

## Acceptance criteria

* Upload 3–10 photos of **one** product → treated as **one** profile.
* Set **real dimensions** and **color override**; generation respects them.
* Generate Packshot/Story/Hero with correct sizes. No text appears in images.
* Wall-mounted products never touch the floor when flagged.
* I can **name**, **save**, **load**, **duplicate**, and **edit** a product configuration locally.
* Regenerate produces new variations with the same settings.

## Nice-to-haves (optional)

* “Choose base reference image automatically” (highest resolution or clearest front view).
* Quick presets: `Packshot Minimal`, `Hero Right / Left`, `Story Lifestyle`.
* Concurrency control / small delay between API calls to avoid rate limits.

Please implement the UI changes, the analysis fusion, the override logic, the prompt builder, localStorage persistence, and the OpenAI call exactly as specified. Keep code modular (hooks/utils/components) and consistent with Piktor’s style.
