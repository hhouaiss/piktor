import { Sparkles, Users, Target, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sophisticated-gray-50 via-white to-ocean-blue-50/30 dark:from-sophisticated-gray-950 dark:via-sophisticated-gray-900 dark:to-sophisticated-gray-800">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-ocean-deep rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-sophisticated-gray-900 via-ocean-blue-800 to-sophisticated-gray-700 bg-clip-text text-transparent dark:from-sophisticated-gray-100 dark:via-ocean-blue-300 dark:to-sophisticated-gray-300">
            À propos de Piktor
          </h1>
          <p className="text-xl text-sophisticated-gray-600 dark:text-sophisticated-gray-400 max-w-3xl mx-auto leading-relaxed">
            Nous révolutionnons la création de contenu visuel pour l'industrie du mobilier grâce à l'intelligence artificielle.
          </p>
        </section>

        {/* Mission Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-4">
              Notre Mission
            </h2>
          </div>
          <Card className="p-8">
            <CardContent className="text-center">
              <p className="text-lg text-sophisticated-gray-700 dark:text-sophisticated-gray-300 leading-relaxed mb-6">
                Chez Piktor, nous croyons que chaque marque de mobilier mérite des visuels exceptionnels. 
                Notre plateforme d'intelligence artificielle permet aux entreprises de créer des images 
                professionnelles de leurs produits sans les contraintes et les coûts d'un studio photo traditionnel.
              </p>
              <p className="text-lg text-sophisticated-gray-700 dark:text-sophisticated-gray-300 leading-relaxed">
                Nous démocratisons l'accès à la photographie professionnelle et permettons aux marques 
                de se concentrer sur ce qu'elles font de mieux : créer de magnifiques meubles.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Values Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-4">
              Nos Valeurs
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-ocean-blue-100 dark:bg-ocean-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-ocean-blue-600 dark:text-ocean-blue-400" />
                </div>
                <CardTitle>Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sophisticated-gray-600 dark:text-sophisticated-gray-400 text-center">
                  Nous repoussons les limites de ce qui est possible avec l'IA pour offrir 
                  des solutions toujours plus performantes et intuitives.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-warm-gold-100 dark:bg-warm-gold-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-warm-gold-600 dark:text-warm-gold-400" />
                </div>
                <CardTitle>Accessibilité</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sophisticated-gray-600 dark:text-sophisticated-gray-400 text-center">
                  Nous rendons la création de contenu visuel professionnel accessible 
                  à toutes les entreprises, quelle que soit leur taille.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-success-600 dark:text-success-400" />
                </div>
                <CardTitle>Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sophisticated-gray-600 dark:text-sophisticated-gray-400 text-center">
                  Nous nous engageons à fournir une qualité irréprochable dans chaque 
                  image générée et chaque interaction avec nos clients.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Story Section */}
        <section className="mb-16">
          <Card className="p-8">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-4">
                Notre Histoire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-4xl mx-auto space-y-6 text-lg text-sophisticated-gray-700 dark:text-sophisticated-gray-300 leading-relaxed">
                <p>
                  Fondée en 2024, Piktor est née de la frustration de voir tant de marques de mobilier 
                  talentueuses limitées par les coûts et la complexité de la photographie professionnelle.
                </p>
                <p>
                  Notre équipe d'experts en intelligence artificielle et en design a développé une 
                  technologie révolutionnaire qui transforme une simple photo de produit en visuel 
                  digne des plus grandes marques de luxe.
                </p>
                <p>
                  Aujourd'hui, nous accompagnons plus de 500 marques de mobilier dans le monde entier, 
                  les aidant à créer des catalogues exceptionnels qui boostent leurs ventes et 
                  renforcent leur image de marque.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact CTA */}
        <section className="text-center">
          <Card className="p-8 bg-gradient-to-r from-ocean-blue-50 to-warm-gold-50 dark:from-sophisticated-gray-800 dark:to-sophisticated-gray-700">
            <CardContent>
              <h3 className="text-2xl font-bold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-4">
                Prêt à transformer vos visuels ?
              </h3>
              <p className="text-sophisticated-gray-600 dark:text-sophisticated-gray-400 mb-6">
                Découvrez comment Piktor peut révolutionner votre stratégie de contenu visuel.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}