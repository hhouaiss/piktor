import { Metadata } from "next";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";

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
    <ProtectedRoute requireAuth={true}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}