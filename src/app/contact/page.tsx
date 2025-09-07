"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
    alert("Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.");
    setFormData({ name: "", email: "", company: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sophisticated-gray-50 via-white to-ocean-blue-50/30 dark:from-sophisticated-gray-950 dark:via-sophisticated-gray-900 dark:to-sophisticated-gray-800">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-ocean-deep rounded-xl flex items-center justify-center shadow-md">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-sophisticated-gray-900 via-ocean-blue-800 to-sophisticated-gray-700 bg-clip-text text-transparent dark:from-sophisticated-gray-100 dark:via-ocean-blue-300 dark:to-sophisticated-gray-300">
            Contactez-nous
          </h1>
          <p className="text-xl text-sophisticated-gray-600 dark:text-sophisticated-gray-400 max-w-3xl mx-auto leading-relaxed">
            Notre équipe est là pour répondre à toutes vos questions et vous accompagner dans votre projet.
          </p>
        </section>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Mail className="w-6 h-6 text-ocean-blue-600" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300 mb-2">
                  Support général
                </p>
                <p className="font-semibold text-ocean-blue-600 dark:text-ocean-blue-400">
                  contact@piktor.ai
                </p>
                <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300 mt-4 mb-2">
                  Ventes & Partenariats
                </p>
                <p className="font-semibold text-ocean-blue-600 dark:text-ocean-blue-400">
                  sales@piktor.ai
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Phone className="w-6 h-6 text-ocean-blue-600" />
                  Téléphone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
                  +33 1 23 45 67 89
                </p>
                <p className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400 mt-2">
                  Du lundi au vendredi, de 9h à 18h
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-ocean-blue-600" />
                  Adresse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                  Piktor AI SAS<br />
                  123 Avenue de l&apos;Innovation<br />
                  75015 Paris<br />
                  France
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-ocean-blue-600" />
                  Horaires de Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                  <div className="flex justify-between">
                    <span>Lundi - Vendredi</span>
                    <span className="font-semibold">9h - 18h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Samedi</span>
                    <span className="font-semibold">10h - 16h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimanche</span>
                    <span className="text-sophisticated-gray-500">Fermé</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Envoyez-nous un message</CardTitle>
                <p className="text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
                  Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Votre nom"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="votre.email@exemple.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="company">Entreprise</Label>
                      <Input
                        id="company"
                        name="company"
                        type="text"
                        placeholder="Nom de votre entreprise"
                        value={formData.company}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">Sujet *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder="Objet de votre message"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Décrivez votre projet ou votre question en détail..."
                      rows={6}
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full md:w-auto"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer le message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Questions Fréquentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
                    Combien de temps faut-il pour générer une image ?
                  </h4>
                  <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                    La génération d&apos;images avec Piktor prend généralement entre 10 et 30 secondes, 
                    selon la complexité et la qualité demandées.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
                    Quels formats d&apos;images sont acceptés ?
                  </h4>
                  <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                    Nous acceptons les formats JPG, PNG, HEIC et WebP. La résolution minimale 
                    recommandée est de 1024x1024 pixels pour des résultats optimaux.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
                    Proposez-vous des tarifs préférentiels pour les grandes entreprises ?
                  </h4>
                  <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                    Oui, nous proposons des tarifs sur mesure et des solutions enterprise pour 
                    les grandes marques. Contactez notre équipe commerciale pour plus d&apos;informations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}