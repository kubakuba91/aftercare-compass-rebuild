"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { approximatePublicPoint } from "@/lib/public-location";
import { cn } from "@/lib/utils";

type ApproximateMapListing = {
  id: string;
  slug: string;
  programName: string;
  type: "sober_living" | "continued_care";
  publicCity: string;
  publicState: string;
  latitude: number | null;
  longitude: number | null;
  isAvailable: boolean;
  selectionHref: string;
};

type MapPinPoint = ApproximateMapListing & {
  lat: number;
  lng: number;
};

declare global {
  interface Window {
    google?: {
      maps: {
        LatLngBounds: new () => {
          extend: (latLng: { lat: number; lng: number }) => void;
        };
        Map: new (
          element: HTMLElement,
          options: {
            center: { lat: number; lng: number };
            clickableIcons?: boolean;
            disableDefaultUI?: boolean;
            fullscreenControl?: boolean;
            mapTypeControl?: boolean;
            streetViewControl?: boolean;
            styles?: Array<Record<string, unknown>>;
            zoom: number;
            zoomControl?: boolean;
          }
        ) => {
          fitBounds: (bounds: unknown) => void;
        };
        Marker: new (options: {
          icon?: unknown;
          label?: {
            color: string;
            fontSize: string;
            fontWeight: string;
            text: string;
          };
          map: unknown;
          position: { lat: number; lng: number };
          title: string;
        }) => {
          addListener: (eventName: string, callback: () => void) => void;
          setMap: (map: null) => void;
        };
        SymbolPath: {
          CIRCLE: unknown;
        };
      };
    };
  }
}

function approximatePoint(listing: ApproximateMapListing): MapPinPoint | null {
  const point = approximatePublicPoint(listing);
  return point ? { ...listing, lat: point.lat, lng: point.lng } : null;
}

export function ApproximateLocationMap({
  className,
  listings,
  mapClassName,
  selectedListingId
}: {
  className?: string;
  listings: ApproximateMapListing[];
  mapClassName?: string;
  selectedListingId?: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Array<{ setMap: (map: null) => void }>>([]);
  const [scriptReady, setScriptReady] = useState(
    typeof window !== "undefined" && Boolean(window.google?.maps)
  );
  const points = listings.map(approximatePoint).filter((point): point is MapPinPoint => Boolean(point));

  useEffect(() => {
    if (!scriptReady || !window.google?.maps || !mapRef.current || !points.length) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const selectedPoint = points.find((point) => point.id === selectedListingId);
    const centerPoint = selectedPoint || points[0];
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: centerPoint.lat, lng: centerPoint.lng },
      clickableIcons: false,
      disableDefaultUI: true,
      fullscreenControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      styles: [
        {
          featureType: "poi",
          stylers: [{ visibility: "off" }]
        }
      ],
      zoom: 11,
      zoomControl: true
    });
    const bounds = new window.google.maps.LatLngBounds();

    points.forEach((point, index) => {
      const isSelected = point.id === selectedListingId;
      const marker = new window.google!.maps.Marker({
        icon: {
          fillColor: isSelected ? "#0f766e" : point.isAvailable ? "#059669" : "#d97706",
          fillOpacity: 1,
          path: window.google!.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 14 : 11,
          strokeColor: "#ffffff",
          strokeWeight: 3
        },
        label: {
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "700",
          text: String(index + 1)
        },
        map,
        position: { lat: point.lat, lng: point.lng },
        title: `${point.programName} - ${point.publicCity}, ${point.publicState}`
      });

      marker.addListener("click", () => {
        window.location.href = point.selectionHref;
      });
      markersRef.current.push(marker);
      bounds.extend({ lat: point.lat, lng: point.lng });
    });

    if (points.length > 1) {
      map.fitBounds(bounds);
    }
  }, [points, scriptReady, selectedListingId]);

  return (
    <aside className={cn("h-fit rounded-lg border border-border bg-white p-3 shadow-sm lg:sticky lg:top-24", className)}>
      <div className={cn("relative min-h-[360px] overflow-hidden rounded-md border border-border bg-[linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:44px_44px] lg:min-h-[520px]", mapClassName)}>
        {apiKey ? (
          <Script
            id="google-maps-script"
            onReady={() => setScriptReady(true)}
            src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}`}
            strategy="afterInteractive"
          />
        ) : null}
        {apiKey && points.length ? <div ref={mapRef} className="absolute inset-0" /> : null}
        {!apiKey ? (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm leading-6 text-muted-foreground">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show the map.
          </div>
        ) : null}
        {apiKey && !points.length ? (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm leading-6 text-muted-foreground">
            Location pins will appear once listings have public city and state data.
          </div>
        ) : null}
      </div>
    </aside>
  );
}
