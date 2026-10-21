
import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface KioskLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (
    latitude: number | null,
    longitude: number | null,
  ) => void;
  readOnly?: boolean;
}

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

const kioskMarkerIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapClickHandlerProps {
  readOnly: boolean;
  onLocationChange: (
    latitude: number,
    longitude: number,
  ) => void;
}

function MapClickHandler({
  readOnly,
  onLocationChange,
}: MapClickHandlerProps) {
  useMapEvents({
    click(event) {
      if (!readOnly) {
        onLocationChange(
          event.latlng.lat,
          event.latlng.lng,
        );
      }
    },
  });

  return null;
}

export default function KioskLocationPicker({
  latitude,
  longitude,
  onLocationChange,
  readOnly = false,
}: KioskLocationPickerProps) {
  const hasLocation =
    latitude !== null && longitude !== null;

  const [center, setCenter] = useState<[number, number]>(
    hasLocation
      ? [latitude, longitude]
      : DEFAULT_CENTER,
  );

  useEffect(() => {
    if (hasLocation) {
      setCenter([latitude, longitude]);
    }
  }, [latitude, longitude, hasLocation]);

  const handleMapClick = (
    newLatitude: number,
    newLongitude: number,
  ) => {
    setCenter([newLatitude, newLongitude]);
    onLocationChange(newLatitude, newLongitude);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleMapClick(
          position.coords.latitude,
          position.coords.longitude,
        );
      },
      () => {
        alert(
          "Unable to get your current location. Please allow location access or select a point on the map.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Use My Current Location
          </button>

          <button
            type="button"
            onClick={() => {
              setCenter(DEFAULT_CENTER);
              onLocationChange(null, null);
            }}
            disabled={!hasLocation}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Location
          </button>
        </div>
      )}

      <p className="text-sm text-gray-500">
        {readOnly
          ? "Saved kiosk location."
          : "Click the map to place the kiosk marker at its exact location."}
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <MapContainer
          center={center}
          zoom={hasLocation ? 16 : 5}
          scrollWheelZoom
          style={{
            height: "360px",
            width: "100%",
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler
            readOnly={readOnly}
            onLocationChange={handleMapClick}
          />

          {hasLocation && (
            <Marker
              position={[latitude, longitude]}
              icon={kioskMarkerIcon}
            />
          )}
        </MapContainer>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-500">
            Latitude
          </p>
          <p className="mt-1 break-all text-sm font-semibold text-gray-900">
            {hasLocation ? latitude.toFixed(7) : "Not selected"}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-500">
            Longitude
          </p>
          <p className="mt-1 break-all text-sm font-semibold text-gray-900">
            {hasLocation ? longitude.toFixed(7) : "Not selected"}
          </p>
        </div>
      </div>
    </div>
  );
}
