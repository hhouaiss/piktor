"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Settings,
  Palette,
  Image as ImageIcon,
  Download,
  Bell,
  Zap,
  Save,
  RotateCcw,
  CheckCircle
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface SettingsData {
  defaultStyle: string;
  defaultEnvironment: string;
  defaultLighting: string;
  defaultFormats: string[];
  imageQuality: string;
  autoDownload: boolean;
  notifications: {
    email: boolean;
    browser: boolean;
    generationComplete: boolean;
    weeklyReport: boolean;
  };
  preferences: {
    showTutorials: boolean;
    compactMode: boolean;
    autoSave: boolean;
  };
}

const defaultSettings: SettingsData = {
  defaultStyle: "moderne",
  defaultEnvironment: "salon",
  defaultLighting: "naturelle",
  defaultFormats: ["instagram-post", "ecommerce"],
  imageQuality: "haute",
  autoDownload: false,
  notifications: {
    email: true,
    browser: true,
    generationComplete: true,
    weeklyReport: false
  },
  preferences: {
    showTutorials: true,
    compactMode: false,
    autoSave: true
  }
};

export function DashboardSettings() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('piktor_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }

    trackEvent('settings_viewed', {
      event_category: 'dashboard',
      event_label: 'settings_page_view'
    });
  }, []);

  const updateSettings = (updates: Partial<SettingsData>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateNestedSettings = <K extends keyof SettingsData>(
    key: K, 
    nestedKey: keyof SettingsData[K], 
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [nestedKey]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save to localStorage (replace with API call)
      localStorage.setItem('piktor_settings', JSON.stringify(settings));
      
      // TODO: Save to API
      // await fetch('/api/settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock API delay
      
      setLastSaved(new Date());
      setHasChanges(false);
      
      trackEvent('settings_saved', {
        event_category: 'dashboard',
        event_label: 'settings_save'
      });
      
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres par défaut ?')) {
      setSettings(defaultSettings);
      setHasChanges(true);
      
      trackEvent('settings_reset', {
        event_category: 'dashboard',
        event_label: 'settings_reset'
      });
    }
  };

  const formatOptions = [
    { value: "instagram-post", label: "Instagram Post" },
    { value: "instagram-story", label: "Instagram Story" },
    { value: "facebook", label: "Facebook" },
    { value: "ecommerce", label: "E-commerce" },
    { value: "print", label: "Print" },
    { value: "web-banner", label: "Bannière Web" }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            Paramètres
          </h1>
          <p className="text-muted-foreground mt-1">
            Personnalisez vos préférences de génération et notifications
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
            className="bg-gradient-ocean-deep hover:opacity-90 text-white"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>

      {lastSaved && !hasChanges && (
        <div className="flex items-center text-sm text-success-600 bg-success-50 p-3 rounded-lg">
          <CheckCircle className="w-4 h-4 mr-2" />
          Paramètres sauvegardés le {lastSaved.toLocaleString('fr-FR')}
        </div>
      )}

      {/* Generation Defaults */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Palette className="w-5 h-5 mr-2" />
          Paramètres par défaut de génération
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="defaultStyle">Style par défaut</Label>
            <Select 
              value={settings.defaultStyle} 
              onValueChange={(value) => updateSettings({ defaultStyle: value })}
            >
              <SelectTrigger id="defaultStyle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moderne">Moderne</SelectItem>
                <SelectItem value="rustique">Rustique</SelectItem>
                <SelectItem value="industriel">Industriel</SelectItem>
                <SelectItem value="scandinave">Scandinave</SelectItem>
                <SelectItem value="boheme">Bohème</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="defaultEnvironment">Environnement par défaut</Label>
            <Select 
              value={settings.defaultEnvironment} 
              onValueChange={(value) => updateSettings({ defaultEnvironment: value })}
            >
              <SelectTrigger id="defaultEnvironment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salon">Salon</SelectItem>
                <SelectItem value="bureau">Bureau</SelectItem>
                <SelectItem value="cuisine">Cuisine</SelectItem>
                <SelectItem value="chambre">Chambre</SelectItem>
                <SelectItem value="studio">Studio photo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="defaultLighting">Éclairage par défaut</Label>
            <Select 
              value={settings.defaultLighting} 
              onValueChange={(value) => updateSettings({ defaultLighting: value })}
            >
              <SelectTrigger id="defaultLighting">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="naturelle">Naturelle</SelectItem>
                <SelectItem value="chaleureuse">Chaleureuse</SelectItem>
                <SelectItem value="professionnelle">Professionnelle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="imageQuality">Qualité d'image</Label>
            <Select 
              value={settings.imageQuality} 
              onValueChange={(value) => updateSettings({ imageQuality: value })}
            >
              <SelectTrigger id="imageQuality">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (plus rapide)</SelectItem>
                <SelectItem value="haute">Haute qualité (recommandé)</SelectItem>
                <SelectItem value="ultra">Ultra haute (plus lent)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6">
          <Label className="text-base font-medium mb-3 block">Formats par défaut</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {formatOptions.map((format) => (
              <div key={format.value} className="flex items-center space-x-2">
                <Switch
                  id={format.value}
                  checked={settings.defaultFormats.includes(format.value)}
                  onCheckedChange={(checked) => {
                    const newFormats = checked
                      ? [...settings.defaultFormats, format.value]
                      : settings.defaultFormats.filter(f => f !== format.value);
                    updateSettings({ defaultFormats: newFormats });
                  }}
                />
                <Label htmlFor={format.value} className="text-sm">
                  {format.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Download Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Download className="w-5 h-5 mr-2" />
          Téléchargements
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Téléchargement automatique</Label>
              <p className="text-sm text-muted-foreground">
                Télécharger automatiquement les images une fois générées
              </p>
            </div>
            <Switch
              checked={settings.autoDownload}
              onCheckedChange={(checked) => updateSettings({ autoDownload: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notifications
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Notifications par email</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des emails pour les mises à jour importantes
              </p>
            </div>
            <Switch
              checked={settings.notifications.email}
              onCheckedChange={(checked) => 
                updateNestedSettings('notifications', 'email', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Notifications navigateur</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications push dans le navigateur
              </p>
            </div>
            <Switch
              checked={settings.notifications.browser}
              onCheckedChange={(checked) => 
                updateNestedSettings('notifications', 'browser', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Génération terminée</Label>
              <p className="text-sm text-muted-foreground">
                Être notifié quand vos visuels sont prêts
              </p>
            </div>
            <Switch
              checked={settings.notifications.generationComplete}
              onCheckedChange={(checked) => 
                updateNestedSettings('notifications', 'generationComplete', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Rapport hebdomadaire</Label>
              <p className="text-sm text-muted-foreground">
                Résumé de votre activité chaque semaine
              </p>
            </div>
            <Switch
              checked={settings.notifications.weeklyReport}
              onCheckedChange={(checked) => 
                updateNestedSettings('notifications', 'weeklyReport', checked)
              }
            />
          </div>
        </div>
      </Card>

      {/* Interface Preferences */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Préférences d'interface
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Afficher les tutoriels</Label>
              <p className="text-sm text-muted-foreground">
                Montrer les conseils et astuces dans l'interface
              </p>
            </div>
            <Switch
              checked={settings.preferences.showTutorials}
              onCheckedChange={(checked) => 
                updateNestedSettings('preferences', 'showTutorials', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Mode compact</Label>
              <p className="text-sm text-muted-foreground">
                Interface plus dense avec moins d'espacement
              </p>
            </div>
            <Switch
              checked={settings.preferences.compactMode}
              onCheckedChange={(checked) => 
                updateNestedSettings('preferences', 'compactMode', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Sauvegarde automatique</Label>
              <p className="text-sm text-muted-foreground">
                Sauvegarder automatiquement vos projets en cours
              </p>
            </div>
            <Switch
              checked={settings.preferences.autoSave}
              onCheckedChange={(checked) => 
                updateNestedSettings('preferences', 'autoSave', checked)
              }
            />
          </div>
        </div>
      </Card>

      {/* Save Changes Notice */}
      {hasChanges && (
        <div className="sticky bottom-6 bg-card border border-border rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Vous avez des modifications non sauvegardées
            </p>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-gradient-ocean-deep hover:opacity-90 text-white"
            >
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}