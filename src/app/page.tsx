import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-screen-2xl">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Transform Your Furniture Images with AI
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Upload images and 3D models of your desks to generate consistent, professional packshots, lifestyle images, and social media visuals powered by AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/upload">Start Creating</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/templates">View Templates</Link>
          </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 mb-16">
        <Card>
          <CardHeader>
            <CardTitle>Upload & Analyze</CardTitle>
            <CardDescription>
              Upload images from multiple angles or 3D models of your furniture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our AI analyzes visual attributes like color, material, dimensions, and style to understand your product.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate Prompts</CardTitle>
            <CardDescription>
              AI-generated JSON prompts optimized for GPT-4o
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automatically create detailed prompts for packshots, lifestyle images, and Instagram-ready visuals.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand Consistency</CardTitle>
            <CardDescription>
              Maintain consistent styling across all your product images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Save brand templates and ensure all generated images align with your home office furniture aesthetic.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="text-center bg-muted rounded-lg p-12">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-muted-foreground mb-6">
          Join the future of furniture marketing with AI-powered image generation.
        </p>
        <Button size="lg" asChild>
          <Link href="/upload">Upload Your First Image</Link>
        </Button>
      </section>
    </div>
  );
}
