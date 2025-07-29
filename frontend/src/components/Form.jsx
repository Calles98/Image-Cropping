import React from "react";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import WaterDropIcon from '@mui/icons-material/WaterDrop';

function Form({
  holeId,
  setHoleId,
  condition,
  setCondition,
  from,
  setFrom,
  to,
  setTo,
}) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 w-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        Project Details
      </h2>
      <p className="text-gray-500 mb-4">Please fill in the details below.</p>
      <form className="space-y-4" method="post">
        {/* Hole ID */}
        <div>
          <label
            htmlFor="hole-id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Hole ID:
          </label>
          <input
            id="hole-id"
            name="hole-id"
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={holeId}
            onChange={(e) => setHoleId(e.target.value)}
          />
        </div>

        {/* Core Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Core Condition:
          </label>
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                id="dry-condition"
                name="condition"
                type="radio"
                value="D"
                checked={condition === "D"}
                onChange={(e) => setCondition(e.target.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label
                htmlFor="dry-condition"
                className="ml-2 block text-sm text-gray-900"
              >
                Dry
              </label>
              <WbSunnyIcon className="ml-1 text-gray-500" />
            </div>
            <div className="flex items-center">
              <input
                id="wet-condition"
                name="condition"
                type="radio"
                value="W"
                checked={condition === "W"}
                onChange={(e) => setCondition(e.target.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label
                htmlFor="wet-condition"
                className="ml-2 block text-sm text-gray-900"
              >
                Wet
              </label>
              <WaterDropIcon className="ml-1 text-gray-500" />
            </div>
          </div>
        </div>

        {/* From */}
        <div>
          <label
            htmlFor="from"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            From:
          </label>
          <input
            id="from"
            name="from"
            type="number"
            value={from}
            placeholder="0.00"
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* To */}
        <div>
          <label
            htmlFor="to"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            To:
          </label>
          <input
            id="to"
            name="to"
            type="number"
            value={to}
            placeholder="0.00"
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </form>
    </div>
  );
}

export default Form;
