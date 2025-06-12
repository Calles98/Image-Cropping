import React, { useState } from "react";

function Form({
  condition,
  setCondition,
  holeId,
  setHoleId,
  from,
  setFrom,
  to,
  setTo,
}) {
  //console.log('Form Data:', projectName, holeId, from, to);

  return (
    <div className="w-full p-4 bg-slate-100 rounded-md">
      <h2 className="text-lg font-semibold">Project Details</h2>
      <h3 className="text-sm text-slate-600">
        Please fill in the details below:
      </h3>
      <form className="flex flex-col gap-2" action="" method="post">
        <label htmlFor="hole-id">Hole ID:</label>
        <input
          type="text"
          name="hole-id"
          className="outline-none border border-solid rounded-md border-slate-700"
          onChange={(e) => setHoleId(e.target.value)}
        />
        <label htmlFor="condition">Core Condition:</label>
        <div className="flex gap-x-2 mx-auto mt-2">
          <div className="">
            <label className="pr-2">Dry</label>
            <input
              type="radio"
              name="condition"
              value="D"
              checked={condition === "D"}
              onChange={(e) => setCondition(e.target.value)}
            />
          </div>
          <div className="">
            <label className="pr-2">Wet</label>
            <input
              type="radio"
              name="condition"
              value="W"
              checked={condition === "W"}
              onChange={(e) => setCondition(e.target.value)}
            />
          </div>
        </div>
        <label htmlFor="from">From:</label>
        <input
          type="number"
          name="from"
          value={from}
          className="outline-none border border-solid rounded-md border-slate-700"
          onChange={(e) => setFrom(e.target.value)}
          placeholder={from}
        />
        <label htmlFor="to">To:</label>
        <input
          type="number"
          name="to"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="outline-none border border-solid rounded-md border-slate-700 px-2 py-1"
          placeholder={to}
        />
      </form>
    </div>
  );
}

export default Form;
