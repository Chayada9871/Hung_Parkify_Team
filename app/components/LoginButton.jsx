import React from 'react';

const LoginButton = ({onClick}) => {
  return (
    <button className="w-4/5 bg-black text-white py-3 my-2 rounded-lg hover:bg-gray-300 hover-delay" onClick={onClick}>
      Login
    </button>
  );
};

export default LoginButton;
