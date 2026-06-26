'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Redirect the root Next.js page straight to the compiled static A-Frame classic example
    window.location.href = '/aframe-cactus/dist/index.html';
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'black', color: 'white', fontFamily: 'sans-serif' }}>
      <h1>Loading classic 8th Wall A-Frame environment...</h1>
    </div>
  );
}
