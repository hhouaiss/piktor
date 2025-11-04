/**
 * Prompt Specifications Library
 *
 * Contains all specification generators for image editing prompts.
 * These functions provide detailed technical specifications for each edit type.
 */

// ============================================================================
// VIEW ANGLE SPECIFICATIONS
// ============================================================================

export function getAngleInstruction(angleType: string): string {
  const angleMap: Record<string, string> = {
    'front': 'Position the camera directly facing the subject at eye level, centered composition, straight-on view with no tilt',

    'side-left': 'Position the camera 90 degrees to the left of the subject, capturing the left profile at eye level, maintain parallel perspective',

    'side-right': 'Position the camera 90 degrees to the right of the subject, capturing the right profile at eye level, maintain parallel perspective',

    'top-down': 'Position the camera directly above the subject looking straight down (bird\'s eye view), maintain horizontal framing, show the top surface and spatial layout',

    'low-angle': 'Position the camera below subject eye level looking upward at 30-45 degrees (worm\'s eye view), create dramatic upward perspective, emphasize height and power',

    'high-angle': 'Position the camera above subject looking downward at 30-45 degrees, create compressed perspective, show more of the background/floor',

    '3-4-view': 'Position the camera at a 45-degree angle to capture both front and one side simultaneously, slightly elevated perspective, three-quarter composition',

    'over-shoulder': 'Position the camera behind and slightly to the side of the subject, as if looking over their shoulder, maintain focus on what the subject faces',

    'dutch-angle': 'Tilt the camera 15-30 degrees on its roll axis while maintaining the same horizontal position, create dynamic diagonal composition',

    'extreme-closeup': 'Move the camera very close to the subject, fill the frame with a specific detail or feature, maintain sharp macro-level focus',

    'wide-establishing': 'Pull the camera back to show the subject in full context with surrounding environment, wider field of view, more background visible'
  };

  return angleMap[angleType] || angleMap['front'];
}

// ============================================================================
// ASPECT RATIO SPECIFICATIONS
// ============================================================================

export function getExtensionStrategy(originalRatio: string, targetRatio: string): string {
  const strategies: Record<string, string> = {
    // Square to Wide (1:1 → 16:9, 4:3, etc.)
    'square-to-wide': `Extend the scene horizontally on both left and right sides equally. Add contextually appropriate background, environment, or scene continuation that matches the original setting. Keep the main subject centered and fully visible.`,

    // Square to Tall (1:1 → 9:16, 2:3, etc.)
    'square-to-tall': `Extend the scene vertically, adding appropriate sky/ceiling above and ground/floor below. Maintain the subject's position in the frame, ensuring proper headroom and ground space. Add environmental context above and below.`,

    // Wide to Square (16:9 → 1:1)
    'wide-to-square': `Intelligently reframe by slightly pulling back the camera to fit the full width of the scene into a square frame. Add appropriate top and bottom content (sky, ground, ceiling, floor) to fill the vertical space. Do not crop the horizontal span.`,

    // Wide to Tall (16:9 → 9:16)
    'wide-to-tall': `This is a challenging transformation. Pull back the camera view to fit the full horizontal scene width, then extend significantly above and below with contextually appropriate vertical space (sky, upper background, foreground ground). Maintain all original elements while adding substantial vertical context.`,

    // Tall to Wide (9:16 → 16:9)
    'tall-to-wide': `Pull back the camera to fit the full vertical height, then extend significantly left and right with contextually appropriate environmental content. Add background, side elements, and spatial context while preserving the original vertical composition.`,

    // Tall to Square (9:16 → 1:1)
    'tall-to-square': `Reframe by pulling the camera back to maintain full vertical height, then add horizontal context on left and right sides equally. Extend the environment and background horizontally to create a balanced square composition.`,

    // Same type (no change needed)
    'same-type': `Maintain the current aspect ratio family while adjusting to the exact target ratio. Make minimal adjustments to composition while preserving all content.`
  };

  const key = getRatioTransformKey(originalRatio, targetRatio);
  return strategies[key] || strategies['square-to-wide'];
}

