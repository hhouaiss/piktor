import { Metadata } from "next";
import { AccountPage } from "@/components/dashboard/account-page";

export const metadata: Metadata = {
  title: "Mon compte | Piktor",
  description: "Gérez votre profil, abonnement, facturation et préférences de compte Piktor.",
};

export default function Account() {
  return <AccountPage />;
}