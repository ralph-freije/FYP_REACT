import "./InlineLoader.css";

export default function InlineLoader({
  text = "Loading...",
  subtext = "Please wait a moment.",
}) {
  return (
    <div className="inline-loader" role="status" aria-live="polite">
      <div className="inline-loader-spinner" aria-hidden="true"></div>

      <div>
        <strong>{text}</strong>
        {subtext && <span>{subtext}</span>}
      </div>
    </div>
  );
}