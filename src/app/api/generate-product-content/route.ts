import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProductContentRequest {
  productName: string;
  existingDescription?: string;
  fileType?: 'csv' | 'pdf' | 'image';
  extractedData?: string;
}

export async function POST(request: NextRequest) {
  let body: ProductContentRequest | undefined;
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file" 
      }, { status: 500 });
    }

    body = await request.json();
    const { productName, existingDescription, fileType, extractedData } = body || {};

    if (!productName?.trim()) {
      return NextResponse.json({ 
        error: "Product name is required" 
      }, { status: 400 });
    }

    // Build the prompt based on available data
    let prompt = `Generate SEO-optimized e-commerce product content for "${productName}". Return ONLY a valid JSON object with this exact structure:

{
  "name": "improved product name (if needed)",
  "description": "compelling 100-150 word product description that highlights benefits and features",
  "features": [
    "bullet point feature 1",
    "bullet point feature 2", 
    "bullet point feature 3",
    "bullet point feature 4",
    "bullet point feature 5"
  ],
  "metaTitle": "SEO title under 60 characters",
  "metaDescription": "SEO meta description under 160 characters", 
  "tags": [
    "relevant keyword 1",
    "relevant keyword 2",
    "relevant keyword 3",
    "relevant keyword 4"
  ]
}

Guidelines:
- Description should focus on benefits and value proposition
- Features should be specific and compelling
- Meta title should include primary keywords
- Meta description should be enticing for search results
- Tags should be relevant for SEO and categorization
- Tone should be professional yet engaging
- Avoid overly promotional language`;

    // Add context based on existing data
    if (existingDescription?.trim()) {
      prompt += `\n\nExisting description to improve: "${existingDescription}"`;
    }

    if (extractedData?.trim()) {
      prompt += `\n\nAdditional context from uploaded ${fileType}: ${extractedData}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert e-commerce copywriter specializing in SEO-optimized product content. Generate compelling, accurate product descriptions that convert browsers into buyers."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    let productContent;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.includes('```')) {
        cleanContent = content.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      productContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Invalid JSON response from OpenAI");
    }

    // Validate the response structure
    const requiredFields = ['name', 'description', 'features', 'metaTitle', 'metaDescription', 'tags'];
    for (const field of requiredFields) {
      if (!productContent[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return NextResponse.json({
      success: true,
      content: productContent,
      metadata: {
        processedAt: new Date().toISOString(),
        model: "gpt-4o",
        inputProductName: productName,
        hasExistingDescription: !!existingDescription,
        fileType: fileType || null,
      },
    });

  } catch (error) {
    console.error("Product content generation error:", error);
    
    // Fallback to mock data if OpenAI fails  
    const fallbackName = body?.productName || "Premium Product";
    const mockContent = {
      name: fallbackName,
      description: `Experience the exceptional quality and innovative design of our ${fallbackName.toLowerCase()}. Crafted with attention to detail and built to last, this product combines functionality with style to meet your everyday needs. Perfect for both personal and professional use, it offers reliability and performance that exceeds expectations.`,
      features: [
        "Premium quality materials for durability",
        "Innovative design meets functionality", 
        "Easy to use and maintain",
        "Versatile for multiple applications",
        "Excellent value for money"
      ],
      metaTitle: `${fallbackName} - Quality & Performance`,
      metaDescription: `Discover our premium ${fallbackName.toLowerCase()} with innovative design, quality materials, and exceptional performance. Perfect for your needs.`,
      tags: ["premium", "quality", "durable", "innovative"]
    };

    return NextResponse.json({
      success: true,
      content: mockContent,
      metadata: {
        processedAt: new Date().toISOString(),
        fallback: true,
        error: error instanceof Error ? error.message : "Unknown error",
        inputProductName: fallbackName,
      },
    });
  }
}