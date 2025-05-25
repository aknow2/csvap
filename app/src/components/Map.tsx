import {Map, NavigationControl, Popup, useControl, type MapRef} from 'react-map-gl/maplibre';
import {MapboxOverlay as DeckOverlay} from '@deck.gl/mapbox';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { DeckProps, Layer } from '@deck.gl/core'; // Import Layer type
import { type VData, type VisualizationData } from '../context/VDataContext'; // Updated VData will have activeLayers
import { useControllerStatus } from '../context/ControllerStatusContext';
// import type { VisualizationData } from '../context/CSVContext'; // This seems to be re-declared or can be taken from VDataContext
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
  if (!/^#[0-9A-F]{6}$/i.test(hex)) {
    console.warn(`Invalid hex color string: ${hex}. Defaulting to white.`);
    return [255, 255, 255]; // Default to white or handle error as appropriate
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// Updated createLayers to handle an array of LayerSettings
const createLayers = (visualizationData: VisualizationData[], activeLayers: VData['activeLayers'] | undefined): Layer<any>[] => {
  if (!visualizationData || !activeLayers || activeLayers.length === 0) {
    return [];
  }

  const deckLayers: Layer<any>[] = [];

  activeLayers.forEach(layerSettings => {
    switch (layerSettings.brand) {
      case 'heatmap-layer':
        deckLayers.push(
          new HeatmapLayer<VisualizationData>({
            id: layerSettings.id, // Use unique ID from layerSettings
            data: visualizationData,
            getPosition: d => [d.longitude, d.latitude],
            opacity: layerSettings.opacity,
          })
        );
        break;
      case 'scatterplot-layer':
        deckLayers.push(
          new ScatterplotLayer<VisualizationData>({
            id: layerSettings.id, // Use unique ID from layerSettings
            data: visualizationData,
            getPosition: d => [d.longitude, d.latitude],
            pickable: true,
            getRadius: () => layerSettings.radius,
            getFillColor: () => hexStringToRGB(layerSettings.color ?? '#FFFFFF'),
          })
        );
        break;
      case 'hexagon-layer':
        deckLayers.push(
          new HexagonLayer<VisualizationData>({
            id: layerSettings.id, // Use unique ID from layerSettings
            data: visualizationData,
            getPosition: d => [d.longitude, d.latitude],
            radius: layerSettings.radius,
            coverage: layerSettings.coverage,
            opacity: layerSettings.opacity,
          }) // Type assertion if needed for specific props
        );
        break;
      default:
        // Optionally log a warning for unknown layer types
        // console.warn(`Unknown layer type: ${(layerSettings as any).brand}`);
        break;
    }
  });

  return deckLayers;
}

function RootMap() {
  const { state, settings } = useControllerStatus();
  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<{ longitude: number; latitude: number; label: string } | null>(null);

  // Pass visualizationData and activeLayers to createLayers
  const layers = settings ? createLayers(settings.visualizationData, settings.activeLayers) : [];

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
            } else {
              setPopupInfo(null);
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
