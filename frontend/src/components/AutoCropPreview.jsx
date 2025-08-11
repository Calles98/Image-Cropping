import React from "react";
import { useState, useEffect } from "react";
import Button from "./Button";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

function AutoCropPreview({ images, onEdit }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [filename, setFilename] = useState("");

  const handleEdit = () => {
    // Handle the edit action here
    console.log("Edit button clicked");
    console.log(`Editing image at index: ${previewIndex}`);
    if (onEdit) {
      onEdit(previewIndex);
    }
    setSelectedImage(null);
  };

  const handleNext = () => {
    if (previewIndex <= images.length - 1) {
      console.log("Next button clicked");
      setPreviewIndex((prevIndex) => {
        const newIndex = prevIndex + 1;
        setSelectedImage(images[newIndex].preview_url);
        setFilename(images[newIndex].filename);
        return newIndex;
      });
      setSelectedImage(images[previewIndex].preview_url);
    }
  };

  const handlePrev = () => {
    if (previewIndex > 0) {
      console.log("Prev button clicked");
      setPreviewIndex((prevIndex) => {
        const newIndex = prevIndex - 1;
        setSelectedImage(images[newIndex].preview_url);
        setFilename(images[newIndex].filename);
        return newIndex;
      });
    }
  };

  useEffect(() => {
    if (!selectedImage) return; // Only listen if modal is open

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" && previewIndex < images.length - 1) {
        setPreviewIndex((prevIndex) => {
          const newIndex = prevIndex + 1;
          setSelectedImage(images[newIndex].preview_url);
          setFilename(images[newIndex].filename);
          return newIndex;
        });
      }
      if (e.key === "ArrowLeft" && previewIndex > 0) {
        setPreviewIndex((prevIndex) => {
          const newIndex = prevIndex - 1;
          setSelectedImage(images[newIndex].preview_url);
          setFilename(images[newIndex].filename);
          return newIndex;
        });
      }
      if (e.key === "Escape") {
        setSelectedImage(null); // Close modal
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, images]);

  //console.log("filename: ", );

  return (
    <div className="w-full">
      {/* Horizontal Scroll Container */}
      <div className="flex overflow-x-auto space-x-2 sm:space-x-4 p-2">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="flex-none w-24 h-24 sm:w-40 sm:h-40 bg-gray-100 border rounded cursor-pointer hover:shadow-lg transition-transform transform hover:scale-105"
            onClick={() => {
              setSelectedImage(img.preview_url);
              setPreviewIndex(idx);
              setFilename(img.filename);
            }}
          >
            <img
              src={img.preview_url}
              alt={`Preview ${idx}`}
              className="w-full h-full object-cover rounded"
            />
            <p>{img.filename}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col items-center">
            {/* Full Preview Image */}
            <h1 className="text-white font-bold mb-3">{filename}</h1>
            <img
              src={selectedImage}
              alt="Full Preview"
              className="max-h-[80vh] w-auto max-w-full rounded object-contain"
            />

            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded hover:bg-opacity-70 hover:cursor-pointer transition"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>

            {/* Edit Button */}
            <Button handler={handleEdit} color="blue" text="Edit" />

            {/* Navigation Arrows */}
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 sm:p-5 rounded-full bg-blue-500 hover:bg-blue-400 transition hover:cursor-pointer"
            >
              <ArrowBackIosNewIcon className="text-white" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 sm:p-5 rounded-full bg-blue-500 hover:bg-blue-400 transition hover:cursor-pointer"
            >
              <ArrowForwardIosIcon className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutoCropPreview;
