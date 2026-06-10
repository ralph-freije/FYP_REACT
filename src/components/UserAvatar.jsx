import { useState } from "react";

const getUserImageSrc = (src) => {
  if (!src) return null;

  const cleanSrc = String(src).trim();
  if (!cleanSrc) return null;

  if (cleanSrc.startsWith("http://") || cleanSrc.startsWith("https://")) {
    return cleanSrc;
  }

  if (cleanSrc.startsWith("/storage/")) {
    return `http://127.0.0.1:8000${cleanSrc}`;
  }

  if (cleanSrc.startsWith("storage/")) {
    return `http://127.0.0.1:8000/${cleanSrc}`;
  }

  return `http://127.0.0.1:8000/storage/${cleanSrc}`;
};

const getUserInitials = (name) => {
  const cleanName = String(name || "").trim();
  if (!cleanName) return "U";

  return cleanName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export default function UserAvatar({
  src,
  name,
  className = "",
  imageClassName = "",
  fallbackClassName = "",
}) {
  const imageSrc = getUserImageSrc(src);
  const [failedSrc, setFailedSrc] = useState(null);
  const imageFailed = imageSrc && failedSrc === imageSrc;

  return (
    <div className={className}>
      {imageSrc && !imageFailed ? (
        <img
          src={imageSrc}
          className={imageClassName}
          alt={name ? `${name} profile` : "User profile"}
          onError={() => setFailedSrc(imageSrc)}
        />
      ) : (
        <span className={fallbackClassName}>{getUserInitials(name)}</span>
      )}
    </div>
  );
}
