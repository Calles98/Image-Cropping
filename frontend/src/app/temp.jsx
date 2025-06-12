{/* Controls: Aspect & Metadata */}
      <div className="flex flex-col md:flex-row gap-4 w-full mb-15 ">
        {/* Left Panel – Aspect & Quality */}
        <div className="w-full md:w-1/2 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block mb-1 text-sm font-medium">Aspect Width: {aspectWidth}</label>
              <input
                type="range"
                min="1"
                max="20"
                value={aspectWidth}
                onChange={(e) => setAspectWidth(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 text-sm font-medium">Aspect Height: {aspectHeight}</label>
              <input
                type="range"
                min="1"
                max="20"
                value={aspectHeight}
                onChange={(e) => setAspectHeight(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className='my-4'>
              <label className="block mb-1 text-sm font-medium">Rotation: {rotation}°</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <Dropdown currentValue={currentValue} handleValueChange={handleValueChange} />
        </div>

        {/* Right Panel – Form */}
        <div className="w-full md:w-1/2 p-4 z-50">
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
      </div>

      {/* Crop Area */}
      {image && (
        <div className="relative w-full aspect-[4/3] bg-black rounded overflow-hidden">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            rotation={rotation}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>
      )}
