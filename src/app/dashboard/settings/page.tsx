import { Metadata } from "next";
import { DashboardSettings } from "@/components/dashboard/dashboard-settings";

export const metadata: Metadata = {
  title: "Paramètres | Piktor",
  description: "Personnalisez vos préférences de génération, formats par défaut et paramètres de qualité.",
};

export default function SettingsPage() {
  return <DashboardSettings />;
}