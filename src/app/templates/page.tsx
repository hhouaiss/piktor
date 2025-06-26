import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const templates = [
  {
    id: 1,
    name: "Modern Minimalist",
    description: "Clean lines, neutral colors, professional lighting",
    category: "Packshot",
    aesthetic: "modern, minimal, clean",
    keywords: ["white background", "soft lighting", "professional"],
    preview: "/api/placeholder/300/200",
  },
  {
    id: 2,
    name: "Cozy Home Office",
    description: "Warm lighting, lifestyle setting, home environment",
    category: "Lifestyle",
    aesthetic: "cozy, warm, inviting",
    keywords: ["home setting", "warm lighting", "plants"],
    preview: "/api/placeholder/300/200",
  },
  {
    id: 3,
    name: "Instagram Ready",
    description: "Square format, trendy styling, social media optimized",
    category: "Instagram",
    aesthetic: "trendy, bright, engaging",
    keywords: ["square format", "bright colors", "social media"],
    preview: "/api/placeholder/300/200",
  },
  {
    id: 4,
    name: "Corporate Professional",
    description: "Business environment, formal setting, executive style",
    category: "Lifestyle",
    aesthetic: "professional, formal, executive",
    keywords: ["office setting", "business", "formal"],
    preview: "/api/placeholder/300/200",
  },
  {
    id: 5,
    name: "Scandinavian Style",
    description: "Light wood tones, bright spaces, Nordic aesthetic",
    category: "Lifestyle",
    aesthetic: "scandinavian, bright, airy",
    keywords: ["light wood", "bright space", "nordic"],
    preview: "/api/placeholder/300/200",
  },
  {
    id: 6,
    name: "Product Showcase",
    description: "High-contrast lighting, detailed focus, commercial quality",
    category: "Packshot",
    aesthetic: "commercial, detailed, high-quality",
    keywords: ["high contrast", "detailed", "commercial"],
    preview: "/api/placeholder/300/200",
  },
];

export default function TemplatesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Brand Templates</h1>
          <p className="text-muted-foreground">
            Pre-designed templates to maintain consistent styling across your product images
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <div className="aspect-[3/2] bg-muted/50 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Preview Image</p>
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{template.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Aesthetic</p>
                    <p className="text-sm text-muted-foreground">{template.aesthetic}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {template.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      Use Template
                    </Button>
                    <Button size="sm" variant="outline">
                      Preview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Create Custom Template</CardTitle>
              <CardDescription>
                Build your own brand template with custom settings and save it for future use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg">Create New Template</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}