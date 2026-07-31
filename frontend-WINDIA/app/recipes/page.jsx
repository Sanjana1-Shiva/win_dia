export const dynamic = "force-dynamic";
import Recipes from "@/src/screens/Recipes/Recipes";

export const metadata = {
  title: "Recipes",
  description: "Creative, healthy recipes using WIN-DIA khakhra — from quick snacks to full meals.",
  alternates: { canonical: "/recipes" },
};

export default function Page(){ return <Recipes/>; }