function getRatioTransformKey(from: string, to: string): string {
  const ratioTypes: Record<string, string> = {
    '1:1': 'square',
    '16:9': 'wide',
    '4:3': 'wide',
    '3:2': 'wide',
    '21:9': 'wide',
    '9:16': 'tall',
    '3:4': 'tall',
    '2:3': 'tall'
  };

  const fromType = ratioTypes[from] || 'square';
  const toType = ratioTypes[to] || 'square';

  if (fromType === toType) return 'same-type';
  return `${fromType}-to-${toType}`;
}

// ============================================================================
// LIGHTING SPECIFICATIONS
// ============================================================================

export function getLightingSpecification(lightingType: string): string {
  const specifications: Record<string, string> = {
    'golden-hour': `
LIGHT SOURCE: Warm, low-angle sunlight from near the horizon (30-60 minutes after sunrise or before sunset)
COLOR TEMPERATURE: 3000-3500K (warm orange-golden tones)
QUALITY: Soft, diffused directional light with gentle shadows
CHARACTERISTICS:
- Long, soft shadows stretching away from light source
- Warm orange/golden color cast on all surfaces
- Enhanced glow on edges facing the light (rim lighting effect)
- Reduced contrast, enhanced warmth
- Slight haze or atmospheric glow
MOOD: Romantic, nostalgic, peaceful, cinematic`,

    'blue-hour': `
LIGHT SOURCE: Indirect skylight after sunset or before sunrise (civil twilight)
COLOR TEMPERATURE: 9000-12000K (cool blue tones)
QUALITY: Soft, diffused ambient light with minimal shadows
CHARACTERISTICS:
- Very soft or nearly absent shadows
- Cool blue-purple color cast throughout
- Even illumination with low contrast
- Slight luminosity in the sky area
- Deep, saturated blue tones
MOOD: Calm, mysterious, ethereal, contemplative`,

    'studio-lighting': `
LIGHT SOURCE: Controlled artificial lights (key light, fill light, back light setup)
COLOR TEMPERATURE: 5500K (neutral daylight balanced)
QUALITY: Controlled, even lighting with intentional shadows
CHARACTERISTICS:
- Clear, defined shadows with controlled hardness
- Even illumination on subject with proper exposure
- Slight rim/back lighting separating subject from background
- Minimal ambient light spill
- Professional, clean lighting setup
MOOD: Professional, clean, focused, commercial`,

    'dramatic-shadows': `
LIGHT SOURCE: Strong, directional single light source (hard light)
COLOR TEMPERATURE: Variable based on source (tungsten 3200K or daylight 5600K)
QUALITY: Hard, direct light creating strong contrast
CHARACTERISTICS:
- Deep, well-defined shadows with hard edges
- High contrast between lit and shadowed areas
- Strong highlights and deep blacks
- Dramatic light-to-shadow transitions
- Chiaroscuro effect with sculptural shadows
MOOD: Dramatic, intense, mysterious, film noir`,

    'soft-diffused': `
LIGHT SOURCE: Large, soft light source or overcast sky conditions
COLOR TEMPERATURE: 6000-6500K (slightly cool neutral)
QUALITY: Extremely soft, shadowless light wrapping around subjects
CHARACTERISTICS:
- Minimal or no visible shadows
- Very low contrast, gentle gradients
- Even illumination across all surfaces
- Soft highlights, no harsh specular reflections
- Flat but detailed lighting
MOOD: Gentle, peaceful, soft, ethereal, beauty lighting`,

    'neon-night': `
LIGHT SOURCE: Multiple colored neon lights and urban illumination
COLOR TEMPERATURE: Mixed (various neon colors: pink, blue, purple, cyan)
QUALITY: Multiple colored point sources with glow effects
CHARACTERISTICS:
- Vibrant, saturated neon color casts (magenta, cyan, purple)
- Multiple colored reflections and glows
- Dark ambient environment with bright colored accents
- Colored rim lighting from multiple directions
- Cyberpunk/urban night atmosphere
MOOD: Electric, energetic, urban, futuristic, vibrant`,

    'harsh-midday': `
LIGHT SOURCE: Direct overhead sunlight at noon
COLOR TEMPERATURE: 5500K (neutral white)
QUALITY: Hard, direct light from directly above
CHARACTERISTICS:
- Short, dark shadows directly below objects
- High contrast and intense highlights
- Minimal color temperature variation
- Strong specular reflections
- Harsh shadow-to-light transitions
MOOD: Stark, intense, unforgiving, documentary`,

    'candlelight': `
LIGHT SOURCE: Warm, flickering candle flame(s) as primary illumination
COLOR TEMPERATURE: 1800-2000K (very warm orange)
QUALITY: Soft, localized warm light with rapid falloff
CHARACTERISTICS:
- Very warm orange-amber glow
- Dramatic light falloff (bright near source, dark at distance)
- Soft shadows with warm edges
- Intimate, localized illumination
- Dark ambient environment
MOOD: Intimate, romantic, cozy, mysterious`,

    'backlit-silhouette': `
LIGHT SOURCE: Strong light source behind subject
COLOR TEMPERATURE: Variable based on background light source
QUALITY: Strong backlight creating silhouette or rim lighting
CHARACTERISTICS:
- Bright halo or rim light around subject edges
- Subject front is underexposed or in shadow
- Strong contrast between subject and background
- Glowing outline effect
- Optional lens flare or bloom
MOOD: Dramatic, mysterious, artistic, cinematic`,

    'overcast-cloudy': `
LIGHT SOURCE: Diffused sunlight through thick cloud cover
COLOR TEMPERATURE: 6500-7000K (cool neutral)
QUALITY: Extremely soft, even, shadowless light
CHARACTERISTICS:
- No visible shadows or very faint soft shadows
- Even, flat illumination across scene
- Slightly cool color temperature
- Low contrast with good detail visibility
- Muted saturation
MOOD: Calm, neutral, documentary, natural`,

    'sunset-dusk': `
LIGHT SOURCE: Setting sun near horizon with remaining daylight
COLOR TEMPERATURE: 2500-3000K (warm orange-red)
QUALITY: Directional warm light with ambient cool shadows
CHARACTERISTICS:
- Warm orange-red light on surfaces facing the setting sun
- Cool blue-purple tones in shadow areas (color contrast)
- Long directional shadows
- Gradient sky from orange to purple to blue
- Enhanced atmospheric effects
MOOD: Dramatic, ending, nostalgic, cinematic`,

    'flash-photography': `
LIGHT SOURCE: On-camera flash or speedlight
COLOR TEMPERATURE: 5500K (daylight balanced)
QUALITY: Direct, harsh frontal light
CHARACTERISTICS:
- Even frontal illumination on subject
- Short shadows directly behind subjects
- Slightly flattened appearance
- Possible red-eye or catch lights in eyes
- Dark or underexposed background
MOOD: Documentary, journalistic, snapshot, direct`
  };

  return specifications[lightingType] || specifications['studio-lighting'];
}

