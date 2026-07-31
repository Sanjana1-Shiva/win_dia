"use client";
 
import { useEffect, useState } from "react";
import "./Scrolltotop.css";
 
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
 
  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
 
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
 
  return (
    <button
      className={`scrollTopBtn ${visible ? "show" : ""}`}
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}