"use client";

import React, { useState } from 'react';

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav>
      {/* Navbar content */}
      <button onClick={() => setMenuOpen(!menuOpen)}>Toggle Menu</button>
      {menuOpen && (
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
