import React from 'react'
import './Errorpage.css'
import Error from '../assets/Error.png'

const Errorpage = () => {
  return (
    <body className='body-error'>
        <h1 className='error-text'>Error 404: <br /> Page Not Found.  </h1>
        <img className="error-image" src={Error} alt="" />
    </body>
  )
}

export default Errorpage;