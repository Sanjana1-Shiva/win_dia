export const dynamic = "force-dynamic";
import Contact from "@/src/sections/contact/Contact";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with the WIN-DIA team for order support, bulk enquiries, or feedback.",
  alternates: { canonical: "/contact" },
};

export default function Page(){ return <Contact/>; }
