"use client";

import React, { useRef, useState, useEffect } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function RectCropper({ imageUrl, onCropComplete }) {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState({ unit: "px", width: 200, height: 200, x: 50, y: 50 });
  const [completedCrop, setCompletedCrop] = useState(null);

  const onLoad = (img) => {
    imgRef.current = img;
  };

  // Optionally: Send crop info to parent when done
  useEffect(() => {
    if (completedCrop && onCropComplete) {
      onCropComplete(completedCrop);
    }
  }, [completedCrop, onCropComplete]);

  return (
    <div style={{ overflow: "auto", maxHeight: "80vh", border: "1px solid #ccc" }}>
      <ReactCrop
        crop={crop}
        onChange={(c) => setCrop(c)}
        onComplete={(c) => setCompletedCrop(c)}
        keepSelection
      >
        <img
          src={imageUrl}
          onLoad={(e) => onLoad(e.target)}
          style={{ maxWidth: "unset" }} // This forces full resolution
        />
      </ReactCrop>
    </div>
  );
}

export default RectCropper;
