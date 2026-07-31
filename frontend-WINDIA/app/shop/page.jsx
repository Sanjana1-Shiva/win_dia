export const dynamic = "force-dynamic";
import Shop from "@/src/screens/Shop/Shop";

export const metadata = {
  title: "Shop Healthy Khakhra Snacks",
  description: "Browse WIN-DIA's full range of low-GI, gluten-free, and vegan khakhra snacks. Filter by flavor, dietary needs, and more.",
  alternates: { canonical: "/shop" },
};

export default function Page(){ return <Shop/>; }
