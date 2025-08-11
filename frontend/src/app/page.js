"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Cropper from "react-easy-crop";
import axios from "axios";
import Dropdown from "@/components/Dropdown";
import Form from "@/components/Form";
import RectCropper from "@/components/RectCropper";
import Button from "@/components/Button";
import RangePicker from "@/components/RangePicker";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AutoCropPreview from "@/components/AutoCropPreview";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { loadSession } from "./utils/sessionManager";

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
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [messageStatus, setMessageStatus] = useState("success");
  const fileInputRef = useRef(null);
  const [autoCropped, setAutoCropped] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [editingMode, setEditingMode] = useState(false);

  const handleDownloadAutoCropped = async () => {
    if (autoCropped.length === 0) {
      alert("No auto-cropped images to download.");
      return;
    }

    const zip = new JSZip();

    for (const item of autoCropped) {
      // Convert the preview URL to a blob
      const response = await fetch(item.preview_url);
      const blob = await response.blob();
      // Add it to the zip
      zip.file(item.filename, blob);
    }
    // Generate the zip filter
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${folderName}_auto_cropped.zip`);
  };

  const generateCroppedPreview = (imageFile, cropRect, rotation) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = cropRect.w;
        canvas.height = cropRect.h;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(
          img,
          cropRect.x,
          cropRect.y,
          cropRect.w,
          cropRect.h,
          -cropRect.w / 2,
          -cropRect.h / 2,
          cropRect.w,
          cropRect.h
        );
        ctx.restore();

        resolve(canvas.toDataURL("image/jpeg", qualityValue / 100));
      };
      img.src = URL.createObjectURL(imageFile);
    });
  };

  const handleSaveManualCrop = async () => {
    if (currentIndex === null || !cropRect) return;

    const origFile = images[currentIndex];
    const newFilename = `${holeId}_${condition}_{${from}_${to}`;
    const renamedFile = new File([origFile], newFilename, {
      type: origFile.type,
    });
    const newPreviewUrl = await generateCroppedPreview(
      renamedFile,
      cropRect,
      rotation
    );

    setAutoCropped((prev) => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        preview_url: newPreviewUrl,
      };
      return updated;
    });

    showConfirmation("Image updated!");
    setEditingMode(false); // exit editing mode
    //setEditingIndex(null); // exit editing mode
  };

  const handleResetAll = () => {
    const confirm = window.confirm(
      "Are you sure you want to reset all progress?"
    );
    if (!confirm) return;

    setImages([]);
    setImage(null);
    setCurrentIndex(0);
    setCropRect(null);
    setRotation(0);
    setCornerPoints([]);
    setQualityValue(50);
    setCondition("D");
    setHoleId("");
    setFrom("0.00");
    setTo("");
    setCroppedItems([]);
    setFolderName("");

    // ✅ Clear file input so re-uploading same folder works
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const showConfirmation = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setToastMessage(false), 2000); // Hide after 2 seconds
    setTimeout(() => setShowToast(false), 2000); // Hide after 2 seconds
  };

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

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files)
      .filter((file) => file.type.startsWith("image/"))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      );

    if (files.length === 0) return;

    setImages(files);
    setImageFiles(files);
    setFolderName("Selected Images"); // Or any placeholder for mobile uploads
    setCurrentIndex(0);
    loadImage(files[0]);
  };

  const loadImage = (file) => {
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAutoCrop = async () => {
    setIsLoading(true);
    const formData = new FormData();
    images.forEach((file) => {
      formData.append("images", file);
      formData.append("quality", qualityValue);
      formData.append("condition", condition);
    }); // ← important

    try {
      const res = await fetch("http://192.168.10.4:5000/auto-crop", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Auto-crop failed");

      const result = await res.json(); // [{ filename, base64 }]
      console.log("Auto-crop response:", result); // ← Do this

      const formatted = result.map((item, index) => {
        const ext = item.filename.split(".").pop().toLowerCase();
        const mime = ext === "png" ? "image/png" : "image/jpeg"; // default to jpeg

        return {
          preview_url: item.preview_url,
          filename: item.filename,
          index,
          originalFile: images[index], // for editing
        };
      });

      setAutoCropped(formatted);
    } catch (err) {
      console.error("Auto-crop error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleAutomaticCrop = async () => {
  //   setIsLoading(true);
  //   if (images.length === 0) {
  //     alert("Please upload a folder with images first.");
  //     return;
  //   }

  //   const formData = new FormData();
  //   for (let i = 0; i < images.length; i++) {
  //     formData.append("images", images[i]);
  //     formData.append("quality", qualityValue);
  //   }

  //   console.log([...formData]);

  //   try {
  //     const response = await axios.post(
  //       "http://192.168.1.67:5000/auto-crop",
  //       formData,
  //       {
  //         responseType: "blob",
  //       }
  //     );

  //     const blob = new Blob([response.data], { type: "application/zip" });
  //     const url = URL.createObjectURL(blob);

  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.download = "cropped_images.zip";
  //     document.body.appendChild(link);
  //     link.click();
  //     link.remove();
  //   } catch (err) {
  //     console.error("Download failed:", err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

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
    if (currentIndex <= images.length - 1) {
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

    showConfirmation("Image added to crop list!");
    // if (currentIndex % 2 !== 0) {
    //   setFrom(to);
    //   setTo("");
    // }
    setFrom(to);
    setTo("");
    console.log("current item:", newItem);
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  console.log(croppedItems);

  const handleFinalDownload = async () => {
    setIsLoading(true);
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
        "http://192.168.1.78:5000/crop",
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
      showConfirmation("Download Started!");
    } catch (err) {
      console.error("Download failed:", err);
      showConfirmation("Download failed. Please try again.");
      setMessageStatus("error");
    } finally {
      setIsLoading(false);
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

  {
    /* Handle Keyboard navigation */
  }
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
        handleNext();
      }
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images.length]);

  const handleEdit = (index) => {
    // Could show a modal with `react-easy-crop` for example
    setCurrentIndex(index);
    setEditingMode(true);
  };

  const handleFormChange = (index, updates) => {
    setCroppedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  return (
    <>
      {/* Loading Spinner */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30">
          <svg
            className="animate-spin h-8 w-8 text-white mr-4"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-white text-lg font-semibold">
            Processing...
          </span>
        </div>
      )}

      {/* Show toast */}
      {showToast && (
        <div
          className={`fixed top-5 right-5 ${
            messageStatus === "success" ? "bg-green-400" : "bg-amber-600"
          } text-white px-4 py-2 rounded shadow z-50 transition-all`}
        >
          {toastMessage}
        </div>
      )}

      {/* Main page */}
      <div className="flex flex-col min-h-screen font-sans bg-gray-50">
        {/* Header */}
        <header className="flex flex-row bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex-1 md:flex space-y-10 md:space-y-0 justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold text-xl">
                N
              </div>
              <h1 className=" text-2xl font-bold text-gray-800">
                Aspect Ratio Cropper
              </h1>
            </div>
            <div className="mb-4 hidden md:flex items-center justify-center">
              <input
                type="file"
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={handleFolderUpload}
                className="hidden"
                id="folderinput-desktop"
                ref={fileInputRef}
              />
              <label
                htmlFor="folderinput-desktop"
                className="p-2 bg-blue-600 rounded-md text-white hover:cursor-pointer"
              >
                Upload Folder
              </label>
              <span className="ml-4 text-gray-500">
                {folderName ? folderName : "No folder selected"}
              </span>
            </div>

            {/* Mobile Photo Upload */}
            <div className="mb-4 flex items-center justify-center md:hidden">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="folderinput-mobile"
              />
              <label
                htmlFor="folderinput-mobile"
                className="p-2 bg-blue-600 rounded-md text-white hover:cursor-pointer"
              >
                Upload Images
              </label>
              <span className="ml-4 text-gray-500">
                {folderName ? folderName : "No folder selected"}
              </span>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image Section */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-4">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed hover:cursor-pointer"
                >
                  <ChevronLeftIcon className="text-gray-600" />
                  <span className="text-xs text-slate-500">Prev</span>
                </button>
                <span className="text-lg font-semibold text-slate-500">
                  {currentIndex + 1} / {images.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentIndex >= images.length - 1}
                  className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed hover:cursor-pointer"
                >
                  <span className="text-xs text-slate-500">Next</span>
                  <ChevronRightIcon className="text-gray-600" />
                </button>
              </div>
              {/* Navigation */}

              {/* Progress bar */}
              {images.length > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${((currentIndex + 1) / images.length) * 100}%`,
                    }}
                  ></div>
                </div>
              )}

              {/* Direct navigation */}
              {images.length > 0 && (
                <>
                  <div className="w-full hidden md:flex flex-row space-x-2 m-5 p-5 overflow-x-auto">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-12 h-12            
                            flex items-center justify-center
                            rounded-full
                            m-1
                            text-gray-700
                            hover:bg-blue-500 hover:text-white
                            hover:scale-110       /* Slight zoom on hover */
                            transition-all duration-200 ease-in-out
                            cursor-pointer
                            shadow-sm hover:shadow-md ${
                              currentIndex === idx && "bg-blue-500 text-white"
                            }`}
                      >
                        <p className="p-4">{idx + 1}</p>
                      </div>
                    ))}
                  </div>
                  {/* Mobile navigation using dropdown */}
                </>
              )}

              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden border border-gray-300">
                {image ? (
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
                ) : (
                  <p className="text-gray-500">No image selected</p>
                )}
              </div>
              {/* Auto crop preview */}
              {autoCropped.length > 0 && (
                <>
                  <AutoCropPreview images={autoCropped} onEdit={handleEdit} />
                  <div className="mt-4">
                    <Button
                      handler={handleDownloadAutoCropped}
                      color="blue"
                      text="Download Auto-Cropped Images"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Form Section */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              {/* Auto crop */}
              <div className="hidden md:block mt-6 space-y-3 mb-6">
                {image && (
                  <Button
                    handler={handleAutoCrop}
                    color="green"
                    text="Automatic Crop"
                  />
                )}
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <Form
                  holeId={holeId}
                  setHoleId={setHoleId}
                  from={from}
                  setFrom={setFrom}
                  to={to}
                  setTo={setTo}
                  condition={condition}
                  setCondition={setCondition}
                />
              </div>

              <div className="mt-6 space-y-3">
                <div className="hidden md:flex">
                  <div className="flex flex-col justify-center items-stretch gap-3 md:gap-5 w-full m-4">
                    {[
                      {
                        text: "Add image",
                        handler: handleSingleCrop,
                        color: "blue",
                        extraClasses: "",
                      },
                      {
                        text: "Crop & Download",
                        handler: handleFinalDownload,
                        color: "blue",
                        extraClasses: "",
                      },
                      {
                        text: "Reset Rotation",
                        handler: () => setRotation(0),
                        color: "blue",
                        extraClasses: "",
                      },
                      {
                        text: "Reset All",
                        handler: handleResetAll,
                        color: "red",
                        extraClasses: "",
                      },
                    ].map(
                      (btn, idx) =>
                        image && (
                          <Button
                            handler={btn.handler}
                            color={btn.color}
                            text={btn.text}
                            extraClasses={btn.extraClasses}
                            key={idx}
                          />
                        )
                    )}
                  </div>
                </div>
              </div>

              {/* Editing section */}
              {currentIndex !== null && editingMode && (
                <div className="mt-4 bg-white p-4 rounded shadow">
                  <h3 className="font-semibold mb-2">
                    Editing Image #{currentIndex + 1}
                  </h3>
                  <div className="flex gap-3">
                    <Button
                      handler={handleSaveManualCrop}
                      color="green"
                      text="Save Crop"
                    />
                    <Button
                      handler={() => setEditingMode(false)}
                      color="gray"
                      text="Cancel"
                    />
                  </div>
                </div>
              )}

              {/* Auto crop preview and Download  */}
              {autoCropped.length > 0 && (
                <>
                  {/* Auto crop download */}
                  <div className="mt-4">
                    <Button
                      handler={handleDownloadAutoCropped}
                      color="blue"
                      text="Download Auto-Cropped Images"
                    />
                  </div>
                </>
              )}

              <div className="mt-6">
                <div className="hidden md:flex flex-row space-x-3 items-start">
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
                  <div className="">
                    <RangePicker
                      label={`Image Quality: ${qualityValue}%`}
                      min={20}
                      max={100}
                      step={10}
                      value={qualityValue}
                      onChange={(e) =>
                        handleValueChange(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              </div>
              {/* Buttons */}
              <div className="flex md:hidden">
                <div className="flex flex-col md:flex-row justify-center items-stretch gap-3 md:gap-5 w-full m-4">
                  {[
                    {
                      text: "Automatic Crop",
                      handler: handleAutoCrop,
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

              {/* Mobile Controls */}
              <div className="flex-1 md:hidden bg-white p-4 rounded-md space-y-4">
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
        </main>

        {/* Footer */}
        <footer className="bg-white mt-8">
          <div className="container mx-auto px-4 py-4 text-center text-gray-500 text-sm">
            © 2025 Dynamic Aspect Ratio Cropper. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
