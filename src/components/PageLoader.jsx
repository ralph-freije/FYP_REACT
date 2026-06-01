import "./PageLoader.css";

export default function PageLoader({ text = "Loading..." }) {
  return (
    <div className="page-loader-wrap">
      <div className="page-loader-card">

        <div className="loader-rings">
          <div className="ring ring-1"></div>
          <div className="ring ring-2"></div>
          <div className="ring ring-3"></div>

          <div className="loader-core">
            🌱
          </div>
        </div>

        <h2>{text}</h2>
        <p>Preparing your sustainability insights</p>

      </div>
    </div>
  );
}