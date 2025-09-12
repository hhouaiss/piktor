import { Metadata } from "next";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AuthWrapper } from "@/components/dashboard/auth-wrapper";

export const metadata: Metadata = {
  title: "Tableau de bord | Piktor",
  description: "Gérez vos visuels produits IA et créez de nouveaux designs professionnels pour votre marque de mobilier.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthWrapper>
  );
}