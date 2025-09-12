import { Metadata } from "next";
import { VisualLibrary } from "@/components/dashboard/visual-library";

export const metadata: Metadata = {
  title: "Bibliothèque | Piktor",
  description: "Gérez, organisez et téléchargez tous vos visuels générés avec l'IA Piktor.",
};

export default function LibraryPage() {
  return <VisualLibrary />;
}