"use client";

import React, { useRef, useState, useEffect } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function RectCropper({ imageUrl, onCropComplete }) {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState({
    unit: "px",
    width: 200,
    height: 200,
    x: 50,
    y: 50,
  });
  const [completedCrop, setCompletedCrop] = useState(null);

  const onLoad = (img) => {
    imgRef.current = img;
  };

  // useEffect(() => {
  //   if (
  //     completedCrop &&
  //     completedCrop.width > 0 &&
  //     completedCrop.height > 0 &&
  //     onCropComplete
  //   ) {
  //     onCropComplete(completedCrop);
  //   }
  // }, [
  //   completedCrop?.x,
  //   completedCrop?.y,
  //   completedCrop?.width,
  //   completedCrop?.height,
  //   onCropComplete,
  // ]);
  return (
    <div className="max-w-full max-h-full display-block">
      <ReactCrop
        crop={crop}
        onChange={(newCrop) => setCrop(newCrop)}
        onComplete={(c) => {
          setCompletedCrop(c);
          if (c.width && c.height && onCropComplete) {
            onCropComplete(c);
          }
        }}
        keepSelection
      >
        <img
          src={imageUrl}
          onLoad={(e) => onLoad(e.target)}
          className="max-w-full max-h-full display-block"
        />
      </ReactCrop>
    </div>
  );
}

export default RectCropper;
