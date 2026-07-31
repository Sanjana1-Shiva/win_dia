import "./Announcement.css";
 
export default function Announcement() {
  return (
    <div className="announcementBar">
 
      <div className="marqueeTrack">
 
        {/* First copy */}
        <div className="marqueeContent">
          <span className="marqueeItem">
            🚚 Enjoy Free Shipping on Orders Above ₹499
          </span>
          <span className="marqueeDivider">✦</span>
          <span className="marqueeItem">
            🎉 Use Code <span className="code">WINDIA10</span> for 10% OFF on Your First Order
          </span>
          <span className="marqueeDivider">✦</span>
        </div>
 
        {/* Second copy — makes the loop seamless */}
        <div className="marqueeContent">
          <span className="marqueeItem">
            🚚 Enjoy Free Shipping on Orders Above ₹499
          </span>
          <span className="marqueeDivider">✦</span>
          <span className="marqueeItem">
            🎉 Use Code <span className="code">WINDIA10</span> for 10% OFF on Your First Order
          </span>
          <span className="marqueeDivider">✦</span>
        </div>

        {/* Third copy — makes the loop seamless */}
        <div className="marqueeContent">
          <span className="marqueeItem">
            🚚 Enjoy Free Shipping on Orders Above ₹499
          </span>
          <span className="marqueeDivider">✦</span>
          <span className="marqueeItem">
            🎉 Use Code <span className="code">WINDIA10</span> for 10% OFF on Your First Order
          </span>
          <span className="marqueeDivider">✦</span>
        </div>
 
      </div>
 
    </div>
  );
}