export function getAtmosphereMood(lightingType: string): string {
  const moods: Record<string, string> = {
    'golden-hour': 'Create a warm, romantic, and cinematic atmosphere that evokes nostalgia and beauty',
    'blue-hour': 'Create a calm, mysterious, and ethereal atmosphere with tranquil coolness',
    'studio-lighting': 'Create a professional, clean, and focused atmosphere suitable for commercial work',
    'dramatic-shadows': 'Create an intense, mysterious, and dramatic atmosphere with strong emotional impact',
    'soft-diffused': 'Create a gentle, peaceful, and flattering atmosphere perfect for beauty and portraits',
    'neon-night': 'Create an electric, vibrant, and urban atmosphere with futuristic energy',
    'harsh-midday': 'Create a stark, intense, and unforgiving atmosphere with documentary realism',
    'candlelight': 'Create an intimate, romantic, and cozy atmosphere with warmth and privacy',
    'backlit-silhouette': 'Create a dramatic, artistic, and mysterious atmosphere with strong visual impact',
    'overcast-cloudy': 'Create a calm, neutral, and natural atmosphere with even, documentary quality',
    'sunset-dusk': 'Create a dramatic, nostalgic, and cinematic atmosphere marking transition',
    'flash-photography': 'Create a direct, documentary, and journalistic atmosphere with immediacy'
  };

  return moods[lightingType] || moods['studio-lighting'];
}

