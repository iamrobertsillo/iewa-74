'use client';

import dynamic from 'next/dynamic';
const PixiGridComponent = dynamic(() => import('../../components/grid/GridCanvas'), { ssr: false });

export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <PixiGridComponent />
    </div>
  );
}