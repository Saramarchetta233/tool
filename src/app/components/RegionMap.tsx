'use client';

import { useState } from 'react';

import { regions } from '../data/italyData';

interface RegionMapProps {
  onProvinceSelect: (province: string) => void;
}

export default function RegionMap({ onProvinceSelect }: RegionMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<
    keyof typeof regions | null
  >(null);

  const handleRegionClick = (region: keyof typeof regions) => {
    setSelectedRegion(region);
  };

  const handleBackClick = () => {
    setSelectedRegion(null);
  };

  if (selectedRegion) {
    return (
      <div className='bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-xl font-semibold text-gray-800'>
            {selectedRegion}
          </h3>
          <button
            onClick={handleBackClick}
            className='text-sm text-gray-600 hover:text-gray-800 transition-colors'
          >
            ← Torna alla mappa
          </button>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
          {regions[selectedRegion].map((province) => (
            <button
              key={province}
              onClick={() => onProvinceSelect(province)}
              className='p-3 text-left rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all duration-200'
            >
              {province}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 gap-3 max-w-2xl mx-auto'>
      {Object.keys(regions).map((region) => (
        <button
          key={region}
          onClick={() => handleRegionClick(region as keyof typeof regions)}
          className='p-4 text-center rounded-full border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all duration-200 font-medium text-gray-700 hover:text-green-700'
        >
          {region}
        </button>
      ))}
    </div>
  );
}
