import { Metadata } from "next";
import { SupportPage } from "@/components/dashboard/support-page";

export const metadata: Metadata = {
  title: "Support | Piktor",
  description: "Contactez notre équipe support, créez un ticket ou accédez à l'assistance en temps réel.",
};

export default function Support() {
  return <SupportPage />;
}