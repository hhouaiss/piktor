import { FileText, Shield, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sophisticated-gray-50 via-white to-ocean-blue-50/30 dark:from-sophisticated-gray-950 dark:via-sophisticated-gray-900 dark:to-sophisticated-gray-800">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-ocean-deep rounded-xl flex items-center justify-center shadow-md">
              <Scale className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-sophisticated-gray-900 via-ocean-blue-800 to-sophisticated-gray-700 bg-clip-text text-transparent dark:from-sophisticated-gray-100 dark:via-ocean-blue-300 dark:to-sophisticated-gray-300">
            Mentions Légales
          </h1>
          <p className="text-xl text-sophisticated-gray-600 dark:text-sophisticated-gray-400 max-w-3xl mx-auto leading-relaxed">
            Informations légales et conditions d&apos;utilisation de la plateforme Piktor.
          </p>
        </section>

        <div className="space-y-8">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-ocean-blue-600" />
                Informations sur la Société
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
                  Raison sociale
                </h4>
                <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                  Piktor AI SAS
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
                  Siège social
                </h4>
                <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                  123 Avenue de l&apos;Innovation<br />
                  75015 Paris, France
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
                  SIRET
                </h4>
                <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                  123 456 789 00012
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
                  Capital social
                </h4>
                <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                  100 000 €
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
                  Directeur de publication
                </h4>
                <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                  Hassan Otsmane-Elhaou, Président
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Hosting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-ocean-blue-600" />
                Hébergement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300 mb-2">
                  Ce site est hébergé par :
                </p>
                <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                  Vercel Inc.<br />
                  440 N Barranca Ave #4133<br />
                  Covina, CA 91723, États-Unis
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terms of Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-ocean-blue-600" />
                Conditions d&apos;Utilisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
                  1. Objet
                </h4>
                <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                  Les présentes conditions générales d&apos;utilisation (CGU) ont pour objet l&apos;encadrement juridique 
                  des modalités de mise à disposition du site et des services par Piktor AI et de définir les 
                  conditions d&apos;accès et d&apos;utilisation des services par l&apos;utilisateur.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
                  2. Accès au Site
                </h4>
                <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                  Le site Piktor permet à l&apos;utilisateur un accès gratuit aux services suivants : génération 
                  d&apos;images de mobilier par intelligence artificielle. Le site est accessible gratuitement en 
                  tout lieu à tout utilisateur ayant un accès à Internet.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
                  3. Propriété Intellectuelle
                </h4>
                <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                  Les marques, logos, signes ainsi que tous les contenus du site (textes, images, son...) 
                  font l&apos;objet d&apos;une protection par le Code de la propriété intellectuelle et plus 
                  particulièrement par le droit d&apos;auteur. L&apos;utilisateur doit solliciter l&apos;autorisation 
                  préalable du site pour toute reproduction, publication, copie des différents contenus.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
                  4. Responsabilité
                </h4>
                <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                  Piktor AI ne peut être tenu responsable des dommages directs et indirects causés au 
                  matériel de l&apos;utilisateur, lors de l&apos;accès au site, et résultant soit de l&apos;utilisation 
                  d&apos;un matériel ne répondant pas aux spécifications indiquées, soit de l&apos;apparition d&apos;un bug ou d&apos;une incompatibilité.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-ocean-blue-600" />
                Protection des Données Personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi 
                « Informatique et Libertés », vous disposez d&apos;un droit d&apos;accès, de rectification, 
                d&apos;effacement et de portabilité de vos données personnelles.
              </p>
              <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                Pour exercer ces droits, vous pouvez nous contacter à l&apos;adresse : 
                <span className="font-semibold"> privacy@piktor.ai</span>
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                Pour toute question concernant ces mentions légales, vous pouvez nous contacter à :
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                <li>Email : legal@piktor.ai</li>
                <li>Téléphone : +33 1 23 45 67 89</li>
                <li>Courrier : Piktor AI SAS, 123 Avenue de l&apos;Innovation, 75015 Paris</li>
              </ul>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <div className="text-center text-sm text-sophisticated-gray-500 dark:text-sophisticated-gray-400">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
}