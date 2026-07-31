"use client";
 
import { useState, useEffect } from "react";
import "./Cookie.css";
 
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
 
  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
if (consent !== "accepted") setVisible(true);
  }, []);
  
 
  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };
 
  const decline = () => {
  setVisible(false);
};
 
  if (!visible) return null;
 
  return (
    <div className="cookieBanner">
      <span className="cookieIcon">🍪</span>
      <p className="cookieText">
        We use cookies to improve your experience. By continuing, you agree to our{" "}
        <a href="/privacy-policy" className="cookieLink">Privacy Policy</a>.
      </p>
      <div className="cookieActions">
        <button className="cookieDecline" onClick={decline}>Decline</button>
        <button className="cookieAccept" onClick={accept}>Accept</button>
      </div>
    </div>
  );
}