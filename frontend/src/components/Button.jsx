import React from 'react'

function Button({ handler, color = 'blue', text = 'Click Me' }) {
  return (
    <div className="text-center">
              <button
                onClick={handler}
                className={`bg-${color}-600 hover:bg-${color}-700 text-white px-10 rounded-md hover:cursor-pointer`}
              >
                { text }
              </button>
    </div>
  )
}

export default Button