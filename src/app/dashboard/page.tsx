import { Metadata } from "next";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export const metadata: Metadata = {
  title: "Tableau de bord | Piktor",
  description: "Vue d'ensemble de vos projets, statistiques d'utilisation et accès rapide à la génération de visuels IA.",
};

export default function DashboardPage() {
  return <DashboardHome />;
}