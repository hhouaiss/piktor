import { Metadata } from "next";
import { TutorialsPage } from "@/components/dashboard/tutorials-page";

export const metadata: Metadata = {
  title: "Tutoriels | Piktor",
  description: "Apprenez à créer des visuels professionnels avec nos guides pas-à-pas, FAQ et conseils d'experts.",
};

export default function Tutorials() {
  return <TutorialsPage />;
}