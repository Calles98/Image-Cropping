import React, { useRef, useState, useEffect } from "react";

const initialPoints = [
  { x: 100, y: 100 },
  { x: 300, y: 100 },
  { x: 300, y: 300 },
  { x: 100, y: 300 },
];

function PerspectiveCropper({ imageUrl, onPointsChange }) {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState(initialPoints);
  const [ dragIndex, setDragIndex ] = useState(null);


  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw corner circles
      points.forEach(({ x, y }) => {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
      });

      // Draw quadrilateral
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.stroke();
    };
  };

  useEffect(() => {
    draw();
  }, [points, imageUrl]);

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    const index = points.findIndex(
      (pt) => Math.hypot(pt.x - pos.x, pt.y - pos.y) < 10
    );
    if (index !== -1) {
      setDragIndex(index);
    }
  };

  const handleMouseMove = (e) => {
    if (dragIndex === null) return;
    const pos = getMousePos(e);
    setPoints((prev) => {
      const newPts = [...prev];
      newPts[dragIndex] = pos;
      return newPts;
    });
  };

  const handleMouseUp = () => setDragIndex(null);

  useEffect(() => {
    draw();
    if (onPointsChange) {
        onPointsChange(points);
    }
  }, [points])

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="border"
      />
      <pre>{JSON.stringify(points, null, 2)}</pre>
      <button
        className="mt-4 p-2 bg-blue-600 text-white"
        onClick={() => console.log("Send to backend:", points)}
      >
        Crop This Area
      </button>
    </div>
  );
}

export default PerspectiveCropper;
