import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ProductConfiguration, ContextPreset, TextToImagePrompts, UiSettings } from "@/components/image-generator/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerationParams {
  contextPreset: ContextPreset;
  variations: number;
  quality: 'high' | 'medium' | 'low';
}

// GPT-image-1 size mappings
const getGptImageSize = (contextPreset: ContextPreset): "1024x1024" | "1024x1792" | "1792x1024" => {
  switch (contextPreset) {
    case 'story':
      return "1024x1792"; // Vertical for stories
    case 'hero':
    case 'lifestyle':
      return "1792x1024"; // Horizontal for banners
    case 'packshot':
    case 'instagram':
    case 'detail':
    default:
      return "1024x1024"; // Square for social media
  }
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file" 
      }, { status: 500 });
    }

    const { productConfiguration, generationParams } = await request.json();
    
    if (!productConfiguration) {
      return NextResponse.json({ error: "No product configuration provided" }, { status: 400 });
    }

    const config = productConfiguration as ProductConfiguration;
    const params = generationParams as GenerationParams;

    // Validate that we have enhanced analysis data
    if (!config.productImages.fusedProfile) {
      return NextResponse.json({ 
        error: "No product analysis found. Please analyze your product images first." 
      }, { status: 400 });
    }

    if (!config.productImages.fusedProfile.textToImagePrompts) {
      return NextResponse.json({ 
        error: "Enhanced product analysis required. Please re-analyze your product images with the updated system.",
        debug: {
          hasProfile: !!config.productImages.fusedProfile,
          profileKeys: config.productImages.fusedProfile ? Object.keys(config.productImages.fusedProfile) : [],
          analysisVersion: config.productImages.fusedProfile?.analysisVersion,
        }
      }, { status: 400 });
    }

    if (!config.productImages.fusedProfile.textToImagePrompts.baseDescription) {
      return NextResponse.json({ 
        error: "Incomplete enhanced analysis data. Missing baseDescription. Please re-analyze your product images.",
        debug: {
          hasTextToImagePrompts: !!config.productImages.fusedProfile.textToImagePrompts,
          textToImagePromptsKeys: config.productImages.fusedProfile.textToImagePrompts ? Object.keys(config.productImages.fusedProfile.textToImagePrompts) : [],
        }
      }, { status: 400 });
    }

    const profile = config.productImages.fusedProfile;

    // Build comprehensive prompt for GPT-image-1
    const detailedPrompt = buildGptImagePrompt(
      profile.textToImagePrompts as TextToImagePrompts, 
      params.contextPreset, 
      config.uiSettings
    );

    console.log(`Generating ${params.variations} ${params.contextPreset} images using GPT-image-1`);
    console.log(`Prompt length: ${detailedPrompt.length} characters`);
    console.log(`Product: ${config.productImages.productName}`);

    // Note: Removed prompt length validation - using comprehensive prompts for better quality
    console.log(`Using comprehensive prompt with ${detailedPrompt.length} characters for superior image generation`);

    const size = getGptImageSize(params.contextPreset);
    
    // Generate images using GPT-image-1  
    const qualityMapping = {
      'high': 'high' as const,
      'medium': 'medium' as const, 
      'low': 'low' as const
    };
    
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: detailedPrompt,
      n: params.variations,
      size: size,
      quality: qualityMapping[params.quality],
    });

    const variations = (response.data || []).map((imageData, index) => ({
      url: imageData.url || `data:image/png;base64,${imageData.b64_json}`,
      prompt: detailedPrompt,
      metadata: {
        model: "gpt-image-1",
        timestamp: new Date().toISOString(),
        size: size,
        quality: params.quality,
        variation: index + 1,
        contextPreset: params.contextPreset,
        generationMethod: "text-to-image" as const,
      },
    }));

    const result = {
      productConfigId: config.id,
      productName: config.productImages.productName,
      contextPreset: params.contextPreset,
      variations,
      generationDetails: {
        sourceImageCount: config.productImages.images.length,
        profileSource: 'gpt-4o-multi-image-analysis',
        prompt: detailedPrompt,
        promptLength: detailedPrompt.length,
        model: 'gpt-image-1',
        generationMethod: 'text-to-image'
      }
    };

    return NextResponse.json({
      success: true,
      result,
      metadata: {
        productName: config.productImages.productName,
        contextPreset: params.contextPreset,
        variationsGenerated: variations.length,
        model: 'gpt-image-1',
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("GPT-image-1 generation error:", error);
    
    // Enhanced error handling for OpenAI API issues
    let userError = "Unknown error occurred during generation";
    let statusCode = 500;
    let additionalInfo = {};
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
      });
      
      // Check for OpenAI API response errors
      if ('response' in error) {
        const apiError = error as Error & { response?: { status?: number; data?: unknown } };
        console.error('OpenAI API Response:', {
          status: apiError.response?.status,
          data: apiError.response?.data,
        });
        
        if (apiError.response?.status === 400) {
          statusCode = 400;
          userError = "Invalid request to GPT-image-1";
          additionalInfo = {
            issue: "The prompt or parameters were not accepted by GPT-image-1",
            solution: "Try simplifying the prompt or adjusting generation parameters"
          };
        } else if (apiError.response?.status === 429) {
          statusCode = 429;
          userError = "API rate limit exceeded";
          additionalInfo = {
            issue: "Too many requests to OpenAI API",
            solution: "Please wait a moment before trying again"
          };
        }
      }
      
      if (userError === "Unknown error occurred during generation") {
        userError = error.message;
      }
    }
    
    return NextResponse.json({
      error: userError,
      details: error instanceof Error ? error.stack : undefined,
      ...additionalInfo
    }, { status: statusCode });
  }
}

