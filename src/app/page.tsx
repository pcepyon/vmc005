'use client';

import { SearchBar } from '@/features/places/components/SearchBar';
import { NaverMap } from '@/features/places/components/NaverMap';
import { SearchResultsModal } from '@/features/places/components/SearchResultsModal';
import { PlaceDetailModal } from '@/features/places/components/PlaceDetailModal';

export default function HomePage() {
  return (
    <div className="h-screen flex flex-col">
      <SearchBar />
      <div className="flex-1">
        <NaverMap />
      </div>
      <SearchResultsModal />
      <PlaceDetailModal />
    </div>
  );
}
