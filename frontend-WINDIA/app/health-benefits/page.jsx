export const dynamic = "force-dynamic";
import HealthBenefits from "@/src/screens/HealthBenefits/HealthBenefits";

export const metadata = {
  title: "Health Benefits",
  description: "Discover why low-GI, high-fiber khakhra snacks from WIN-DIA support healthy blood sugar, digestion, and everyday wellness.",
  alternates: { canonical: "/health-benefits" },
};

export default function Page(){ return <HealthBenefits/>; }
