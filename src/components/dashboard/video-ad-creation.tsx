"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload,
  Video,
  Loader2,
  AlertCircle,
  Info,
  Download,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedImage {
  file: File;
  url: string;
  name: string;
}

export function VideoAdCreation() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [prompt, setPrompt] = useState("Create a cinematic advertisement showcasing this furniture product in a modern, elegant setting. Show the product from multiple angles with smooth camera movements, professional lighting, and an upscale atmosphere.");
  const [duration, setDuration] = useState("4");
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'coming_soon' | 'available'>('unknown');
  const [showApiInfo, setShowApiInfo] = useState(true);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Veuillez télécharger un fichier image");
      return;
    }

    const url = URL.createObjectURL(file);
    setUploadedImage({ file, url, name: file.name });
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError("Veuillez télécharger une image");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setApiStatus('unknown');

    try {
      const formData = new FormData();
      formData.append("image", uploadedImage.file);
      formData.append("prompt", prompt);
      formData.append("seconds", duration);

      const response = await fetch("/api/generate-video", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Échec de la génération vidéo");
      }

      if (data.success && data.videoUrl) {
        setGeneratedVideo(data.videoUrl);
        setApiStatus('available');
        setShowApiInfo(false); // Hide info banner on successful generation
      }
    } catch (err) {
      console.error("Video generation error:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedVideo) return;

    try {
      const response = await fetch(generatedVideo);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `piktor-ad-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      setError("Échec du téléchargement");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Créer une publicité vidéo</h1>
        <p className="text-muted-foreground">
          Générez des publicités vidéo professionnelles pour vos meubles avec l&apos;IA OpenAI Sora
        </p>
      </div>

      {/* API Status Info Banner */}
      {showApiInfo && (
        <Card className="mb-6 p-4 border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Mode test - Génération vidéo avec OpenAI Sora 2
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Cette fonctionnalité est en mode test local. Générez des publicités vidéo IA professionnelles
                pour vos meubles en téléchargeant une image et en décrivant le style souhaité.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiInfo(false)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              Fermer
            </Button>
          </div>
        </Card>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Upload & Settings */}
        <div className="space-y-6">
          {/* Upload Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">1. Télécharger l&apos;image du produit</h2>

            {!uploadedImage ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                  isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                )}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Glissez-déposez votre image ici
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  ou cliquez pour parcourir
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG jusqu&apos;à 10MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={uploadedImage.url}
                    alt={uploadedImage.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  Changer l&apos;image
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </Card>

          {/* Settings Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">2. Configurer la vidéo</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="duration">Durée de la vidéo</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 secondes</SelectItem>
                    <SelectItem value="8">8 secondes</SelectItem>
                    <SelectItem value="12">12 secondes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Choisissez la durée de votre publicité vidéo
                </p>
              </div>

              <div>
                <Label htmlFor="prompt">Description de la publicité</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="resize-none"
                  placeholder="Décrivez le style et l'ambiance de votre publicité..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Décrivez comment vous voulez que votre produit soit mis en valeur dans la vidéo
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!uploadedImage || isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5 mr-2" />
                    Générer la vidéo
                  </>
                )}
              </Button>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Preview & Download */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">3. Aperçu et téléchargement</h2>

            {!generatedVideo && !isGenerating && (
              <div className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Votre vidéo apparaîtra ici</p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Génération de votre vidéo...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cela peut prendre quelques minutes
                  </p>
                </div>
              </div>
            )}

            {generatedVideo && (
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <video
                    src={generatedVideo}
                    controls
                    className="w-full h-full"
                    autoPlay
                    loop
                  >
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGeneratedVideo(null);
                      setUploadedImage(null);
                      setError(null);
                      setApiStatus('unknown');
                    }}
                  >
                    Nouvelle vidéo
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Info Card */}
          <Card className="p-4 mt-6 bg-muted/50">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-2">
                <p className="font-medium">À propos de la génération vidéo</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Propulsé par OpenAI Sora</li>
                  <li>Résolution 1080p en 16:9</li>
                  <li>Génération en 2-5 minutes</li>
                  <li>Coût: 10-25 crédits selon durée</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
