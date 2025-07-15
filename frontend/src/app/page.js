"use client";

import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import axios from "axios";
import Dropdown from "@/components/Dropdown";
import Form from "@/components/Form";
import RectCropper from "@/components/RectCropper";
import Button from "@/components/Button";
import RangePicker from "@/components/RangePicker";

export default function Home() {
  const [images, setImages] = useState([]);
  const [image, setImage] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [croppedItems, setCroppedItems] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [cropRect, setCropRect] = useState(null);
  const [aspectWidth, setAspectWidth] = useState(4);
  const [aspectHeight, setAspectHeight] = useState(3);
  const [rotation, setRotation] = useState(0);
  const [cornerPoints, setCornerPoints] = useState([]);
  const [qualityValue, setQualityValue] = useState(50); // Default quality value
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
    setImageFiles(files);
    setFolderName(files[0].webkitRelativePath.split("/")[0]);
    setCurrentIndex(0);
    loadImage(files[0]);
  };

  const loadImage = (file) => {
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAutomaticCrop = async () => {
    if (images.length === 0) {
      alert("Please upload a folder with images first.");
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
      formData.append("quality", qualityValue);
    }

    console.log([...formData]);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/auto-crop",
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
      qualityValue,
      condition,
      rotation,
      x: cropRect.x,
      y: cropRect.y,
      w: cropRect.w,
      h: cropRect.h,
      points: cornerPoints,
    };
    setCroppedItems((prev) => [...prev, newItem]);
    if (currentIndex % 2 !== 0) {
      setFrom(to);
      setTo("");
    }
    //setFrom(to);
    //setTo('');
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
      formData.append(prefix + "quality", item.qualityValue);
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
    setQualityValue(value);
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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-center">
        Dynamic Aspect Ratio Cropper
      </h1>

      {/* Image Upload */}
      <div className="mb-4 flex items-center justify-center">
        <input
          type="file"
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
          className="hover:cursor-pointer"
          disabled={currentIndex === 0}
          onClick={handlePrev}
        >
          ⬅️ Prev
        </button>
        <span>
          {currentIndex + 1} / {images.length}
        </span>
        <button
          className="hover:cursor-pointer"
          disabled={currentIndex === images.length - 1}
          onClick={handleNext}
        >
          Next ➡️
        </button>
      </div>

      {/* Image + Controls */}
      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 justify-center items-start">
        {/* Preview */}
        {image && (
          <div className="w-full max-w-[450px] md:max-w-[1450px] aspect-[9/10] rounded-md overflow-hidden bg-black shadow mx-auto">
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

        {/* Form and Controls (Desktop) */}
        <div className="hidden md:flex flex-col space-y-4 ml-4">
          <div className="hidden md:flex">
            <div className="flex flex-col justify-center items-stretch w-full m-4">
              {image && (
                <Button
                  handler={handleAutomaticCrop}
                  color="green"
                  text="Automatic Crop"
                />
              )}
            </div>
          </div>

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
          <div className="flex flex-col">
            {/* Buttons */}
            <div className="hidden md:flex">
              <div className="flex flex-col justify-center items-stretch gap-3 md:gap-5 w-full m-4">
                {[
                  {
                    text: "Add image",
                    handler: handleSingleCrop,
                    color: "blue",
                  },
                  {
                    text: "Crop & Download",
                    handler: handleFinalDownload,
                    color: "blue",
                  },
                  {
                    text: "Reset Rotation",
                    handler: () => setRotation(0),
                    color: "blue",
                  },
                ].map(
                  (btn, idx) =>
                    image && (
                      <Button
                        handler={btn.handler}
                        color={btn.color}
                        text={btn.text}
                        key={idx}
                      />
                    )
                )}
              </div>
            </div>

            <div className="flex flex-row space-x-3 items-start">
              <div className="w-full md:w-1/2 p-4 space-y-4">
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
              <div className="pt-[26px]">
                <Dropdown
                  currentValue={qualityValue}
                  handleValueChange={handleValueChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex md:hidden">
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-3 md:gap-5 w-full m-4">
          {[
            {
              text: "Automatic Crop",
              handler: handleAutomaticCrop,
              color: "green",
            },
            {
              text: "Add image",
              handler: handleSingleCrop,
              color: "blue",
            },
            {
              text: "Crop & Download",
              handler: handleFinalDownload,
              color: "blue",
            },
          ].map(
            (btn, idx) =>
              image && (
                <Button
                  handler={btn.handler}
                  color={btn.color}
                  text={btn.text}
                  key={idx}
                />
              )
          )}
        </div>
      </div>

      {/* Controls for Mobile */}
      <div className="flex flex-col md:hidden justify-center gap-6 h-auto">
        <div className="flex flex-col w-full gap-4">
          {/* Mobile Form */}
          <div className="flex-[2] bg-slate-100 p-4 rounded-md shadow-md">
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

          {/* Mobile Controls */}
          <div className="flex-1 bg-white p-4 rounded-md space-y-4">
            <div className="flex flex-col md:flex-row">
              <Button
                handler={() => setRotation(0)}
                color="blue"
                text="Reset Rotation"
              />
              {[
                {
                  label: "Rotation: {rotation}°",
                  value: rotation,
                  min: -180,
                  max: 180,
                  step: 1,
                  onChange: (e) => setRotation(Number(e.target.value)),
                },
                {
                  label: "Image Quality: {qualityValue}%",
                  value: qualityValue,
                  min: 20,
                  max: 100,
                  step: 10,
                  onChange: (e) => setQualityValue(Number(e.target.value)),
                },
              ].map((picker, idx) => (
                <RangePicker
                  key={idx}
                  label={picker.label
                    .replace("{rotation}", rotation)
                    .replace("{qualityValue}", qualityValue)}
                  min={picker.min}
                  max={picker.max}
                  step={picker.step}
                  value={picker.value}
                  onChange={picker.onChange}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
