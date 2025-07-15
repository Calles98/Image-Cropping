import React from 'react'

function RangePicker({label, min, max, step, value, onChange}) {
  return (
    <div className='w-full p-4 space-y-4'>
        <label className="block mb-1 text-sm font-medium">{label}</label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className='w-full hover:cursor-ew-resize' 
        />
    </div>
  )
}

export default RangePicker