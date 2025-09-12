import { Metadata } from "next";
import { VisualCreation } from "@/components/dashboard/visual-creation";

export const metadata: Metadata = {
  title: "Créer un visuel | Piktor",
  description: "Téléchargez votre produit et générez des visuels IA professionnels pour tous vos supports marketing.",
};

export default function CreateVisualPage() {
  return <VisualCreation />;
}