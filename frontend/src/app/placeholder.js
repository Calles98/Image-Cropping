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

      {/* Main Container */}

      <div
        className={`max-w-5xl mx-auto px-4 py-8 space-y-6 ${
          isLoading ? "cursor-progress" : ""
        }`}
      >
        {/* Title */}
        <h1 className="text-2xl font-bold text-center">
          IMEx Cropper
        </h1>

        {/* Desktop Folder Upload */}
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

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          <button
            className={`px-4 py-2 rounded ${
              currentIndex === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600 hover:cursor-pointer"
            }`}
            disabled={currentIndex === 0}
            onClick={handlePrev}
          >
            ⬅️ Prev
          </button>
          <span className="text-blue-400 font-semibold text-lg">
            <span className="text-blue-600 text-2xl">{currentIndex + 1}</span> /{" "}
            {images.length}
          </span>
          <button
            className={`px-4 py-2 rounded  ${
              currentIndex === images.length - 1
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600 hover:cursor-pointer"
            }`}
            disabled={currentIndex === images.length - 1}
            onClick={handleNext}
          >
            Next ➡️
          </button>
        </div>

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

        {/* Image + Controls */}
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 justify-center items-start">
          {/* File name and size */}
          {/* {images[currentIndex] && (
            <div className="text-sm text-gray-600 opacity-60 text-center mt-2 mb-2">
              <strong>
                Image Info: {images[currentIndex].name} -{" "}
                {images[currentIndex].size > 1024 * 1024
                  ? `${(images[currentIndex].size / (1024 * 1024)).toFixed(
                      2
                    )} MB`
                  : `${(images[currentIndex].size / 1024).toFixed(1)} KB`}
              </strong>
            </div>
          )} */}
          {/* Preview */}
          {image && (
            <div className="w-full max-w-md lg:max-w-[1450px] rounded-md overflow-hidden bg-black shadow mx-auto">
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
    </>
  );