// ============================================================================
// STYLE SPECIFICATIONS
// ============================================================================

export function getStyleSpecification(styleType: string): string {
  const specifications: Record<string, string> = {
    'photorealistic': `
CHARACTERISTICS:
- Hyper-realistic photographic quality indistinguishable from real photography
- Accurate lighting physics, shadows, reflections, and material properties
- Natural color accuracy and proper exposure
- Realistic depth of field, bokeh, and lens effects
- Fine surface details: skin pores, fabric texture, material imperfections
- Natural atmospheric effects and lighting
MEDIUM: Digital photography or photorealistic 3D rendering
REFERENCE: High-end professional photography, cinema-quality imagery`,

    'cinematic': `
CHARACTERISTICS:
- Film-like quality with slight color grading (teal and orange, desaturated, or moody)
- Shallow depth of field with dramatic bokeh
- Lens effects: subtle vignetting, film grain, lens flares
- Composed lighting with intentional shadows and highlights
- Aspect ratio and framing common in cinema (widescreen feel)
- Slightly enhanced contrast and saturation
MEDIUM: Digital cinema camera aesthetic
REFERENCE: Modern film cinematography, movie stills, theatrical productions`,

    'oil-painting': `
CHARACTERISTICS:
- Visible brushstrokes with varied thickness and direction
- Rich, blended colors with smooth gradients
- Impasto technique with textured paint buildup on highlights
- Classic artistic composition with painterly light and shadow
- Softer edges and forms compared to photography
- Traditional color palette and tonal relationships
MEDIUM: Oil on canvas
REFERENCE: Classical and impressionist oil paintings, museum-quality artwork`,

    'watercolor': `
CHARACTERISTICS:
- Soft, translucent washes of color with visible water bleed
- Light, airy quality with white paper showing through
- Loose, flowing brushwork with organic edges
- Color bleeding and mixing where edges meet
- Varying color intensity from light washes to saturated areas
- Visible paper texture and paint granulation
MEDIUM: Watercolor on paper
REFERENCE: Traditional watercolor illustrations, botanical art, loose watercolor sketches`,

    'anime': `
CHARACTERISTICS:
- Clean, precise linework with consistent line weight
- Flat colors with minimal shading (cel-shading technique)
- Large expressive eyes, stylized facial features (if characters present)
- Simplified forms with strategic detail placement
- Vibrant, saturated color palette
- Anime-specific lighting (screen tones, gradients)
MEDIUM: Digital anime illustration
REFERENCE: Modern anime series, manga, Japanese animation`,

    'cartoon': `
CHARACTERISTICS:
- Bold, clear outlines with consistent line weight
- Simplified shapes and exaggerated features
- Flat colors or simple cel-shading
- Playful, expressive character design (if applicable)
- Clean, readable composition with minimal texture
- Bright, appealing color palette
MEDIUM: Digital cartoon illustration
REFERENCE: Western animation, cartoon network style, comic strips`,

    'sketch': `
CHARACTERISTICS:
- Visible pencil or pen lines with varying pressure
- Crosshatching and line-based shading
- Rough, loose quality with some unfinished areas
- Minimal or no color (graphite gray or pen black)
- Paper texture visible
- Artistic construction lines may be slightly visible
MEDIUM: Pencil or pen on paper
REFERENCE: Artist sketchbooks, concept art sketches, life drawing`,

    'comic-book': `
CHARACTERISTICS:
- Bold black ink outlines with consistent line weight
- Flat colors with strategic cel-shading
- Ben-Day dots or screen tone patterns for shading
- Dynamic composition with action and movement
- Strong contrast and clear readability
- Speech bubble and panel composition awareness
MEDIUM: Comic book illustration (ink and color)
REFERENCE: Marvel/DC comic books, graphic novels, manga`,

    'pop-art': `
CHARACTERISTICS:
- Bold, vibrant colors with high saturation
- Strong contrast and flat color areas
- Ben-Day dot patterns and screen printing effects
- Thick outlines and simplified forms
- Repetition and bold graphic elements
- Mass-production aesthetic
MEDIUM: Screen printing, graphic art
REFERENCE: Andy Warhol, Roy Lichtenstein, 1960s pop art movement`,

    'impressionist': `
CHARACTERISTICS:
- Short, visible brushstrokes with broken color
- Emphasis on light and its changing qualities
- Bright, pure colors placed side-by-side (optical mixing)
- Loose, sketchy quality capturing atmosphere over detail
- Outdoor lighting and natural scenes emphasized
- Softer edges and forms
MEDIUM: Oil on canvas, impressionist technique
REFERENCE: Monet, Renoir, Pissarro, impressionist masters`,

    'art-nouveau': `
CHARACTERISTICS:
- Flowing, organic lines and curves (whiplash curves)
- Decorative, ornamental patterns inspired by nature
- Flat color areas with strong outlines
- Asymmetrical composition with elegant balance
- Natural motifs: flowers, vines, insects
- Elongated, stylized forms
MEDIUM: Illustration, poster art, decorative arts
REFERENCE: Alphonse Mucha, Gustav Klimt, art nouveau posters`,

    'cyberpunk': `
CHARACTERISTICS:
- High-tech, futuristic elements with gritty urban decay
- Neon colors (cyan, magenta, purple) with dark backgrounds
- Digital glitch effects, scanlines, chromatic aberration
- Atmospheric fog, rain, and light rays
- Holographic and digital displays
- Dark, moody lighting with vibrant neon accents
MEDIUM: Digital art, photo manipulation
REFERENCE: Blade Runner aesthetic, cyberpunk 2077, neon noir`,

    'minimalist': `
CHARACTERISTICS:
- Extremely simplified forms reduced to essential elements
- Limited color palette (often monochromatic or 2-3 colors)
- Clean lines and geometric shapes
- Ample negative space
- No unnecessary details or decoration
- Focus on composition and balance
MEDIUM: Digital vector art, graphic design
REFERENCE: Modern minimalist design, flat illustration`,

    'vintage-photo': `
CHARACTERISTICS:
- Faded, desaturated colors with yellow or sepia tones
- Film grain and slight blur
- Vignetting (darkened corners)
- Reduced contrast and softer highlights
- Slight damage effects: scratches, dust spots, light leaks
- Color shifts typical of aged film
MEDIUM: Aged photographic print or film
REFERENCE: 1960s-1980s family photos, vintage film photography`,

    'studio-ghibli': `
CHARACTERISTICS:
- Hand-drawn anime aesthetic with painterly backgrounds
- Soft, natural colors with atmospheric lighting
- Detailed, lush environments with whimsical elements
- Character designs with large expressive eyes and gentle features
- Watercolor-like rendering for skies and backgrounds
- Warm, nostalgic, and dreamlike atmosphere
MEDIUM: Traditional animation cel painting style
REFERENCE: Studio Ghibli films (Spirited Away, My Neighbor Totoro, Howl's Moving Castle)`,

    'pixel-art': `
CHARACTERISTICS:
- Visible square pixels as intentional artistic element
- Limited color palette (8-bit or 16-bit style)
- Low resolution with strategic detail placement
- Dithering for color mixing and gradients
- Clean, grid-aligned edges
- Retro video game aesthetic
MEDIUM: Digital pixel art
REFERENCE: Retro video games, pixel art animations, 8-bit/16-bit era`,

    'low-poly-3d': `
CHARACTERISTICS:
- Geometric, faceted surfaces with visible polygon edges
- Simplified 3D forms with minimal polygon count
- Flat shading on polygon faces (no smooth shading)
- Clean, modern aesthetic with angular shapes
- Solid colors or simple gradients per face
- Clear geometric construction
MEDIUM: 3D modeling with low polygon count
REFERENCE: Low-poly game art, geometric illustrations, modern 3D design`,

    'graffiti-street-art': `
CHARACTERISTICS:
- Bold, expressive spray paint aesthetic
- Vibrant colors with high saturation
- Drips, splatters, and paint texture
- Tag-style lettering and urban art elements
- Strong outlines with color fills
- Urban wall or surface texture visible
MEDIUM: Spray paint on wall/surface
REFERENCE: Street art, urban graffiti, mural art`
  };

  return specifications[styleType] || specifications['photorealistic'];
}

