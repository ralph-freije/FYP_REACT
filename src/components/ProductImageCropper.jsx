import { useCallback, useEffect, useRef, useState } from "react";

const OUTPUT_SIZE = 1000;

function toCroppedFilename(file) {
  const base = file?.name?.replace(/\.[^.]+$/, "") || "product-image";
  return `${base}-square.jpg`;
}

export default function ProductImageCropper({ file, onCrop }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageSrc, setImageSrc] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!file) {
      setImageSrc("");
      setReady(false);
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setReady(false);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const drawCrop = useCallback(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas || !image.naturalWidth || !image.naturalHeight) return null;

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const baseScale = Math.max(OUTPUT_SIZE / image.naturalWidth, OUTPUT_SIZE / image.naturalHeight);
    const scale = baseScale * zoom;
    const drawnWidth = image.naturalWidth * scale;
    const drawnHeight = image.naturalHeight * scale;
    const maxMoveX = Math.max(0, (drawnWidth - OUTPUT_SIZE) / 2);
    const maxMoveY = Math.max(0, (drawnHeight - OUTPUT_SIZE) / 2);
    const dx = (OUTPUT_SIZE - drawnWidth) / 2 + (offsetX / 100) * maxMoveX;
    const dy = (OUTPUT_SIZE - drawnHeight) / 2 + (offsetY / 100) * maxMoveY;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, dx, dy, drawnWidth, drawnHeight);

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const cropX = clamp(-dx / scale, 0, image.naturalWidth - 1);
    const cropY = clamp(-dy / scale, 0, image.naturalHeight - 1);
    const cropWidth = clamp(OUTPUT_SIZE / scale, 1, image.naturalWidth - cropX);
    const cropHeight = clamp(OUTPUT_SIZE / scale, 1, image.naturalHeight - cropY);

    return {
      canvas,
      crop: {
        image_crop_x: Math.round(cropX),
        image_crop_y: Math.round(cropY),
        image_crop_width: Math.round(cropWidth),
        image_crop_height: Math.round(cropHeight),
      },
    };
  }, [offsetX, offsetY, zoom]);

  useEffect(() => {
    if (!ready || !file) return undefined;

    const timeout = window.setTimeout(() => {
      const result = drawCrop();
      if (!result?.canvas) return;

      result.canvas.toBlob((blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], toCroppedFilename(file), {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        const previewUrl = URL.createObjectURL(blob);
        onCrop?.(croppedFile, previewUrl, result.crop);
      }, "image/jpeg", 0.92);
    }, 160);

    return () => window.clearTimeout(timeout);
  }, [drawCrop, file, onCrop, ready]);

  if (!file || !imageSrc) return null;

  return (
    <div className="product-square-cropper">
      <div className="product-cropper-header">
        <div>
          <strong>Square crop preview</strong>
          <span>The square below is exactly what will be uploaded.</span>
        </div>
        <small>1:1 product image</small>
      </div>

      <div className="product-cropper-stage">
        <canvas ref={canvasRef} aria-label="Square product crop preview" />
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Original upload used for square crop"
          onLoad={() => {
            setReady(true);
            window.requestAnimationFrame(() => drawCrop());
          }}
        />
      </div>

      <div className="product-cropper-controls">
        <label>
          <span>Zoom</span>
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
        </label>
        <label>
          <span>Move left / right</span>
          <input type="range" min="-100" max="100" step="1" value={offsetX} onChange={(event) => setOffsetX(Number(event.target.value))} />
        </label>
        <label>
          <span>Move up / down</span>
          <input type="range" min="-100" max="100" step="1" value={offsetY} onChange={(event) => setOffsetY(Number(event.target.value))} />
        </label>
      </div>
    </div>
  );
}
