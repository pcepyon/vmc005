'use client';

import { SearchBar } from '@/features/places/components/SearchBar';
import { NaverMap } from '@/features/places/components/NaverMap';
import { SearchResultsModal } from '@/features/places/components/SearchResultsModal';
import { PlaceDetailModal } from '@/features/places/components/PlaceDetailModal';
import { ReviewWriteModal } from '@/features/reviews/components/ReviewWriteModal';
import { useAppStore } from '@/stores/useAppStore';

export default function HomePage() {
  const modalHistory = useAppStore((state) => state.modalHistory);
  const currentModal = modalHistory[modalHistory.length - 1];

  return (
    <div className="h-screen flex flex-col">
      <SearchBar />
      <div className="flex-1">
        <NaverMap />
      </div>
      <SearchResultsModal />
      <PlaceDetailModal />
      {currentModal?.data?.placeId && (
        <ReviewWriteModal
          placeId={currentModal.data.placeId}
          placeName={currentModal.data.placeName || ''}
          placeAddress={currentModal.data.placeAddress || ''}
        />
      )}
    </div>
  );
}
