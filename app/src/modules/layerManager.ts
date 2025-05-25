import { useState, useCallback } from 'react';

// Layer type definitions with ID
export type HeatmapLayerSettings = {
  id: string;
  brand: 'heatmap-layer';
  opacity: number;
};

export type ScatterplotLayerSettings = {
  id: string;
  brand: 'scatterplot-layer';
  radius: number;
  color: string;
};

export type HexagonLayerSettings = {
  id: string;
  brand: 'hexagon-layer';
  radius: number;
  coverage: number;
  opacity: number;
  upperPercentile?: number;
  colorRange?: number[][];
};

export type LayerSettings = HeatmapLayerSettings | ScatterplotLayerSettings | HexagonLayerSettings;

export type LayerType = LayerSettings['brand'];

export const layerTypes: LayerType[] = ['heatmap-layer', 'scatterplot-layer', 'hexagon-layer'];

// Initial state: an empty array or a default layer
export const initialActiveLayers: LayerSettings[] = [];

// Function to get default settings for a layer type
const getDefaultSettingsForType = (type: LayerType, id: string): LayerSettings => {
  switch (type) {
    case 'heatmap-layer':
      return { id, brand: 'heatmap-layer', opacity: 0.6 };
    case 'scatterplot-layer':
      return { id, brand: 'scatterplot-layer', radius: 5, color: '#007bff' };
    case 'hexagon-layer':
      return { id, brand: 'hexagon-layer', radius: 1000, coverage: 0.8, opacity: 0.8 };
    default:
      // This case should ideally not be reached if type is validated
      throw new Error(`Unknown layer type: ${type}`);
  }
};

export interface LayerManagerHook {
  activeLayers: LayerSettings[];
  addLayer: (type: LayerType) => string; // Returns the ID of the new layer
  removeLayer: (id: string) => void;
  updateLayer: (id: string, newSettings: Partial<Omit<LayerSettings, 'id' | 'brand'>>) => void;
  layerTypes: LayerType[];
}

export const useLayerManager = (): LayerManagerHook => {
  const [activeLayers, setActiveLayers] = useState<LayerSettings[]>(initialActiveLayers);

  const addLayer = useCallback((type: LayerType): string => {
    const newId = crypto.randomUUID(); // Use crypto.randomUUID()
    const newLayer = getDefaultSettingsForType(type, newId);
    setActiveLayers(prevLayers => [...prevLayers, newLayer]);
    return newId;
  }, []);

  const removeLayer = useCallback((id: string) => {
    setActiveLayers(prevLayers => prevLayers.filter(layer => layer.id !== id));
  }, []);

  const updateLayer = useCallback((id: string, newSettings: Partial<Omit<LayerSettings, 'id' | 'brand'>>) => {
    setActiveLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === id ? { ...layer, ...newSettings } : layer
      )
    );
  }, []);

  return {
    activeLayers,
    addLayer,
    removeLayer,
    updateLayer,
    layerTypes,
  };
};
