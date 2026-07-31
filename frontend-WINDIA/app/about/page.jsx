export const dynamic = "force-dynamic";
import About from "@/src/sections/about/about";

export const metadata = {
  title: "Our Story",
  description: "Learn how WIN-DIA reimagined the traditional khakhra into a modern, healthy, low-GI snack made for everyday wellness.",
  alternates: { canonical: "/about" },
};

export default function Page(){ return <About/>; }
