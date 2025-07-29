import React from "react";

const colorClasses = {
  blue: "bg-blue-600 hover:bg-blue-700",
  green: "bg-green-600 hover:bg-green-700",
  red: "bg-red-600 hover:bg-red-700",
};

function Button({ handler, color, text = "Click Me", extraClasses = "" }) {
  return (
    <div className="w-full text-center">
      <button
        onClick={handler}
        className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-colors ${
          colorClasses[color] || colorClasses.blue
        } hover:cursor-pointer 
    focus:outline-none focus:ring-2 focus:ring-offset-2 md:focus:ring-0 md:focus:outline-none focus:ring-blue-500 
    active:scale-95 active:ring-2 active:ring-offset-2 active:ring-blue-500 
    transition duration-50 ease-in-out ${extraClasses}`}
      >
        {text}
      </button>
    </div>
  );
}

export default Button;
