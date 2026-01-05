/**
 * ENHANCED CAMERA ANGLE SPECIFICATIONS FOR IMAGE EDITING
 *
 * Professional photography-grade camera angle instructions optimized for Gemini 2.5 Flash
 * Based on proven success patterns from initial generation prompts
 *
 * Key Principles:
 * - Precise technical measurements (degrees, distances, ratios)
 * - Multi-layered instructions (position + lens + composition + constraints)
 * - Professional photography terminology
 * - Explicit constraints to prevent unwanted variations
 * - Reference to real-world photography standards
 */

export interface EnhancedAngleInstruction {
  /** Technical camera positioning instruction */
  cameraPosition: string;

  /** Lens behavior and optical characteristics */
  lensSpecification: string;

  /** Compositional rules and framing */
  compositionRules: string;

  /** Explicit constraints - what NOT to do */
  constraints: string[];

  /** Professional photography reference standard */
  photographyStandard: string;

  /** Quality assurance checks */
  qualityChecks: string[];
}

/**
 * Get enhanced camera angle instruction with professional photography specifications
 */
export function getEnhancedAngleInstruction(angleType: string): EnhancedAngleInstruction {
  const specifications: Record<string, EnhancedAngleInstruction> = {
    'frontal': {
      cameraPosition: 'Position camera on central axis directly facing the subject, lens optical center aligned with subject center point, camera height matching subject midpoint elevation. Zero degrees horizontal rotation from subject face plane, zero degrees vertical tilt from horizon line. Maintain perpendicular alignment: camera sensor plane parallel to subject front surface.',

      lensSpecification: 'Standard focal length equivalent to 50-85mm full-frame (natural perspective, minimal distortion). Focus plane parallel to subject surface. Consistent edge-to-edge sharpness across entire subject width and height.',

      compositionRules: 'Subject perfectly centered in frame with symmetrical negative space on all sides. Horizon line (if visible) level and parallel to frame edges. Subject vertical axes parallel to frame vertical edges. Equal padding: minimum 10% frame margin on all sides.',

      constraints: [
        'NO camera rotation off-axis (0 degrees yaw required)',
        'NO camera tilt up or down (0 degrees pitch required)',
        'NO Dutch angle or roll tilt (0 degrees roll required)',
        'NO perspective distortion or converging lines',
        'NO off-center composition or asymmetrical framing',
        'NO lens barrel or pincushion distortion visible'
      ],

      photographyStandard: 'Catalog photography standard: Direct frontal elevation following commercial product photography protocols. Camera mounted on precision tripod with spirit level verification. Professional headshot/passport photo alignment methodology.',

      qualityChecks: [
        'Verify subject faces camera dead-center with zero rotation',
        'Confirm all vertical lines are truly vertical (parallel to frame edges)',
        'Ensure symmetrical composition with equal negative space',
        'Check for any unintended perspective distortion or tilt'
      ]
    },

    '45-degree': {
      cameraPosition: 'Position camera at precisely 45-degree horizontal angle from subject central front-facing axis. Camera height at subject midpoint or slightly above (5-15 degrees elevated). Distance: 1.5-2x subject width for optimal perspective. Three-quarter view capturing 50% front surface + 50% side surface simultaneously.',

      lensSpecification: 'Standard to short telephoto focal length (70-105mm full-frame equivalent) to compress perspective naturally. Moderate depth of field (f/5.6-f/8 equivalent) with primary focus on front edge, secondary focus carrying through to back edge. Minimal wide-angle distortion.',

      compositionRules: 'Position subject along rule-of-thirds intersection (not dead center). Front-facing surface occupies left or right third of frame, side surface extends toward center. Leading lines created by visible edges should draw eye through composition. Negative space on opposite side balances composition.',

      constraints: [
        'NO deviation from 45-degree angle (not 30°, not 60° - exactly 45°)',
        'NO straight-on frontal view or pure side profile',
        'NO extreme perspective distortion from wide angle lens',
        'NO converging vertical lines (furniture must remain vertical)',
        'NO camera placed too high (bird\'s eye) or too low (worm\'s eye)',
        'NO loss of dimensional depth perception'
      ],

      photographyStandard: 'Commercial furniture photography standard: Classic three-quarter view angle optimal for dimensional representation. Professional studio setup with precision angle measurement using protractor or laser guide. Industry standard for catalogs, e-commerce hero shots, and architectural visualization.',

      qualityChecks: [
        'Verify exactly 45° angle - both front and side surfaces equally visible',
        'Confirm vertical edges remain perfectly vertical (no keystoning)',
        'Ensure depth and dimensionality are clearly communicated',
        'Check that composition follows rule of thirds with balanced negative space'
      ]
    },

    'top-down': {
      cameraPosition: 'Position camera directly overhead looking straight down at 90-degree angle to ground plane. Lens optical axis perpendicular to floor/table surface. Camera sensor plane parallel to subject top surface. Zero horizontal rotation - maintain consistent north-south orientation. Elevation: 1.5-2.5x subject maximum dimension above surface.',

      lensSpecification: 'Wide-angle to standard focal length (24-50mm full-frame equivalent) for spatial context. Extended depth of field (f/8-f/11 equivalent) ensuring sharp focus from nearest to farthest subject elements. Minimal lens distortion correction applied.',

      compositionRules: 'Subject centered in frame with symmetrical negative space on all sides. Grid-like layout if multiple elements present. Flat-lay composition style with organized arrangement. Negative space provides breathing room and context - minimum 15% margin around subject perimeter.',

      constraints: [
        'NO tilted or angled overhead view (must be exactly 90° down)',
        'NO visible horizon line or background walls (only top and floor visible)',
        'NO perspective convergence or vanishing points',
        'NO camera rotation during capture (maintain orientation consistency)',
        'NO shadows falling toward camera (light from camera position)',
        'NO three-dimensional perspective (pure orthographic-style view)'
      ],

      photographyStandard: 'Flat-lay photography standard: Instagram-style top-down composition commonly used in food photography, fashion flat-lays, and knolling arrangements. Copy stand or overhead rig with precision vertical alignment. Often used with grid overlay for perfect organization.',

      qualityChecks: [
        'Verify pure top-down view with zero tilt in any direction',
        'Confirm no visible front, side, or back surfaces (only top visible)',
        'Ensure symmetrical composition with organized arrangement',
        'Check that lighting is even with minimal directional shadows'
      ]
    },

    'side-left': {
      cameraPosition: 'Position camera at exactly 90-degree angle to subject front face, capturing pure left-side profile. Camera on left side of subject when facing it. Lens optical center aligned with subject vertical midline. Camera height matching subject midpoint elevation. Perpendicular alignment: camera sensor parallel to subject left side surface.',

      lensSpecification: 'Standard to short telephoto focal length (70-100mm full-frame equivalent) for natural perspective compression. Flat focus plane parallel to side surface. Minimize wide-angle distortion that exaggerates depth.',

      compositionRules: 'Subject occupies center two-thirds of frame showing complete left profile from front edge to back edge. Silhouette clearly defined. Vertical elements perfectly vertical. Front and back extremities visible within frame with balanced negative space.',

      constraints: [
        'NO rotation toward or away from pure 90° side view (not 80°, not 100°)',
        'NO three-quarter view showing any portion of front face',
        'NO rear-quarter view showing any portion of back',
        'NO camera tilt creating perspective distortion',
        'NO cropping of front or rear extremities',
        'NO converging vertical lines (must remain parallel)'
      ],

      photographyStandard: 'Architectural elevation drawing photography: Pure orthographic side elevation commonly used in technical documentation, architectural photography, and furniture specification sheets. Mimics technical drawing standards where side profile shows true proportions.',

      qualityChecks: [
        'Verify pure 90° side view with zero rotation',
        'Confirm complete side profile visible from front to back edge',
        'Ensure all vertical lines are perfectly vertical',
        'Check that depth dimension (front-to-back) is clearly visible'
      ]
    },

    'side-right': {
      cameraPosition: 'Position camera at exactly 90-degree angle to subject front face, capturing pure right-side profile. Camera on right side of subject when facing it. Lens optical center aligned with subject vertical midline. Camera height matching subject midpoint elevation. Perpendicular alignment: camera sensor parallel to subject right side surface.',

      lensSpecification: 'Standard to short telephoto focal length (70-100mm full-frame equivalent) for natural perspective compression. Flat focus plane parallel to side surface. Minimize wide-angle distortion that exaggerates depth.',

      compositionRules: 'Subject occupies center two-thirds of frame showing complete right profile from front edge to back edge. Silhouette clearly defined. Vertical elements perfectly vertical. Front and back extremities visible within frame with balanced negative space.',

      constraints: [
        'NO rotation toward or away from pure 90° side view (not 80°, not 100°)',
        'NO three-quarter view showing any portion of front face',
        'NO rear-quarter view showing any portion of back',
        'NO camera tilt creating perspective distortion',
        'NO cropping of front or rear extremities',
        'NO converging vertical lines (must remain parallel)'
      ],

      photographyStandard: 'Architectural elevation drawing photography: Pure orthographic side elevation commonly used in technical documentation, architectural photography, and furniture specification sheets. Mimics technical drawing standards where side profile shows true proportions.',

      qualityChecks: [
        'Verify pure 90° side view with zero rotation',
        'Confirm complete side profile visible from front to back edge',
        'Ensure all vertical lines are perfectly vertical',
        'Check that depth dimension (front-to-back) is clearly visible'
      ]
    },

    'low-angle': {
      cameraPosition: 'Position camera below subject eye level, tilted upward at 30-45 degree elevation angle from horizontal plane. Camera height: 30-40% of subject height above ground. Horizontal distance: 1.2-1.8x subject width. Creates dramatic upward perspective typical of worm\'s eye view or hero shot.',

      lensSpecification: 'Standard to slightly wide focal length (35-50mm full-frame equivalent) to enhance dramatic perspective. Moderate depth of field maintaining sharpness from bottom to top. Slight wide-angle perspective exaggeration acceptable for dramatic effect.',

      compositionRules: 'Subject appears to tower over viewer with strong vertical emphasis. Bottom of subject larger in frame than top due to perspective convergence. Sky or ceiling visible above subject. Foreground elements may be included for scale reference. Subject positioned in frame with upward-reaching visual flow.',

      constraints: [
        'NO extreme upward tilt exceeding 50° (creates unnatural distortion)',
        'NO placement below 25° elevation (too subtle, not impactful)',
        'NO eye-level or high-angle perspective',
        'NO severe keystoning that makes verticals converge excessively',
        'NO loss of subject top portions due to extreme angle',
        'NO camera placement too close causing unflattering distortion'
      ],

      photographyStandard: 'Cinematic hero shot standard: Low-angle perspective used in advertising to convey power, monumentality, and importance. Common in automotive photography, architectural drama shots, and product hero imagery. Creates aspirational, imposing visual impact.',

      qualityChecks: [
        'Verify 30-45° upward camera tilt for optimal drama',
        'Confirm subject appears powerful and imposing',
        'Ensure top of subject still visible and recognizable',
        'Check that vertical convergence enhances rather than distorts'
      ]
    },

    'high-angle': {
      cameraPosition: 'Position camera above subject looking downward at 30-45 degree depression angle from horizontal plane. Camera height: 150-180% of subject height. Horizontal distance: 1.5-2x subject width. Creates compressed perspective showing more floor/surface and environmental context.',

      lensSpecification: 'Standard focal length (50-70mm full-frame equivalent) to avoid excessive compression. Extended depth of field (f/8-f/11 equivalent) to keep subject and floor/table surface in focus. Minimal distortion for accurate representation.',

      compositionRules: 'Subject appears smaller and more vulnerable with visible floor/surface around it. Top surface detail visible. Environmental context emphasized. Subject positioned off-center with negative space showing surroundings. Downward diagonal visual flow.',

      constraints: [
        'NO extreme high angle exceeding 50° (becomes top-down view)',
        'NO shallow angle below 25° (too subtle, appears like error)',
        'NO pure top-down flat-lay perspective',
        'NO loss of subject front face (should still be partially visible)',
        'NO excessive compression making subject appear flat',
        'NO camera too close creating unflattering distortion'
      ],

      photographyStandard: 'Editorial high-angle standard: Common in interior design photography, lifestyle shots, and overview imagery. Provides context and environment while maintaining subject recognizability. Creates diminutive, approachable feeling versus low-angle\'s power.',

      qualityChecks: [
        'Verify 30-45° downward camera angle for optimal effect',
        'Confirm both top and front surfaces partially visible',
        'Ensure environmental context visible (floor, nearby objects)',
        'Check that subject maintains visual interest despite smaller scale'
      ]
    },

    '3-4-view': {
      cameraPosition: 'Position camera at 45-degree horizontal angle from subject front axis (three-quarter view) combined with 15-25 degree elevated perspective. Creates classic product photography angle showing front, side, and top surfaces simultaneously. Distance: 1.5-2x subject width for natural perspective.',

      lensSpecification: 'Standard to short telephoto (70-105mm full-frame equivalent) for flattering perspective compression. Moderate depth of field (f/5.6-f/8) with focus priority on front edge. Minimal wide-angle distortion to maintain accurate proportions.',

      compositionRules: 'Subject positioned along rule-of-thirds gridlines showing approximately 50% front face, 30% side, 20% top surface. Front-facing corner as hero element positioned at thirds intersection. Diagonal leading lines created by visible edges. Balanced asymmetrical composition.',

      constraints: [
        'NO pure frontal view (0°) or pure side view (90°)',
        'NO extreme angles deviating significantly from 45° horizontal',
        'NO flat eye-level placement (must include elevated perspective)',
        'NO top-down view (elevation should be 15-25° maximum)',
        'NO converging vertical lines (furniture legs/posts remain vertical)',
        'NO loss of three-dimensional depth perception'
      ],

      photographyStandard: 'Premium product photography standard: Industry-standard three-quarter elevated view used in high-end furniture catalogs, e-commerce hero shots, and professional product photography. Maximizes dimensional information while maintaining attractive composition. Used by IKEA, West Elm, and major furniture brands.',

      qualityChecks: [
        'Verify 45° horizontal rotation showing three surfaces',
        'Confirm 15-25° elevation showing slight top surface',
        'Ensure vertical elements remain perfectly vertical',
        'Check that composition follows rule of thirds with visual interest'
      ]
    },

    'extreme-closeup': {
      cameraPosition: 'Position camera very close to subject - typically 20-40cm from surface. Focus on specific detail, texture, or feature filling 70-90% of frame. Camera angle perpendicular to detail surface for maximum clarity. Macro-style perspective with shallow depth of field.',

      lensSpecification: 'Macro or telephoto lens equivalent (90-150mm full-frame) for close focus capability. Very shallow depth of field (f/2.8-f/4 equivalent) with precise focus on hero detail. Background defocused for subject isolation. High magnification showing fine texture detail.',

      compositionRules: 'Feature detail fills majority of frame with minimal negative space. Rule of thirds for detail placement within frame. Defocused background provides context without distraction. Texture, material, or craftsmanship detail as primary subject.',

      constraints: [
        'NO wide shots showing complete product (macro detail only)',
        'NO deep depth of field showing full context (must be selective focus)',
        'NO camera distance exceeding 50cm (won\'t achieve macro effect)',
        'NO loss of critical focus on hero detail',
        'NO distracting sharp background elements',
        'NO motion blur or focus softness on primary subject'
      ],

      photographyStandard: 'Macro product detail photography: Used in luxury product marketing to showcase craftsmanship, materials, and quality. Common in jewelry, watch, furniture detail, and high-end product photography where material quality is selling point.',

      qualityChecks: [
        'Verify extreme magnification showing fine detail',
        'Confirm razor-sharp focus on hero element',
        'Ensure background is beautifully defocused (bokeh)',
        'Check that texture and material quality are clearly visible'
      ]
    },

    'wide-establishing': {
      cameraPosition: 'Position camera at significant distance from subject: 3-5x subject width away. Slightly elevated perspective (10-20° above horizon). Wide field of view capturing subject in full environmental context. Subject occupies 20-40% of frame with significant negative space showing setting.',

      lensSpecification: 'Wide-angle focal length (24-35mm full-frame equivalent) for expansive field of view. Extended depth of field (f/8-f/11 equivalent) keeping subject and environment both sharp. Moderate wide-angle distortion acceptable for environmental context.',

      compositionRules: 'Subject positioned within frame following rule of thirds. Significant negative space showing room, background, environment. Context tells story about product usage, scale, setting. Balanced composition with subject and environment both contributing to narrative.',

      constraints: [
        'NO tight framing with product filling frame',
        'NO extreme wide angle causing excessive distortion (stay 24mm+ equivalent)',
        'NO subject occupying more than 50% of frame',
        'NO cluttered or distracting background elements',
        'NO loss of subject visibility due to distance',
        'NO shallow depth of field (environment must be recognizable)'
      ],

      photographyStandard: 'Lifestyle establishing shot standard: Interior design and lifestyle photography showing product in situ within room context. Common in magazine editorial, real estate photography, and aspirational lifestyle marketing. Tells visual story beyond just product.',

      qualityChecks: [
        'Verify wide field of view showing complete environment',
        'Confirm subject clearly visible despite small frame percentage',
        'Ensure environment adds context and tells story',
        'Check that composition is balanced with good negative space'
      ]
    },

    'over-shoulder': {
      cameraPosition: 'Position camera behind partial foreground element (shoulder, edge, or reference object) looking past it toward main subject. Creates depth through layered foreground-midground-background composition. Camera height and angle as if looking from another person\'s perspective over their shoulder.',

      lensSpecification: 'Standard to short telephoto (50-85mm full-frame equivalent) for natural human-eye perspective. Shallow to moderate depth of field (f/2.8-f/5.6) with focus on background subject, foreground element softly defocused. Creates layered depth.',

      compositionRules: 'Foreground element occupies 15-25% of frame (typically one side), defocused but recognizable. Main subject in background sharp and well-composed. Creates voyeuristic, narrative perspective as if viewer is present in scene. Diagonal or layered composition.',

      constraints: [
        'NO foreground element in sharp focus (must be defocused)',
        'NO foreground element obscuring more than 30% of frame',
        'NO equal focus on foreground and background (must be selective)',
        'NO direct frontal view without perspective layering',
        'NO loss of main subject visibility due to foreground obstruction',
        'NO camera placement that doesn\'t simulate human viewing position'
      ],

      photographyStandard: 'Cinematic perspective standard: Common in film, video, and narrative photography to create immersive first-person or observer perspective. Adds human element and depth through foreground framing. Creates connection and context.',

      qualityChecks: [
        'Verify foreground element present but defocused',
        'Confirm main subject in background is sharp focus',
        'Ensure composition creates depth through layering',
        'Check that perspective feels natural and human-like'
      ]
    },

    'dutch-angle': {
      cameraPosition: 'Rotate camera on roll axis by 15-30 degrees while maintaining same horizontal and vertical positioning as standard shot. Creates diagonal horizon line and tilted vertical elements. Used for dynamic energy, tension, or creative impact.',

      lensSpecification: 'Standard focal length (50-70mm full-frame equivalent) as tilt provides sufficient visual interest. Normal depth of field (f/5.6-f/8). Tilt is compositional choice, not lens behavior.',

      compositionRules: 'Subject positioned along diagonal lines created by tilt. Leading lines and edges emphasize diagonal composition. High-contrast composition with dynamic visual energy. Asymmetrical balance along diagonal axis.',

      constraints: [
        'NO extreme tilt exceeding 35° (appears accidental rather than intentional)',
        'NO subtle tilt under 12° (appears like leveling error)',
        'NO level horizon line (must show clear intentional tilt)',
        'NO combination with extreme high or low angles (one effect at a time)',
        'NO subject cropping that creates visual confusion',
        'NO use with subjects where level is critical to understanding'
      ],

      photographyStandard: 'Dynamic commercial photography: Used in action sports, creative advertising, and dramatic product photography. Named after Dutch Expressionist cinema. Creates tension, energy, urgency. Overuse can appear gimmicky - use deliberately.',

      qualityChecks: [
        'Verify 15-30° intentional camera roll tilt',
        'Confirm diagonal composition is visually compelling',
        'Ensure tilt enhances rather than confuses',
        'Check that subject remains recognizable despite unusual angle'
      ]
    }
  };

  return specifications[angleType] || specifications['frontal'];
}

