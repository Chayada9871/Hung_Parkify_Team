// components/RegisterButton.jsx
import React from 'react';

const RegisterButton = ({ onClick, variant = 'black' }) => {
  const baseStyles = 'w-4/5 py-3 my-2 rounded-lg font-semibold hover:bg-gray-300 hover-delay';
  const variantStyles = variant === 'black'
    ? 'bg-black text-white'
    : 'bg-white text-black border border-black';

  return (
    <button className={`${baseStyles} ${variantStyles}`} onClick={onClick}>
      Register
    </button>
  );
};

export default RegisterButton;
