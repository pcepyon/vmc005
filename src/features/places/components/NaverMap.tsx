'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { usePlacesWithReviews } from '../hooks/usePlaces';

declare global {
  interface Window {
    naver: any;
  }
}

export const NaverMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const naverMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);

  const mapCenter = useAppStore((state) => state.mapCenter);
  const highlightedMarkerId = useAppStore((state) => state.highlightedMarkerId);
  const openModal = useAppStore((state) => state.openModal);

  const { data: places } = usePlacesWithReviews();

  useEffect(() => {
    const checkNaverMaps = () => {
      if (window.naver && window.naver.maps) {
        return true;
      }
      return false;
    };

    if (checkNaverMaps()) {
      setIsMapReady(true);
      return;
    }

    const interval = setInterval(() => {
      if (checkNaverMaps()) {
        setIsMapReady(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mapRef.current || !isMapReady || !window.naver) return;

    const mapOptions = {
      center: new window.naver.maps.LatLng(mapCenter.lat, mapCenter.lng),
      zoom: 15,
      mapTypeControl: false,
      scaleControl: true,
      logoControl: true,
      mapDataControl: true,
      zoomControl: true,
    };

    const map = new window.naver.maps.Map(mapRef.current, mapOptions);
    naverMapRef.current = map;
  }, [mapCenter.lat, mapCenter.lng, isMapReady]);

  useEffect(() => {
    if (!naverMapRef.current || !places || !window.naver) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    places.forEach((place) => {
      const position = new window.naver.maps.LatLng(place.latitude, place.longitude);

      const marker = new window.naver.maps.Marker({
        position,
        map: naverMapRef.current,
        title: place.name,
        icon: {
          content: `
            <div style="
              background-color: ${highlightedMarkerId === place.id ? '#ef4444' : '#3b82f6'};
              color: white;
              padding: 8px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              white-space: nowrap;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              cursor: pointer;
            ">
              ${place.name}
            </div>
          `,
          size: new window.naver.maps.Size(22, 35),
          anchor: new window.naver.maps.Point(11, 35),
        },
      });

      window.naver.maps.Event.addListener(marker, 'click', () => {
        openModal('place-detail', {
          placeId: place.id,
          naverPlaceId: place.naverPlaceId,
        });
      });

      markersRef.current.push(marker);
    });
  }, [places, highlightedMarkerId, openModal]);

  return (
    <div ref={mapRef} className="w-full h-full">
      {!isMapReady && (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <p className="text-gray-600">지도를 불러오는 중...</p>
        </div>
      )}
    </div>
  );
};
