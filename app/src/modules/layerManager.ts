import { useState, useCallback } from 'react';

// Layer type definitions - these can be expanded with more specific properties
export type HeatmapLayerSettings = {
  brand: 'heatmap-layer';
  opacity: number;
  // Add other heatmap specific properties here
};

export type ScatterplotLayerSettings = {
  brand: 'scatterplot-layer';
  radius: number;
  color: string;
  // Add other scatterplot specific properties here
};

export type HexagonLayerSettings = {
  brand: 'hexagon-layer';
  radius: number;
  coverage: number;
  opacity: number;
  upperPercentile?: number; 
  colorRange?: number[][]; 
};

export type LayerSettings = HeatmapLayerSettings | ScatterplotLayerSettings | HexagonLayerSettings;

export type LayerType = LayerSettings['brand'];

const layerTypes: LayerType[] = ['heatmap-layer', 'scatterplot-layer', 'hexagon-layer'];

const initialLayerSettings: LayerSettings = {
  brand: 'hexagon-layer', // Default layer type
  radius: 1000,
  coverage: 0.8,
  opacity: 0.8,
};

// Custom hook for layer management
export interface LayerManagerHook {
  layerSettings: LayerSettings;
  updateLayerSettings: (newSettings: LayerSettings) => void;
  setLayerType: (type: LayerType) => void;
  layerTypes: LayerType[];
}

export const useLayerManager = (): LayerManagerHook => {
  const [layerSettings, setLayerSettings] = useState<LayerSettings>(initialLayerSettings);

  const updateLayerSettings = useCallback((newSettings: LayerSettings) => {
    setLayerSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  }, []);

  const setLayerType = useCallback((type: LayerType) => {
    switch (type) {
      case 'heatmap-layer':
        setLayerSettings({
          brand: 'heatmap-layer',
          opacity: 0.6, // Default opacity for heatmap
        });
        break;
      case 'scatterplot-layer':
        setLayerSettings({
          brand: 'scatterplot-layer',
          radius: 5,
          color: '#007bff', // Default color for scatterplot
        });
        break;
      case 'hexagon-layer':
        setLayerSettings({
          brand: 'hexagon-layer',
          radius: 1000,
          coverage: 0.8,
          opacity: 0.8,
        });
        break;
      default:
        setLayerSettings(initialLayerSettings); // Fallback to initial general settings
    }
  }, []);

  return {
    layerSettings,
    updateLayerSettings,
    setLayerType,
    layerTypes,
  };
};
