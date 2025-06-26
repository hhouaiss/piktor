import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Share, RefreshCw } from "lucide-react";

const generatedImages = [
  {
    id: 1,
    type: "Packshot",
    prompt: "Modern oak desk with white studio background and professional lighting",
    status: "completed",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    type: "Lifestyle",
    prompt: "Cozy home office setup with natural lighting and plants",
    status: "generating",
    createdAt: "2024-01-15T10:35:00Z",
  },
  {
    id: 3,
    type: "Instagram",
    prompt: "Square format desk image with bright, engaging styling",
    status: "pending",
    createdAt: "2024-01-15T10:40:00Z",
  },
];

export default function PreviewPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">AI Image Preview</h1>
          <p className="text-muted-foreground">
            Review and download your AI-generated furniture images
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generation Queue</CardTitle>
                <CardDescription>
                  Track the status of your image generation requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generatedImages.map((image) => (
                    <div
                      key={image.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              image.status === "completed"
                                ? "default"
                                : image.status === "generating"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {image.type}
                          </Badge>
                          <Badge
                            variant={
                              image.status === "completed"
                                ? "default"
                                : image.status === "generating"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {image.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {image.prompt}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {image.status === "completed" && (
                          <>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Share className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {image.status === "generating" && (
                          <Button size="sm" variant="outline" disabled>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generate New Images</CardTitle>
                <CardDescription>
                  Create additional variations or try different styles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm">
                      Packshot
                    </Button>
                    <Button variant="outline" size="sm">
                      Lifestyle
                    </Button>
                    <Button variant="outline" size="sm">
                      Instagram
                    </Button>
                  </div>
                  <Button className="w-full">Generate Images</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Image Preview</CardTitle>
                <CardDescription>
                  Preview and compare generated images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Generated Image Preview</p>
                  </div>
                  <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Alternative Version</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Image Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolution:</span>
                    <span>1920x1080</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format:</span>
                    <span>PNG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Style:</span>
                    <span>Modern Minimalist</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Generated:</span>
                    <span>2 minutes ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}