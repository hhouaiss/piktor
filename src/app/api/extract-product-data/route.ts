import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file" 
      }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let extractedContent = "";
    let fileType = "";

    // Handle different file types
    if (file.type.startsWith("image/")) {
      fileType = "image";
      extractedContent = await extractFromImage(file);
    } else if (file.type === "text/csv") {
      fileType = "csv";
      extractedContent = await extractFromCSV(file);
    } else if (file.type === "application/pdf") {
      fileType = "pdf";
      extractedContent = await extractFromPDF(file);
    } else {
      return NextResponse.json({ 
        error: "Unsupported file type. Please upload CSV, PDF, or image files." 
      }, { status: 400 });
    }

    // Generate product content using the extracted data
    const productResponse = await fetch(`${request.nextUrl.origin}/api/generate-product-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productName: `Product from ${file.name.split('.')[0]}`,
        extractedData: extractedContent,
        fileType: fileType,
      }),
    });

    const productData = await productResponse.json();

    if (!productData.success) {
      throw new Error("Failed to generate product content");
    }

    return NextResponse.json({
      success: true,
      product: productData.content,
      metadata: {
        filename: file.name,
        size: file.size,
        type: file.type,
        fileType: fileType,
        processedAt: new Date().toISOString(),
        extractedContentLength: extractedContent.length,
      },
    });

  } catch (error) {
    console.error("Product extraction error:", error);
    
    // Fallback with basic product data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const filename = file?.name || "Unknown";
    
    const fallbackProduct = {
      name: `Product from ${filename.split('.')[0]}`,
      description: `High-quality product extracted from uploaded file. This item offers excellent value and functionality for your needs.`,
      features: [
        "Quality construction",
        "Reliable performance", 
        "User-friendly design",
        "Competitive pricing",
        "Excellent customer support"
      ],
      metaTitle: `${filename.split('.')[0]} - Premium Quality Product`,
      metaDescription: `Discover our premium product with excellent features and reliable performance. Perfect for your needs.`,
      tags: ["premium", "quality", "reliable", "value"]
    };

    return NextResponse.json({
      success: true,
      product: fallbackProduct,
      metadata: {
        filename: filename,
        size: file?.size || 0,
        type: file?.type || "unknown",
        processedAt: new Date().toISOString(),
        fallback: true,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

async function extractFromImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const mimeType = file.type;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this product image and extract all visible product information. Focus on:
            - Product name/type
            - Key features visible
            - Materials/construction details
            - Colors and finishes
            - Any text or labels
            - Dimensions if visible
            - Use case or category
            
            Return a detailed description of what you see that could be used to create compelling product content.`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`
            }
          }
        ]
      }
    ],
    max_tokens: 500,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content || "Could not extract data from image";
}

async function extractFromCSV(file: File): Promise<string> {
  const text = await file.text();
  
  // Basic CSV parsing - take first few rows as sample
  const lines = text.split('\n').slice(0, 10);
  const headers = lines[0]?.split(',') || [];
  const sampleRows = lines.slice(1, 4);
  
  let extractedInfo = `CSV Data Summary:\nHeaders: ${headers.join(', ')}\n\nSample Data:\n`;
  sampleRows.forEach((row, index) => {
    extractedInfo += `Row ${index + 1}: ${row}\n`;
  });
  
  return extractedInfo;
}

async function extractFromPDF(file: File): Promise<string> {
  // For now, return a placeholder since PDF parsing would require additional libraries
  // In a real implementation, you'd use a library like pdf-parse
  
  return `PDF file detected: ${file.name}. Size: ${(file.size / 1024).toFixed(1)}KB. This appears to be a product document or catalog page that would contain product specifications, descriptions, and technical details.`;
}