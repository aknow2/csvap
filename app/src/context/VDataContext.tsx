import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useCSV, type CSVData } from './CSVContext';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

type HeatmapLayer = {
  brand: 'heatmap-layer';
  opacity: number;
}
type ScatterplotLayer = {
  brand: 'scatterplot-layer';
  radius: number;
  color: string;
}

type HexagonLayer = {
  brand: 'hexagon-layer';
  radius: number;
  coverage: number; // Example property, adjust as needed
  opacity: number; // Add opacity to HexagonLayer
  // Add other HexagonLayer specific properties here
}

export type LayerSettings = HeatmapLayer | ScatterplotLayer | HexagonLayer;

export type LayerTypes = LayerSettings['brand'];
export const layerTypes: LayerTypes[] = ['heatmap-layer', 'scatterplot-layer', 'hexagon-layer'];
export interface VData {
  visualizationData: VisualizationData[];
  layerSettings: LayerSettings;
}

interface VDataType extends VData {
  latitudeColumn: string;
  longitudeColumn: string;
  labelColumn: string;
  setLatitudeColumn: (columnName: string) => void;
  setLongitudeColumn: (columnName: string) => void;
  setLabelColumn: (columnName: string) => void;
  updateLayerSettings: (settings: LayerSettings) => void;
  errorLocationMessage: string | null;
  setDateFilterColumn: (columnName: string) => void;
  startDate: Dayjs;
  endDate: Dayjs;
  setStartDate: (date: Dayjs) => void;
  setEndDate: (date: Dayjs) => void;
  errorDateMessage: string | null;
  dateFilterColumn: string;
  minDate: Dayjs;
  maxDate: Dayjs;
}

const validateNumberColumn = (columnName: string, data: CSVData[]): boolean => {
    if (!columnName) {
        return true; // No column selected, so it's valid
    }
    for (const row of data) {
        const value = row[columnName];
        if (value === undefined || value === null) {
            continue; // Skip undefined or null values
        }
        if (typeof value !== 'number' || isNaN(Number(value))) {
            console.error(`Invalid value in column ${columnName}: ${value} ${typeof value}`);
            return false; // Non-numeric value found
        }
    }
    return true; // All values are numeric
};

const VDataContext = createContext<VDataType | undefined>(undefined);

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
  startDate: Dayjs,
  endDate: Dayjs,
  errorDateMessage: string | null,
  dateFilterColumn: string,
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

const validateDateColumn = (columnName: string, data: CSVData[]): boolean => {
  if (!columnName) {
    return true; // No column selected, so it's valid
  }
  for (const row of data) {
    const value = row[columnName];
    if (value === undefined || value === null) {
      continue; // Skip undefined or null values
    }
    const dateValue = dayjs(value);
    if (!dateValue.isValid()) {
      return false; // Non-date value found
    }
  }
  return true; // All values are valid dates
};

