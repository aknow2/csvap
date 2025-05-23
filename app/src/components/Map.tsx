import {Map, NavigationControl, Popup, useControl, type MapRef} from 'react-map-gl/maplibre';
import {MapboxOverlay as DeckOverlay} from '@deck.gl/mapbox';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { DeckProps } from '@deck.gl/core';
import { type VData } from '../context/VDataContext';
import { useControllerStatus } from '../context/ControllerStatusContext';
import type { VisualizationData } from '../context/CSVContext';
import { HeatmapLayer, HexagonLayer } from '@deck.gl/aggregation-layers';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import './Map.css';

const INITIAL_VIEW_STATE = {
  latitude: 34.75904166103766, 
  longitude: 136.44544297993718,
  zoom: 11,
  bearing: 0,
  pitch: 30
};

const MAP_STYLE = import.meta.env.VITE_MAP_STYLE_URL as string;
console.log('MAP_STYLE', MAP_STYLE);
function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl(() => new DeckOverlay(props));
  overlay.setProps(props);
  return null;
}

const hexStringToRGB = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

const createLayers = (data: VData | null) => {
  if (!data) {
    return [];
  }

  const { visualizationData, layerSettings } = data;
  switch (layerSettings.brand) {
    case 'heatmap-layer':
      return [
        new HeatmapLayer<VisualizationData>({
          id: layerSettings.brand,
          data: visualizationData,
          getPosition: d => [d.longitude, d.latitude],
          opacity: layerSettings.opacity,
        })
      ];
    case 'scatterplot-layer':
      return [
        new ScatterplotLayer<VisualizationData>({
          id: layerSettings.brand,
          data: visualizationData,
          getPosition: d => [d.longitude, d.latitude],
          pickable: true,
          getRadius: () => layerSettings.radius,
          getFillColor: () => hexStringToRGB(layerSettings.color ?? '#FFFFFF'),
        })
      ];
    case 'hexagon-layer':
      return [
        new HexagonLayer<VisualizationData>({
          id: layerSettings.brand,
          data: visualizationData,
          getPosition: d => [d.longitude, d.latitude],
          radius: layerSettings.radius, // Ensure radius is defined in HexagonLayer settings
          coverage: layerSettings.coverage, // Ensure coverage is defined in HexagonLayer settings
          // Add other HexagonLayer specific props here
        })
      ];
    default:
      return [];
    }
}

function RootMap() {
  const { state, settings } = useControllerStatus();
  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<{ longitude: number; latitude: number; label: string } | null>(null);

  const layers = createLayers(settings);
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      window.navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        map.easeTo({
          center: [longitude, latitude],
          zoom: 11,
          pitch: 0,
          bearing: 0
        });
      }, (error) => {
        console.error('Error getting location:', error);
      }, {
        maximumAge: 0,
        timeout: 5000
      });
    }
  }, []);

  const openSettings = useCallback(() => {
    window.open(`${window.location.href}#ctrl`, 'popup', 'width=800,height=400');
  }, []);


  return (
    <>
      <div style={{width: '100%', height: '100%', padding: 0, margin: 0}}>
        <Map ref={mapRef} initialViewState={INITIAL_VIEW_STATE} mapStyle={MAP_STYLE}>
          <DeckGLOverlay layers={layers} onClick={(e) => {
            const { object } = e;
            if (object) {
              setPopupInfo({
                longitude: object.longitude,
                latitude: object.latitude,
                label: object.label,
              });
            }
          }} />
          <NavigationControl position="top-left" />
          {popupInfo && (
            <Popup
              longitude={popupInfo.longitude}
              latitude={popupInfo.latitude}
              closeButton={true}
              closeOnClick={false}
              onClose={() => setPopupInfo(null)}
              anchor="top"
            >
              <div>{popupInfo.label}</div>
              <div>Longitude: {popupInfo.longitude}</div>
              <div>Latitude: {popupInfo.latitude}</div>
            </Popup>
          )}
        </Map>
      </div>
      {
        state === 'unavailable' && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(3, 50, 50, 0.8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <a
              onClick={openSettings}
              style={{color: 'white', textDecoration: 'none', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer'}}>
              Open settings viewer
            </a>
          </div>
        )
      }
      {
        state === 'available' && (
          <button style={{
            position: 'fixed',
            padding: 3,
            borderRadius: '5px',
            top: 3,
            right: 3,
            backgroundColor: 'rgba(3, 50, 50, 0.8)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer',
            }}
            onClick={openSettings}  
          >
            <a>Open settings viewer</a>
          </button>
        )
      }
    </>
  );
}

export default RootMap;
