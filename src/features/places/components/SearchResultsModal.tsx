'use client';

import { useAppStore } from '@/stores/useAppStore';
import { useSearchPlaces } from '../hooks/usePlaces';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, MapPin, Phone, ChevronRight, Loader2 } from 'lucide-react';

export const SearchResultsModal = () => {
  const modalState = useAppStore((state) => state.modalState);
  const modalHistory = useAppStore((state) => state.modalHistory);
  const closeModal = useAppStore((state) => state.closeModal);
  const openModal = useAppStore((state) => state.openModal);
  const setMapCenter = useAppStore((state) => state.setMapCenter);
  const setHighlightedMarker = useAppStore((state) => state.setHighlightedMarker);

  const currentModal = modalHistory[modalHistory.length - 1];
  const searchQuery = currentModal?.data?.searchQuery || '';

  const { data, isLoading, isError, error } = useSearchPlaces(
    searchQuery,
    modalState === 'search-results'
  );

  if (modalState !== 'search-results') return null;

  const handlePlaceClick = (place: { id: string; latitude: number; longitude: number }) => {
    setMapCenter(place.latitude, place.longitude);
    setHighlightedMarker(place.id);
  };

  const handleViewDetail = (place: { id: string }) => {
    openModal('place-detail', {
      naverPlaceId: place.id,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={closeModal}
    >
      <Card
        className="w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>검색 결과</CardTitle>
          <Button variant="ghost" size="icon" onClick={closeModal}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {isLoading && (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}

          {isError && (
            <div className="p-6 text-center text-red-600">
              <p>검색에 실패했습니다.</p>
              <p className="text-sm text-gray-600 mt-2">
                {error instanceof Error ? error.message : '다시 시도해주세요'}
              </p>
            </div>
          )}

          {data && data.places.length === 0 && (
            <div className="p-6 text-center text-gray-600">
              검색 결과가 없습니다
            </div>
          )}

          {data && data.places.length > 0 && (
            <div className="divide-y">
              {data.places.map((place) => (
                <div
                  key={place.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handlePlaceClick(place)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{place.name}</h3>
                      {place.category && (
                        <p className="text-sm text-gray-600 mt-1">{place.category}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{place.roadAddress || place.address}</span>
                      </div>
                      {place.phone && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{place.phone}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetail(place);
                      }}
                    >
                      상세보기
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
