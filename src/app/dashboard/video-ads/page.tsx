import { Metadata } from "next";
import { VideoAdCreation } from "@/components/dashboard/video-ad-creation";

export const metadata: Metadata = {
  title: "Créer une publicité vidéo | Piktor",
  description: "Générez des publicités vidéo IA professionnelles pour vos meubles avec OpenAI Sora.",
};

export default function VideoAdsPage() {
  return <VideoAdCreation />;
}