export function getArtisticTechnique(styleType: string): string {
  const techniques: Record<string, string> = {
    'photorealistic': 'Use accurate light physics, realistic material rendering, and photographic principles. Maintain natural perspective and optical effects.',

    'cinematic': 'Apply color grading (teal/orange or moody desaturation), shallow depth of field, and cinematic framing. Add subtle film grain and lens characteristics.',

    'oil-painting': 'Create visible brushstrokes following form and contour. Use impasto technique on highlights. Blend colors naturally with traditional color theory.',

    'watercolor': 'Apply translucent color washes with organic edges. Allow colors to bleed naturally. Use light-to-dark layering with white paper showing through.',

    'anime': 'Use clean vector-like linework. Apply flat cel-shading with 2-3 tone gradients. Emphasize eyes and hair details. Use screen tone effects for shading.',

    'cartoon': 'Create bold, consistent outlines. Use simplified shapes and exaggerated features. Apply flat colors or basic cel-shading. Prioritize readability.',

    'sketch': 'Use varied line weight based on pressure. Apply crosshatching for shading. Leave some areas loosely defined. Show construction and gesture lines subtly.',

    'comic-book': 'Create strong black ink outlines. Use flat colors with strategic shading. Apply halftone dot patterns for mid-tones. Emphasize dramatic composition.',

    'pop-art': 'Use bold, flat colors with high contrast. Apply Ben-Day dot patterns for shading. Create thick outlines. Emphasize graphic, poster-like quality.',

    'impressionist': 'Use short, broken brushstrokes of pure color. Capture light effects rather than details. Apply visible brushwork. Mix colors optically on canvas.',

    'art-nouveau': 'Create flowing, organic line work. Use flat decorative color areas. Apply nature-inspired ornamental patterns. Emphasize elegant, asymmetrical balance.',

    'cyberpunk': 'Apply neon color accents on dark backgrounds. Add digital glitch effects and chromatic aberration. Create atmospheric fog and light rays. Use high contrast.',

    'minimalist': 'Reduce to essential forms only. Use limited color palette. Create clean geometric shapes. Maximize negative space. Remove all unnecessary elements.',

    'vintage-photo': 'Apply color fading and desaturation. Add film grain and slight blur. Create vignetting. Apply subtle damage (scratches, dust). Shift colors toward warm/sepia tones.',

    'studio-ghibli': 'Use hand-drawn linework with painterly backgrounds. Apply soft watercolor-like rendering for environments. Create warm, atmospheric lighting. Use gentle character designs.',

    'pixel-art': 'Create intentionally visible square pixels. Use limited color palette with dithering. Apply grid-aligned edges. Strategic detail placement within low resolution.',

    'low-poly-3d': 'Create geometric faceted surfaces. Use flat shading per polygon face. Maintain visible polygon edges. Apply solid colors or simple gradients.',

    'graffiti-street-art': 'Apply spray paint texture with drips and splatters. Use vibrant, high-saturation colors. Create bold outlines and expressive style. Show paint texture and urban surface.'
  };

  return techniques[styleType] || techniques['photorealistic'];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all available options for a specific edit type
 */
export function getAvailableOptions(editType: string): Array<{ value: string; label: string }> {
  const options: Record<string, Array<{ value: string; label: string }>> = {
    'view-angle': [
      { value: 'front', label: 'Front View' },
      { value: 'side-left', label: 'Side View (Left)' },
      { value: 'side-right', label: 'Side View (Right)' },
      { value: 'top-down', label: 'Top-Down (Bird\'s Eye)' },
      { value: 'low-angle', label: 'Low Angle (Worm\'s Eye)' },
      { value: 'high-angle', label: 'High Angle' },
      { value: '3-4-view', label: '3/4 View' },
      { value: 'over-shoulder', label: 'Over Shoulder' },
      { value: 'dutch-angle', label: 'Dutch Angle (Tilted)' },
      { value: 'extreme-closeup', label: 'Extreme Close-Up' },
      { value: 'wide-establishing', label: 'Wide Establishing Shot' },
    ],
    'aspect-ratio': [
      { value: '1:1', label: '1:1 (Square)' },
      { value: '16:9', label: '16:9 (Widescreen)' },
      { value: '9:16', label: '9:16 (Portrait)' },
      { value: '4:3', label: '4:3 (Classic)' },
      { value: '3:4', label: '3:4 (Portrait Classic)' },
      { value: '3:2', label: '3:2 (Photo)' },
      { value: '2:3', label: '2:3 (Portrait Photo)' },
      { value: '21:9', label: '21:9 (Ultra-Wide)' },
    ],
    'lighting': [
      { value: 'golden-hour', label: 'Golden Hour' },
      { value: 'blue-hour', label: 'Blue Hour' },
      { value: 'studio-lighting', label: 'Studio Lighting' },
      { value: 'dramatic-shadows', label: 'Dramatic Shadows' },
      { value: 'soft-diffused', label: 'Soft Diffused' },
      { value: 'neon-night', label: 'Neon Night' },
      { value: 'harsh-midday', label: 'Harsh Midday' },
      { value: 'candlelight', label: 'Candlelight' },
      { value: 'backlit-silhouette', label: 'Backlit Silhouette' },
      { value: 'overcast-cloudy', label: 'Overcast Cloudy' },
      { value: 'sunset-dusk', label: 'Sunset/Dusk' },
      { value: 'flash-photography', label: 'Flash Photography' },
    ],
    'style': [
      { value: 'photorealistic', label: 'Photorealistic' },
      { value: 'cinematic', label: 'Cinematic' },
      { value: 'oil-painting', label: 'Oil Painting' },
      { value: 'watercolor', label: 'Watercolor' },
      { value: 'anime', label: 'Anime' },
      { value: 'cartoon', label: 'Cartoon' },
      { value: 'sketch', label: 'Sketch' },
      { value: 'comic-book', label: 'Comic Book' },
      { value: 'pop-art', label: 'Pop Art' },
      { value: 'impressionist', label: 'Impressionist' },
      { value: 'art-nouveau', label: 'Art Nouveau' },
      { value: 'cyberpunk', label: 'Cyberpunk' },
      { value: 'minimalist', label: 'Minimalist' },
      { value: 'vintage-photo', label: 'Vintage Photo' },
      { value: 'studio-ghibli', label: 'Studio Ghibli' },
      { value: 'pixel-art', label: 'Pixel Art' },
      { value: 'low-poly-3d', label: 'Low Poly 3D' },
      { value: 'graffiti-street-art', label: 'Graffiti/Street Art' },
    ]
  };

  return options[editType] || [];
}

/**
 * Validate if an edit value is valid for the given edit type
 */
export function isValidEditValue(editType: string, value: string): boolean {
  const options = getAvailableOptions(editType);
  return options.some(option => option.value === value);
}

/**
 * Get a human-readable description for an edit
 */
export function getEditDescription(editType: string, value: string): string {
  const options = getAvailableOptions(editType);
  const option = options.find(opt => opt.value === value);
  return option ? option.label : value;
}