/**
 * Build complete camera angle instruction for Gemini prompt
 * Optimized for Gemini 3 Pro Image with narrative-based structure
 */
export function buildCameraAnglePrompt(angleType: string): string {
  const spec = getEnhancedAngleInstruction(angleType);

  // Narrative-based prompt following Gemini best practices
  let prompt = `Position the camera following professional photography standards: ${spec.cameraPosition} `;
  prompt += `Use ${spec.lensSpecification} `;
  prompt += `Compose the frame with ${spec.compositionRules} `;

  // Add constraints as natural prohibitions
  if (spec.constraints.length > 0) {
    prompt += `Critical constraints to maintain photographic integrity: `;
    prompt += spec.constraints.map(c => c.replace(/^NO /, 'avoid ')).join(', ');
    prompt += `. `;
  }

  // Add photography standard as target quality
  prompt += `Execute this as ${spec.photographyStandard.toLowerCase()}`;

  return prompt;
}

/**
 * Map old angle values to new enhanced system
 */
export function mapLegacyAngle(legacyAngle: string): string {
  const mapping: Record<string, string> = {
    'frontal': 'frontal',
    '45-degree': '45-degree',
    'top-down': 'top-down',
    'perspective': '3-4-view', // Legacy "perspective" maps to three-quarter view
    'custom': 'frontal' // Fallback for custom
  };

  return mapping[legacyAngle] || 'frontal';
}