const effectDateFilter = (
  csvData: CSVData[],
  dateFilterColumn: string,
  startDate: Dayjs,
  endDate: Dayjs,
  setStartDate: (date: Dayjs) => void,
  setEndDate: (date: Dayjs) => void,
  setDateFilterError: (msg: string | null) => void,
  setMinDate: (date: Dayjs) => void,
  setMaxDate: (date: Dayjs) => void,
) => {
  useEffect(() => {
    if (csvData.length > 0 && dateFilterColumn) {
      // check if the dateFilterColumn is valid
      setDateFilterError(null);
      const isValidDateFilter = validateDateColumn(dateFilterColumn, csvData);
      if (!isValidDateFilter) {
        setDateFilterError('Invalid date column');
        return;
      }
      const getFirstValidDate = () => {
        const firstValidDate = csvData.find((row) => {
          const dateValue = dayjs(row[dateFilterColumn]);
          return dateValue.isValid();
        });
        return firstValidDate ? dayjs(firstValidDate[dateFilterColumn]) : null;
      };
      const { startDate, endDate } = csvData.reduce((acc, row) => {

        const dateValue =  row[dateFilterColumn] ?  dayjs(row[dateFilterColumn]) : null;
        if (!dateValue || !dateValue.isValid()) {
          return acc; // Skip invalid date values
        }
        if (acc.startDate === null || acc.endDate === null) {
          acc.startDate = dateValue;
          acc.endDate = dateValue;
          return acc;
        }
        if (dateValue.isBefore(acc.startDate)) {
          acc.startDate = dateValue;
        }
        if (dateValue.isAfter(acc.endDate)) {
          acc.endDate = dateValue;
        }
        return acc;
      }
      , { startDate: getFirstValidDate(), endDate: getFirstValidDate() } as { startDate: Dayjs | null, endDate: Dayjs | null });

      setStartDate(startDate ?? dayjs());
      setEndDate(endDate ?? dayjs());
      setMinDate(startDate ?? dayjs());
      setMaxDate(endDate ?? dayjs());
    }
  }, [csvData, dateFilterColumn]);

  //validate date range
  useEffect(() => {
    if (startDate > endDate) {
      setDateFilterError('Start date must be before end date');
    } else {
      setDateFilterError(null);
    }
  }
  , [startDate, endDate]);
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

  // csv settings
  const [latitudeColumn, setLatitudeColumn] = useState('');
  const [longitudeColumn, setLongitudeColumn] = useState('');
  const [labelColumn, setLabelColumn] = useState('');
  const [errorLocationMessage, setErrorLocationMessage] = useState<string | null>('');
  const [visualizationData, setVisualizationData] = useState<VisualizationData[]>([]);

  // filter settings
  const [dateFilterColumn, setDateFilterColumn] = useState<string>('');
  const [startDate, setStartDate] = useState<Dayjs>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs>(dayjs());
  const [ minDate, setMinDate] = useState<Dayjs>(dayjs());
  const [maxDate, setMaxDate] = useState<Dayjs>(dayjs());
  const [dateFilterError, setDateFilterError] = useState<string | null>(null);

  effectDateFilter(
    csvData,
    dateFilterColumn,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    setDateFilterError,
    setMinDate,
    setMaxDate
  );

  buildVisualizationData(
    csvData,
    errorLocationMessage,
    latitudeColumn,
    longitudeColumn,
    labelColumn,
    startDate,
    endDate,
    dateFilterError,
    dateFilterColumn,
    setVisualizationData,
  );

  // layer settings
  const [layerSettings, setLayerSettings] = useState<LayerSettings>({
    brand: 'hexagon-layer', // Default to HexagonLayer
    radius: 1000,           // Example default radius for HexagonLayer
    coverage: 0.8,          // Example default coverage for HexagonLayer
    opacity: 0.8,           // Example default opacity for HexagonLayer
    // upperPercentile: 100, // Example: if you add more properties to HexagonLayer type
    // colorRange: [[255,255,178,255],[254,204,92,255],[253,141,60,255],[240,59,32,255],[189,0,38,255]], // Example color range
  });

  const channelRef = useRef<BroadcastChannel | null>(null);

  // update layer settings
  const updateLayerSettings = (settings: LayerSettings) => {
    setLayerSettings(settings);
    postUpdateSettings({ visualizationData, layerSettings: settings }, channelRef.current!);
  };

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
  }, [visualizationData]);


  const handleSetDateFilterColumn = (columnName: string) => {
    if (csvData.length > 0 && !validateDateColumn(columnName, csvData)) {
      setDateFilterError('Invalid date column');
      setDateFilterColumn('');
    } else {
      setDateFilterColumn(columnName);
      setDateFilterError(null);
    }
  };

  const handleSetLatitudeColumn = (columnName: string) => {
    if (csvData.length > 0 && !validateNumberColumn(columnName, csvData)) {
      setErrorLocationMessage('Latitude column must contain numeric data');
      setLatitudeColumn('');
    } else {
      setLatitudeColumn(columnName);
      setErrorLocationMessage(null);
    }
  };

  const handleSetLongitudeColumn = (columnName: string) => {
    if (csvData.length > 0 && !validateNumberColumn(columnName, csvData)) {
      setErrorLocationMessage('Longitude column must contain numeric data');
      setLongitudeColumn('');
    } else {
      setLongitudeColumn(columnName);
      setErrorLocationMessage(null);
    }
  };

  const value: VDataType = {
    latitudeColumn,
    longitudeColumn,
    labelColumn,
    setLatitudeColumn: handleSetLatitudeColumn,
    setLongitudeColumn: handleSetLongitudeColumn,
    setLabelColumn: (columnName: string) => setLabelColumn(columnName),
    setDateFilterColumn: handleSetDateFilterColumn,
    errorLocationMessage,
    visualizationData,
    layerSettings,
    updateLayerSettings,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    dateFilterColumn,
    errorDateMessage: dateFilterError,
    minDate,
    maxDate,
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
