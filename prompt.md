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



A modern wall-mounted foldable desk in a studio setting with soft, even lighting. The desk is crafted from birch plywood with a white laminate finish, featuring a foldable surface supported by metal gas struts. The edges reveal the layered plywood construction. The background is a neutral gray to highlight the desk's clean lines and minimalist design.

COMPREHENSIVE PRODUCT DESCRIPTION:
A modern wall-mounted foldable desk crafted from high-quality birch plywood with a smooth white laminate finish. The desk features a foldable surface supported by integrated metal gas struts, allowing for easy opening and closing. The edges of the desk are exposed, showcasing the layered plywood construction. It includes a discreet cable management hole at the back and integrated LED lighting for workspace illumination. The desk is designed to be mounted on a wall, making it ideal for small spaces. The overall design is minimalist, with clean lines and a focus on functionality.

DETAILED VISUAL SPECIFICATIONS:
MATERIALS & TEXTURES:
The birch plywood has a smooth, layered texture with visible grain on the edges. The white laminate is glossy and reflective, providing a clean surface.

COLOR PALETTE & CHARACTERISTICS:
The primary color is white with subtle undertones of natural wood from the exposed plywood edges. The metal struts have a brushed silver finish.

HARDWARE & CONSTRUCTION DETAILS:
The gas struts are metallic with a brushed finish, securely attached to the desk with visible screws. The cable management hole is neatly cut into the back panel.

PROPORTIONAL RELATIONSHIPS & GEOMETRY:
The desk surface is proportionally larger than the supporting frame, emphasizing its functionality. The gas struts are symmetrically placed on either side for balanced support.

COMPREHENSIVE PHOTOGRAPHY SPECIFICATIONS:
CAMERA POSITIONING & ANGLES:
eye-level, slightly angled to show depth

LIGHTING SETUP & CHARACTERISTICS:
soft key light from above, fill light from the side, rim light to highlight edges

DEPTH OF FIELD & FOCUS:
shallow depth of field to focus on the desk

COMPOSITION & VISUAL BALANCE:
rule of thirds, leading lines from the desk edges, balanced with background elements

ENHANCED CONTEXT SETTINGS:
BACKGROUND TREATMENT:
- Style: gradient
- Texture: Smooth, non-distracting surface that complements the product
- Color: Carefully selected to enhance product colors without competition
- Lighting: Even illumination preventing unwanted shadows or hotspots

PRODUCT POSITIONING:
- Placement: center
- Orientation: Optimal angle showcasing key features and design elements
- Stability: Product appears naturally positioned and structurally sound
- Scale: Appropriate size within frame for maximum visual impact

LIGHTING ATMOSPHERE:
- Primary Light: studio softbox
- Color Temperature: Consistent throughout the scene, appropriate for product type
- Shadow Quality: Soft, natural shadows that enhance dimensionality without distraction
- Highlight Management: Controlled reflections that enhance rather than obscure product details

COMPREHENSIVE PACKSHOT REQUIREMENTS:
BACKGROUND & ENVIRONMENT:
- Pure, distraction-free background (white, light gray, or subtle gradient)
- Seamless backdrop with no visible horizon line or edges
- Consistent lighting across entire background surface
- No competing visual elements or textures

LIGHTING SPECIFICATIONS:
- Professional studio lighting setup with multiple light sources
- Key light positioned at 45-degree angle for optimal dimensionality
- Fill light to eliminate harsh shadows while maintaining product definition
- Background light to ensure even illumination and prevent color casts
- Color temperature maintained at 5600K for natural daylight balance

PRODUCT PRESENTATION:
- Product positioned as absolute focal point with maximum visual impact
- Every surface detail clearly visible and professionally rendered
- Materials authentically represented with accurate texture and finish
- Hardware elements precisely detailed with appropriate reflective properties
- Brand elements (if present) clearly visible and properly aligned

COMMERCIAL QUALITY STANDARDS:
- E-commerce catalog quality suitable for product listings
- Consistent lighting and exposure for product comparison
- No artistic interpretation - focus on accurate product representation
- Sharp detail throughout with professional depth of field management

