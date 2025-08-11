# Piktor API Quick Reference - Updated Models

## Image Generation Endpoints

### 1. Generate Images with Edits
**Endpoint**: `POST /api/generate-images-edits`
**Model**: `gpt-image-1`
**Use Case**: Generate product variations with enhanced editing capabilities

```javascript
// Request body
{
  productConfiguration: ProductConfiguration,
  generationParams: {
    contextPreset: 'packshot' | 'lifestyle' | 'hero' | 'story' | 'instagram' | 'detail',
    variations: number,
    quality: 'high' | 'medium' | 'low'
  }
}

// Response
{
  success: true,
  result: {
    variations: [{
      url: string, // base64 data URL
      prompt: string,
      metadata: {
        model: 'gpt-image-1',
        quality: string,
        contextPreset: string
      }
    }]
  }
}
```

### 2. Batch Image Processing
**Endpoint**: `POST /api/generate-images-batch`
**Model**: `gpt-image-1` (editing)
**Use Case**: Process multiple images with reference-based editing

```javascript
// Form data with image file and settings
const formData = new FormData();
formData.append('image', imageFile);
formData.append('productConfiguration', JSON.stringify(config));
formData.append('uiSettings', JSON.stringify(settings));
```

### 3. Hybrid Generation
**Endpoint**: `POST /api/generate-images-hybrid`
**Model**: `gpt-image-1` (generation + editing)
**Use Case**: Combine text-to-image and reference-based generation

### 4. GPT-4o Enhanced Generation
**Endpoint**: `POST /api/generate-images-gpt-4o`
**Model**: `gpt-image-1`
**Use Case**: High-quality generation with comprehensive prompts

### 5. Single Image Generation
**Endpoint**: `POST /api/generate-image`
**Model**: `gpt-image-1`
**Use Case**: Generate single images from detailed prompts

## Image Analysis Endpoints

### 1. Product Profile Analysis
**Endpoint**: `POST /api/analyze-product-profile`
**Model**: `gpt-4o-2024-08-06`
**Use Case**: Multi-image product analysis with structured output

```javascript
// Form data with multiple images
const formData = new FormData();
formData.append('image_0', imageFile1);
formData.append('image_1', imageFile2);
// ... more images

// Response
{
  success: true,
  profile: {
    type: string,
    materials: string[],
    primaryColor: { name: string, hex: string },
    style: string,
    features: Array<{
      name: string,
      description: string,
      confidence: number
    }>,
    textToImagePrompts: {
      baseDescription: string,
      packshot: string,
      lifestyle: string,
      detailed: string
    }
  }
}
```

### 2. Single Image Analysis
**Endpoint**: `POST /api/analyze-image`
**Model**: `gpt-4o`
**Use Case**: Analyze single product image with detailed profiling

```javascript
// Form data
const formData = new FormData();
formData.append('file', imageFile);
formData.append('outputType', 'json_profile');
formData.append('textOverlay', JSON.stringify(overlayData));
```

## Quality Settings

### GPT Image 1 Quality Options
- **`high`**: Maximum quality, higher cost, best for final production
- **`medium`**: Balanced quality/cost, good for most use cases
- **`low`**: Fast generation, lower cost, suitable for previews

### Image Sizes
- **Square**: `1024x1024` (Instagram, packshot, detail)
- **Horizontal**: `1536x1024` (Hero, lifestyle banners)
- **Vertical**: `1024x1536` (Stories, mobile-optimized)

## Context Presets

### Available Presets
- **`packshot`**: Clean product shots, e-commerce ready
- **`lifestyle`**: Products in real environments
- **`hero`**: Marketing banners, dramatic compositions
- **`story`**: Vertical mobile format
- **`instagram`**: Square social media format
- **`detail`**: Close-up material and craftsmanship focus

## Error Handling

### Common Error Responses
```javascript
{
  error: string,
  details?: string,
  additionalInfo?: {
    issue: string,
    solution: string
  }
}
```

### Status Codes
- **400**: Invalid request parameters
- **429**: Rate limit exceeded
- **500**: Server/API error

## Best Practices

### 1. Image Generation
- Use `medium` quality for development/testing
- Use `high` quality for production images
- Include detailed prompts for better results
- Specify context preset for optimized outputs

### 2. Image Analysis
- Provide high-quality input images (min 512px)
- Use multiple images for comprehensive analysis
- Include product context in analysis requests

### 3. Performance
- Cache analysis results to avoid re-processing
- Use appropriate quality settings for use case
- Monitor API usage and costs
- Implement proper error handling and retries

### 4. Integration
- Handle base64 responses appropriately
- Store generated images if needed for later use
- Validate response formats before processing
- Implement loading states for better UX

## Testing Endpoints

### Test GPT Image 1
**Endpoint**: `GET /api/test-gpt-image`
**Use Case**: Verify gpt-image-1 API connectivity and response format

```javascript
// Response includes test generation and format validation
{
  success: true,
  hasData: boolean,
  dataLength: number,
  hasB64Json: boolean,
  imageUrl: string // test image data URL
}
```

This reference provides all the essential information for working with Piktor's updated OpenAI model integration.