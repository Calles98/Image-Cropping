"use client";

import React, { useRef, useState } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function RectCropper({ imageUrl, onCropComplete, rotation = 0 }) {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState({
    unit: "px",
    width: 200,
    height: 200,
    x: 50,
    y: 50,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [zoom, setZoom] = useState(1);

  const onLoad = (img) => {
    imgRef.current = img;
    setNaturalSize({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <ReactCrop
        crop={crop}
        onChange={(newCrop) => setCrop(newCrop)}
        onComplete={(c) => {
          setCompletedCrop(c);

          if (
            c.width &&
            c.height &&
            onCropComplete &&
            naturalSize &&
            imgRef.current
          ) {
            const rendered = imgRef.current.getBoundingClientRect();

            const scaleX = naturalSize.width / rendered.width;
            const scaleY = naturalSize.height / rendered.height;

            const scaledCrop = {
              x: Math.round(c.x * scaleX),
              y: Math.round(c.y * scaleY),
              width: Math.round(c.width * scaleX),
              height: Math.round(c.height * scaleY),
            };

            onCropComplete(scaledCrop);
          }
        }}
        keepSelection
      >
        <img
          src={imageUrl}
          onLoad={(e) => {
            onLoad(e.target);
            setNaturalSize({
              width: e.target.naturalWidth,
              height: e.target.naturalHeight,
            });
          }}
          className="max-w-full h-auto object-contain block"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </ReactCrop>
    </div>
  );
}

export default RectCropper;
