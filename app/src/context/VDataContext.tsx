import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useCSV, type CSVData } from './CSVContext';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { 
  useFilterManager,
  type FilterState 
} from '../modules/filterManager';
import { useLayerManager, type LayerSettings } from '../modules/layerManager';
import { useCSVColumnManager } from '../modules/csvColumnManager';

export interface VData {
  visualizationData: VisualizationData[];
  layerSettings: LayerSettings;
}

interface VDataState extends VData, FilterState { // Include FilterState
  latitudeColumn: string;
  longitudeColumn: string;
  labelColumn: string;
  setLatitudeColumn: (columnName: string) => void;
  setLongitudeColumn: (columnName: string) => void;
  setLabelColumn: (columnName: string) => void;
  updateLayerSettings: (settings: LayerSettings) => void;
  errorLocationMessage: string | null;
  setDateFilterColumn: (columnName: string) => void; // Add setDateFilterColumn
  setStartDate: (date: Dayjs) => void; // Add setStartDate
  setEndDate: (date: Dayjs) => void; // Add setEndDate
}


const VDataContext = createContext<VDataState | undefined>(undefined);

export type VisualizationType = 'scatterplot' | 'heatmap' | 'cluster';
export type VisualizationData = {
  latitude: number;
  longitude: number;
  label: string;
  value?: number;
  date?: Dayjs;
}

const buildVisualizationData = (
  csvData: CSVData[],
  errorLocationMessage: string | null,
  latitudeColumn: string,
  longitudeColumn: string,
  labelColumn: string,
  startDate: Dayjs, // Add startDate
  endDate: Dayjs,   // Add endDate
  errorDateMessage: string | null, // Add errorDateMessage
  dateFilterColumn: string, // Add dateFilterColumn
  setVisualizationData: (data: VisualizationData[]) => void,
) => {

  useEffect(() => {
    if (errorLocationMessage || !latitudeColumn || !longitudeColumn) {
      setVisualizationData([]);
      return;
    }

    const isSetValidDate = !errorDateMessage && startDate && endDate && !!dateFilterColumn;
    const data: VisualizationData[] = csvData.flatMap((row) => {
      if (row[latitudeColumn] === undefined || row[longitudeColumn] === undefined) {
        console.warn(`Missing latitude or longitude in row: ${JSON.stringify(row)}`);
        return [];
      }
      if (isNaN(Number(row[latitudeColumn])) || isNaN(Number(row[longitudeColumn]))) {
        console.warn(`Missing latitude or longitude in row: ${JSON.stringify(row)}`);
        return [];
      }
      
      const dateValue = isSetValidDate && row[dateFilterColumn] ? dayjs(row[dateFilterColumn]) : undefined;
      return [{
        latitude: Number(row[latitudeColumn]),
        longitude: Number(row[longitudeColumn]),
        label: row[labelColumn] as string,
        date: dateValue,
        value: undefined,
      }];
    });

    if (isSetValidDate) {
      const filteredData = data.filter((row) => {
        const dateValue = row.date;
        if (!dateValue) {
          return false; // Skip rows without a date
        }
        return dateValue.isAfter(startDate) && dateValue.isBefore(endDate);
      });
      setVisualizationData(filteredData);
    } else {
      setVisualizationData(data);
    }
  }, [csvData, latitudeColumn, longitudeColumn, labelColumn, errorLocationMessage, startDate, endDate, errorDateMessage, dateFilterColumn]);
}

const postUpdateSettings = ({ visualizationData, layerSettings }: VData, channel: BroadcastChannel) => {
  channel.postMessage({
    type: 'update-settings',
    payload: {
      visualizationData,
      layerSettings,
    }
  });
}

export const VDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { csvData } = useCSV();

  const [visualizationData, setVisualizationData] = useState<VisualizationData[]>([]);
  const { filterState, handleSetDateFilterColumn, handleSetStartDate, handleSetEndDate } = useFilterManager(csvData);
  const { layerSettings, updateLayerSettings } = useLayerManager();

  const {
    latitudeColumn,
    longitudeColumn,
    labelColumn,
    setLatitudeColumn ,
    setLongitudeColumn,
    setLabelColumn,
    errorLocationMessage,
  } = useCSVColumnManager(csvData);

  buildVisualizationData(
    csvData,
    errorLocationMessage,
    latitudeColumn,
    longitudeColumn,
    labelColumn,
    filterState.startDate, // Pass from VDataProvider's state
    filterState.endDate,   // Pass from VDataProvider's state
    filterState.errorDateMessage, // Pass from VDataProvider's state
    filterState.dateFilterColumn, // Pass from VDataProvider's state
    setVisualizationData,
  );

  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel('map-settings');
    channelRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data?.type === 'settings-request') {
        postUpdateSettings({ visualizationData, layerSettings }, channel);
      }
    };
    return () => {
      channel.close();
    };
  }, []);

  useEffect(() => {
    if (visualizationData.length > 0) {
      postUpdateSettings({ visualizationData, layerSettings }, channelRef.current!);
    }
  }, [visualizationData, layerSettings]);

  const value: VDataState = {
    latitudeColumn,
    longitudeColumn,
    labelColumn,
    setLatitudeColumn,
    setLongitudeColumn,
    setLabelColumn,
    errorLocationMessage,
    visualizationData,
    layerSettings,
    updateLayerSettings,
    // Add filter state and setters to context value
    dateFilterColumn: filterState.dateFilterColumn,
    startDate: filterState.startDate,
    endDate: filterState.endDate,
    minDate: filterState.minDate,
    maxDate: filterState.maxDate,
    errorDateMessage: filterState.errorDateMessage,
    setDateFilterColumn: handleSetDateFilterColumn,
    setStartDate: handleSetStartDate,
    setEndDate: handleSetEndDate,
  };

  return (
    <VDataContext.Provider value={value}>
      {children}
    </VDataContext.Provider>
  );
};

export const useVData = () => {
  const context = useContext(VDataContext);
  if (!context) {
    throw new Error('useVData must be used within a VDataProvider');
  }
  return context;
};
