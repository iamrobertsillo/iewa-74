'use client';

import dynamic from 'next/dynamic';
const PixiGridComponent = dynamic(() => import('../../components/grid/GridCanvas'), { ssr: false });

export default function Home() {
  return <PixiGridComponent width={1200} height={800} />;
}