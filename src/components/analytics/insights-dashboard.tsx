"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Eye, Download, Heart, Share2, Clock, BarChart3, Users, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
  totalGenerations: number;
  totalDownloads: number;
  averageQualityScore: number;
  favoriteImages: number;
  popularStyles: Array<{ style: string; count: number; trend: number }>;
  generationTrends: Array<{ date: string; count: number }>;
  qualityDistribution: Array<{ range: string; count: number }>;
  timeToGenerate: {
    average: number;
    fastest: number;
    slowest: number;
  };
  conversionMetrics: {
    uploadToGenerate: number;
    generateToDownload: number;
    downloadToShare: number;
  };
}

interface InsightsDashboardProps {
  data: AnalyticsData;
  className?: string;
}

export function InsightsDashboard({ data, className = "" }: InsightsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    // Generate AI insights based on data
    const generatedInsights = [
      data.averageQualityScore > 85 ? "🎯 Your images consistently score above 85/100 - excellent quality!" : "💡 Try experimenting with different styles to improve quality scores.",
      data.conversionMetrics.uploadToGenerate > 80 ? "✅ Great upload-to-generation rate! Users love your workflow." : "🔧 Consider simplifying the upload process to improve conversion.",
      data.popularStyles[0] ? `🔥 ${data.popularStyles[0].style} style is trending with ${data.popularStyles[0].count} generations.` : "📊 No style trends available yet.",
      data.timeToGenerate.average < 60 ? "⚡ Lightning fast generation times keep users engaged." : "⏱️ Consider optimizing generation speed for better user experience.",
    ];
    setInsights(generatedInsights);
  }, [data]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Insights</h2>
          <p className="text-muted-foreground">Track your AI image generation performance</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{data.totalGenerations.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Generations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Download className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{data.totalDownloads.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{data.averageQualityScore}/100</p>
                <p className="text-sm text-muted-foreground">Avg Quality</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{data.favoriteImages.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Favorites</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Track user journey from upload to download</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Upload → Generate</span>
              <span>{data.conversionMetrics.uploadToGenerate}%</span>
            </div>
            <Progress value={data.conversionMetrics.uploadToGenerate} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generate → Download</span>
              <span>{data.conversionMetrics.generateToDownload}%</span>
            </div>
            <Progress value={data.conversionMetrics.generateToDownload} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Download → Share</span>
              <span>{data.conversionMetrics.downloadToShare}%</span>
            </div>
            <Progress value={data.conversionMetrics.downloadToShare} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Popular Styles */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Styles</CardTitle>
          <CardDescription>Most requested image styles and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.popularStyles.slice(0, 5).map((style, index) => (
              <div key={style.style} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
                    {index + 1}
                  </span>
                  <span className="font-medium">{style.style}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {style.count} generations
                  </span>
                  {style.trend > 0 && (
                    <Badge className="bg-green-100 text-green-700">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +{style.trend}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Generation Speed</CardTitle>
            <CardDescription>Average time to generate images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Average</span>
              <span className="font-medium">{data.timeToGenerate.average}s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Fastest</span>
              <span className="font-medium text-green-600">{data.timeToGenerate.fastest}s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Slowest</span>
              <span className="font-medium text-red-600">{data.timeToGenerate.slowest}s</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quality Distribution</CardTitle>
            <CardDescription>Breakdown of image quality scores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.qualityDistribution.map((range) => (
              <div key={range.range} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{range.range}</span>
                  <span>{range.count} images</span>
                </div>
                <Progress value={(range.count / data.totalGenerations) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Insights</CardTitle>
          <CardDescription>Actionable recommendations based on your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Example usage component
export function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    // In a real app, this would fetch from your analytics API
    const mockData: AnalyticsData = {
      totalGenerations: 1250,
      totalDownloads: 890,
      averageQualityScore: 87,
      favoriteImages: 234,
      popularStyles: [
        { style: "Modern Living Room", count: 345, trend: 12 },
        { style: "Minimalist Office", count: 278, trend: 8 },
        { style: "Cozy Bedroom", count: 189, trend: -3 },
        { style: "Scandinavian Kitchen", count: 156, trend: 15 },
        { style: "Industrial Workspace", count: 134, trend: 5 }
      ],
      generationTrends: [],
      qualityDistribution: [
        { range: "90-100", count: 425 },
        { range: "80-89", count: 520 },
        { range: "70-79", count: 245 },
        { range: "60-69", count: 60 }
      ],
      timeToGenerate: {
        average: 45,
        fastest: 23,
        slowest: 87
      },
      conversionMetrics: {
        uploadToGenerate: 85,
        generateToDownload: 71,
        downloadToShare: 23
      }
    };
    
    setAnalyticsData(mockData);
  }, []);

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return <InsightsDashboard data={analyticsData} />;
}