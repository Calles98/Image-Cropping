"use client";

import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import axios from "axios";
import Dropdown from "@/components/Dropdown";
import Form from "@/components/Form";
import RectCropper from "@/components/RectCropper";

export default function Home() {
  const [images, setImages] = useState([]);
  const [image, setImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageFiles, setImagedFiles] = useState([]);
  const [imageCount, setImageCount] = useState(0);
  const [croppedItems, setCroppedItems] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropRect, setCropRect] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [aspectWidth, setAspectWidth] = useState(4);
  const [aspectHeight, setAspectHeight] = useState(3);
  const [rotation, setRotation] = useState(0);
  const [cornerPoints, setCornerPoints] = useState([]);
  const [currentValue, setCurrentValue] = useState(50); // Default quality value
  // Additional form fields
  const [condition, setCondition] = useState("D");
  const [holeId, setHoleId] = useState("");
  const [from, setFrom] = useState("0.00");
  const [to, setTo] = useState("");

  const aspect =
    aspectWidth && aspectHeight ? aspectWidth / aspectHeight : undefined;

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFolderUpload = (e) => {
    const files = Array.from(e.target.files)
      .filter((file) => file.type.startsWith("image/"))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      );
    if (files.length === 0) return;
    setImages(files);
    setImagedFiles(files);
    setFolderName(files[0].webkitRelativePath.split("/")[0]);
    setCurrentIndex(0);
    loadImage(files[0]);
  };

  const loadImage = (file) => {
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  console.log(images);

  useEffect(() => {
    if (images.length > 0 && currentIndex < images.length) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(images[currentIndex]);
    }
  }, [images, currentIndex]);

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
    }
  };

  const handleSingleCrop = () => {
    const newItem = {
      file: images[currentIndex],
      holeId,
      from,
      to,
      currentValue,
      condition,
      rotation,
      x: cropRect.x,
      y: cropRect.y,
      w: cropRect.w,
      h: cropRect.h,
      points: cornerPoints,
    };
    setCroppedItems((prev) => [...prev, newItem]);
    /* if (currentIndex % 2 !== 0) {
      setFrom(to);
      setTo("");
    } */
    setFrom(to);
    setTo("");
    console.log("current item:", newItem);
    setCurrentIndex((prev) => prev + 1);
  };

  console.log(croppedItems);

  const handleFinalDownload = async () => {
    const formData = new FormData();

    croppedItems.forEach((item, index) => {
      const prefix = `file_${index}_`;
      formData.append("images", item.file);
      formData.append(prefix + "hole-id", item.holeId.toUpperCase());
      formData.append(prefix + "from", item.from);
      formData.append(prefix + "to", item.to);
      formData.append(prefix + "quality", item.currentValue);
      formData.append(prefix + "condition", item.condition);
      formData.append(prefix + "rotation", item.rotation);
      formData.append(prefix + "x", item.x);
      formData.append(prefix + "y", item.y);
      formData.append(prefix + "w", item.w);
      formData.append(prefix + "h", item.h);
      item.points.forEach((pt, i) => {
        formData.append(`${prefix}pt${i}_x`, pt.x);
        formData.append(`${prefix}pt${i}_y`, pt.y);
      });
    });

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/crop",
        formData,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "cropped_images.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  //console.log(cornerPoints);

  const handleValueChange = (value) => {
    setCurrentValue(value);
  };

  const handleCropComplete = useCallback(
    (crop) => {
      if (crop?.width && crop?.height) {
        const corners = [
          { x: crop.x, y: crop.y },
          { x: crop.x + crop.width, y: crop.y },
          { x: crop.x + crop.width, y: crop.y + crop.height },
          { x: crop.x, y: crop.y + crop.height },
        ];
        setCornerPoints(corners);
      }
    },
    [setCornerPoints]
  ); // Include any dependency actually used inside
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-center">
        Dynamic Aspect Ratio Cropper
      </h1>

      {/* Image Upload */}
      <div className="mb-4 flex items-center justify-center">
        <input
          type="file"
          // accept="image/*"
          webkitdirectory="true"
          directory="true"
          multiple
          onChange={handleFolderUpload}
          className="hidden"
          id="folderinput"
        />
        <label
          htmlFor="folderinput"
          className="p-2 bg-blue-600 rounded-md text-white hover:cursor-pointer"
        >
          Upload Folder
        </label>
        <span className="ml-4 text-gray-500">
          {folderName ? folderName : "No folder selected"}
        </span>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-4">
        <button
          disabled={currentIndex === 0}
          onClick={handlePrev}
          className="hover:cursor-pointer"
        >
          ⬅️ Prev
        </button>
        <span>
          {currentIndex + 1} / {images.length}
        </span>
        <button
          disabled={currentIndex === images.length - 1}
          onClick={handleNext}
          className="hover:cursor-pointer"
        >
          Next ➡️
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-auto ">
        {/* Left: Cropper */}
        <div className="flex-[2] overflow-hidden">
          {image && (
            <div className="relative w-full max-w-full max-h-full bg-black rounded">
              {/* <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                rotation={rotation}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />  */}
              <RectCropper
                imageUrl={image}
                onCropComplete={(crop) => {
                  setCropRect({
                    x: crop.x,
                    y: crop.y,
                    w: crop.width,
                    h: crop.height,
                  });
                }}
                rotation={rotation}
              />
            </div>
          )}
        </div>
        {/* Right: Controls */}
        <div className="flex-[1] w-full lg:w-[400px] space-y-4">
          {/* Form, aspect, controls, dropdowns */}
          <div className="bg-slate-100 p-4 rounded-md shadow-md">
            <Form
              condition={condition}
              setCondition={setCondition}
              holeId={holeId}
              setHoleId={setHoleId}
              from={from}
              setFrom={setFrom}
              to={to}
              setTo={setTo}
            />
          </div>

          <div className="bg-white p-4 rounded-md space-y-2">
            {/* Left Panel – Aspect & Quality */}
            <div className="w-full md:w-1/2 p-4 space-y-2">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="my-4">
                  <label className="block mb-1 text-sm font-medium">
                    Rotation: {rotation}°
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full hover:cursor-ew-resize"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="m-5">
          <Dropdown
            currentValue={currentValue}
            handleValueChange={handleValueChange}
          />
        </div>
      </div>

      {/* Crop Button */}
      {cropRect && (
        <div className="text-center">
          <button
            onClick={handleFinalDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded hover:cursor-pointer"
          >
            Crop & Download
          </button>
        </div>
      )}

      {cropRect && (
        <div className="text-center">
          <button
            onClick={handleSingleCrop}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded hover:cursor-pointer"
          >
            Add image
          </button>
        </div>
      )}

      {/* Preview */}
      {croppedImageUrl && (
        <div className="text-center">
          <h3 className="text-lg font-semibold mt-4">Cropped Preview</h3>
          <img
            src={croppedImageUrl}
            alt="Cropped"
            className="inline-block mt-2 border rounded max-w-full"
          />
        </div>
      )}
    </div>
  );
}