function buildGptImagePrompt(
  textPrompts: TextToImagePrompts,
  contextPreset: ContextPreset,
  uiSettings: UiSettings
): string {
  const baseDescription = textPrompts.baseDescription || "Professional product image";
  const contextPrompt = (contextPreset in textPrompts ? textPrompts[contextPreset] : null) || textPrompts.packshot || "Clean product shot";
  const photographySpecs = textPrompts.photographySpecs || {
    cameraAngle: 'Professional three-quarter view',
    lightingSetup: 'Professional studio lighting',
    depthOfField: 'Product in sharp focus',
    composition: 'Balanced professional composition'
  };
  const visualDetails = textPrompts.visualDetails || {
    materialTextures: 'High-quality materials',
    colorPalette: 'Accurate product colors',
    hardwareDetails: 'Detailed hardware elements',
    proportionalRelationships: 'Correct product proportions'
  };

  // Build COMPREHENSIVE prompt for GPT-image-1 - NO length restrictions
  let prompt = `${contextPrompt}

COMPREHENSIVE PRODUCT DESCRIPTION:
${baseDescription}

DETAILED VISUAL SPECIFICATIONS:
MATERIALS & TEXTURES:
${visualDetails.materialTextures || 'High-quality materials with professional finish, smooth surfaces with appropriate reflectivity for the material type, consistent texture patterns throughout the product'}

COLOR PALETTE & CHARACTERISTICS:
${visualDetails.colorPalette || 'Accurate product colors with natural lighting response, consistent hue and saturation across all surfaces, appropriate highlight and shadow color variations'}

HARDWARE & CONSTRUCTION DETAILS:
${visualDetails.hardwareDetails || 'Detailed hardware elements including fasteners, joints, connections, and structural components, all rendered with appropriate material properties and finishes'}

PROPORTIONAL RELATIONSHIPS & GEOMETRY:
${visualDetails.proportionalRelationships || 'Correct product proportions maintaining structural integrity, balanced visual weight distribution, authentic scale relationships between all components'}

COMPREHENSIVE PHOTOGRAPHY SPECIFICATIONS:
CAMERA POSITIONING & ANGLES:
${photographySpecs.cameraAngle || 'Professional three-quarter view capturing the product\'s dimensional qualities, optimal perspective showing key features and proportions, appropriate viewing height for the product type'}

LIGHTING SETUP & CHARACTERISTICS:
${photographySpecs.lightingSetup || 'Professional studio lighting with key light at 45-degree angle, fill light to reduce harsh shadows, rim light for edge definition, appropriate contrast ratio for commercial photography'}

DEPTH OF FIELD & FOCUS:
${photographySpecs.depthOfField || 'Product in sharp focus throughout with appropriate depth of field for commercial photography, background elements softly blurred to emphasize product, critical details rendered with maximum clarity'}

COMPOSITION & VISUAL BALANCE:
${photographySpecs.composition || 'Balanced professional composition following rule of thirds, appropriate negative space for visual breathing room, product positioned for optimal visual impact and commercial appeal'}

ENHANCED CONTEXT SETTINGS:
BACKGROUND TREATMENT:
- Style: ${uiSettings.backgroundStyle || 'neutral professional background'}
- Texture: Smooth, non-distracting surface that complements the product
- Color: Carefully selected to enhance product colors without competition
- Lighting: Even illumination preventing unwanted shadows or hotspots

PRODUCT POSITIONING:
- Placement: ${uiSettings.productPosition || 'center-positioned for optimal visual balance'}
- Orientation: Optimal angle showcasing key features and design elements
- Stability: Product appears naturally positioned and structurally sound
- Scale: Appropriate size within frame for maximum visual impact

LIGHTING ATMOSPHERE:
- Primary Light: ${uiSettings.lighting?.replace('_', ' ') || 'soft daylight balanced lighting'}
- Color Temperature: Consistent throughout the scene, appropriate for product type
- Shadow Quality: Soft, natural shadows that enhance dimensionality without distraction
- Highlight Management: Controlled reflections that enhance rather than obscure product details`;

  // Add comprehensive context-specific requirements
  switch (contextPreset) {
    case 'packshot':
      prompt += `\n\nCOMPREHENSIVE PACKSHOT REQUIREMENTS:
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
- Sharp detail throughout with professional depth of field management`;
      break;
      
    case 'lifestyle':
      prompt += `\n\nCOMPREHENSIVE LIFESTYLE REQUIREMENTS:
ENVIRONMENTAL CONTEXT:
- Authentic home environment that naturally accommodates the product
- Realistic room setting with appropriate scale and proportions
- Complementary interior design elements that enhance rather than compete
- Natural material combinations (wood, fabric, metal) creating warmth and authenticity

LIGHTING CONDITIONS:
- Natural daylight streaming through windows with soft, diffused quality
- Warm ambient lighting creating inviting atmosphere
- Subtle shadows that add depth without obscuring product details
- Color temperature variations creating natural indoor lighting conditions

SCENE COMPOSITION:
- Product integrated organically into living space
- Contextual props that suggest actual use and lifestyle appeal
- Lived-in atmosphere with subtle signs of daily life and comfort
- Visual flow that leads the eye naturally to the product

ATMOSPHERIC QUALITIES:
- Warm, welcoming mood that suggests comfort and quality of life
- Authentic styling that resonates with target demographic
- Seasonal or time-of-day suggestions through lighting and color palette
- Emotional connection through carefully curated environmental details`;
      break;
      
    case 'hero':
      prompt += `\n\nCOMPREHENSIVE HERO BANNER REQUIREMENTS:
DRAMATIC COMPOSITION:
- Bold, impactful visual design suitable for website headers and marketing
- Strong diagonal or triangular composition creating dynamic visual tension
- Careful balance between product prominence and negative space
- Visual hierarchy that immediately draws attention to key product features

PROFESSIONAL LIGHTING DESIGN:
- Dramatic lighting setup with controlled contrast and shadows
- Rim lighting or backlighting creating separation and visual pop
- Strategic highlight placement emphasizing premium quality and craftsmanship
- Color temperature and mood appropriate for brand positioning

COMMERCIAL APPEAL FACTORS:
- High-end commercial photography quality suitable for premium marketing
- Visual impact that communicates value proposition at first glance
- Sophisticated color palette and tonal relationships
- Professional styling that reinforces brand credibility and market position

TECHNICAL SPECIFICATIONS:
- Optimal aspect ratio for web banner placement and responsive design
- Strategic negative space placement for text overlay accommodation
- Visual flow that supports typical banner text placement patterns
- Scalability considerations for various device sizes and applications`;
      break;
      
    case 'story':
      prompt += `\n\nCOMPREHENSIVE STORY FORMAT REQUIREMENTS:
MOBILE-OPTIMIZED COMPOSITION:
- Vertical aspect ratio optimized for smartphone viewing and social media stories
- Product positioned in upper two-thirds for maximum visibility above UI elements
- Clear focal hierarchy with immediate product identification
- Visual elements sized appropriately for small screen viewing

SOCIAL MEDIA ENGAGEMENT:
- Eye-catching visual appeal that stops scrolling behavior
- Bright, vibrant lighting that reproduces well on mobile screens
- Strong contrast and color saturation for maximum impact
- Contemporary styling that resonates with social media audiences

VISUAL STORYTELLING:
- Narrative elements that suggest lifestyle and product benefits
- Emotional resonance through color, mood, and environmental context
- Authentic moments that feel genuine rather than overly staged
- Visual hooks that encourage sharing and engagement

TECHNICAL OPTIMIZATION:
- Lighting balanced for various mobile screen types and brightness settings
- Color palette that reproduces consistently across different devices
- Sharp details that remain clear even at compressed file sizes
- Composition that works effectively with story UI overlay elements`;
      break;
      
    case 'instagram':
      prompt += `\n\nCOMPREHENSIVE INSTAGRAM POST REQUIREMENTS:
SQUARE COMPOSITION OPTIMIZATION:
- Perfectly balanced square format composition with strong central focus
- Product positioned for maximum impact within Instagram's square crop
- Visual elements arranged to work effectively in feed thumbnail size
- Composition that remains compelling when viewed at various sizes

SOCIAL MEDIA VISUAL APPEAL:
- Contemporary aesthetic that aligns with current Instagram trends
- Color palette optimized for mobile screen viewing and feed aesthetics
- Professional quality balanced with approachable, authentic feel
- Visual style that encourages likes, comments, and sharing behavior

LIGHTING FOR DIGITAL PLATFORMS:
- Bright, even lighting that reproduces well across different mobile devices
- Color temperature balanced for Instagram's compression algorithms
- Sufficient contrast to maintain visual impact in busy social feeds
- Detail preservation that survives social media image processing

ENGAGEMENT OPTIMIZATION:
- Thumb-stopping visual appeal that stands out in crowded feeds
- Aspirational quality that encourages saving and sharing
- Brand-appropriate aesthetic that builds recognition and trust
- Visual storytelling that invites audience connection and interaction`;
      break;
      
    case 'detail':
      prompt += `\n\nCOMPREHENSIVE DETAIL SHOT REQUIREMENTS:
CLOSE-UP FOCUS:
- Extreme close-up perspective showcasing product craftsmanship and material quality
- Macro-level detail rendering showing texture, grain, weave, or surface characteristics
- Sharp focus on specific product features that demonstrate quality and construction
- Minimal background distractions to emphasize product details

MATERIAL SHOWCASE:
- High-resolution rendering of material properties and surface textures
- Accurate representation of surface treatments, finishes, and manufacturing quality
- Detail visibility of joints, seams, stitching, or connection points
- Hardware elements shown with precision including screws, brackets, or fasteners

CRAFTSMANSHIP EMPHASIS:
- Visual evidence of quality construction and attention to detail
- Manufacturing precision visible in edges, tolerances, and finish quality
- Brand markers, model numbers, or quality indicators clearly readable
- Professional detail photography suitable for quality assurance documentation

TECHNICAL EXCELLENCE:
- Maximum magnification while maintaining photographic quality
- Professional lighting to eliminate shadows in detailed areas
- Edge-to-edge sharpness with appropriate depth of field control
- Commercial quality suitable for technical documentation and marketing`;
      break;
  }

  // Add comprehensive quality requirements
  prompt += `\n\nCOMPREHENSIVE QUALITY STANDARDS:
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
- Visual consistency that integrates seamlessly with existing brand asset libraries`;

  return prompt.trim();
}

// Removed optimizeGptImagePrompt function - we're now using comprehensive prompts without length restrictions