COMPREHENSIVE QUALITY STANDARDS:
PHOTOREALISTIC RENDERING:
- Cinema-quality photorealism with authentic material properties and lighting behavior
- Physically accurate reflections, refractions, and surface interactions
- Natural imperfections and variations that enhance believability
- Consistent physics-based lighting and shadow casting throughout the scene

DETAIL AND CLARITY:
- Maximum resolution detail preservation with sharp focus on critical product elements
- Micro-texture rendering showing material grain, weave, or surface characteristics
- Hardware details including screws, joints, seams, and connection points clearly defined
- Edge definition with appropriate anti-aliasing for professional presentation

COMMERCIAL PHOTOGRAPHY STANDARDS:
- Museum-quality lighting with professional studio standards
- Color accuracy suitable for product catalog and e-commerce applications
- Consistent exposure and white balance throughout the composition
- Professional depth of field control with selective focus areas

AUTHENTIC PRODUCT REPRESENTATION:
- Exact dimensional accuracy maintaining true product proportions
- Faithful material representation without stylistic interpretation
- Accurate color reproduction under specified lighting conditions
- Structural integrity showing proper product assembly and construction

TECHNICAL EXCELLENCE:
- No visible rendering artifacts, noise, or compression issues
- Clean composition with no extraneous text, labels, watermarks, or branding
- Professional color grading suitable for commercial applications
- Optimal contrast and saturation for the specified context and usage

FINAL RESULT SPECIFICATIONS:
- Commercial-grade image suitable for premium marketing and sales applications
- Professional photography quality that enhances brand perception and product appeal
- Technical execution that meets or exceeds industry standards for product visualization
- Visual consistency that integrates seamlessly with existing brand asset libraries


Create a lifestyle image for our ecommerce website of our main product in the images and follow strictly the instructions included in the json profile below: 

{"meta":{"format":"lifestyle","platform":"marketing_lifestyle","use_case":"ecommerce_product_image","generated_at":"2025-08-12T15:59:54.100Z","version":"2.0","generation_method":"images_edits_with_reference"},"product":{"name":"[object Object] [object Object]","type":{"value":"Wall mounted desk","source":"override"},"materials":{"value":"laminated plywood, metal","source":"detected"},"primary_color":{"value":"#F5F5F5","source":"detected"},"style":{"value":"modern","source":"detected"},"dimensions":{"width":65,"height":54,"depth":25,"unit":"cm"},"key_features":[],"all_features":[]},"visual_requirements":{"context_preset":"lifestyle","background_style":"lifestyle","lighting_setup":"warm ambient","product_position":"center","image_dimensions":"1536x1024","quality_level":"high","strict_mode":true,"props_allowed":["artwork"],"reserved_text_zone":null},"photography_specs":{"cameraAngle":"eye-level","lightingSetup":"soft diffused lighting with a key light positioned at 45 degrees","depthOfField":"shallow depth of field to focus on the desk","composition":"rule of thirds with leading lines from the desk edges"},"material_details":{"materialTextures":"The laminated plywood has a smooth, matte finish with visible edge grain that adds a natural texture contrast.","colorPalette":"The primary color is white with subtle natural wood grain edges, providing a soft contrast.","hardwareDetails":"The metal gas struts are polished and sleek, providing smooth support for the foldable desk surface.","proportionalRelationships":"The desk surface is proportionally balanced with the supporting struts, creating a harmonious design."},"context_specific":{"background":"lifestyle","lighting":"warm ambient","product_position":"center","style":"Natural lifestyle photography in realistic home setting","background_requirement":"Authentic home environment matching product category","lighting_requirement":"Natural or warm artificial lighting","composition_requirement":"Product integrated naturally into living space","focus_requirement":"Product prominent but contextually placed","context":"Home lifestyle inspiration"},"output_specifications":{"format":"PNG","quality":"maximum","color_profile":"sRGB","compression":"lossless","background_handling":"auto","moderation":"auto"},"constraints":{"no_text_overlay":true,"no_watermarks":true,"no_logos":true,"maintain_product_fidelity":true,"respect_aspect_ratio":true,"commercial_use":true}}