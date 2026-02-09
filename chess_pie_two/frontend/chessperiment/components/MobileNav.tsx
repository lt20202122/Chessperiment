import React from 'react';

const MobileNav: React.FC = () => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-around z-50">
      <a className="flex flex-col items-center text-primary" href="#">
        <span className="material-symbols-outlined">home</span>
        <span className="text-[10px] font-bold mt-1">Home</span>
      </a>
      <a className="flex flex-col items-center text-gray-400 hover:text-gray-600" href="#">
        <span className="text-[10px] font-bold mt-1">Editor</span>
      </a>
      <a className="flex flex-col items-center text-gray-400 hover:text-gray-600" href="#">
        <span className="material-symbols-outlined">login</span>
        <span className="text-[10px] font-bold mt-1">Login</span>
      </a>
      <a className="flex flex-col items-center text-gray-400 hover:text-gray-600" href="#">
        <span className="material-symbols-outlined">person_add</span>
        <span className="text-[10px] font-bold mt-1">Sign Up</span>
      </a>
    </div>
  );
};

export default MobileNav;