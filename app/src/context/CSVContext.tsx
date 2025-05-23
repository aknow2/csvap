import React, { createContext, useState, useContext } from 'react';
import Papa from 'papaparse';

export interface CSVData {
  [key: string]: string | number;
}

interface CSVContextType {
  csvData: CSVData[];
  columnNames: string[];
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const CSVContext = createContext<CSVContextType | undefined>(undefined);

export type VisualizationType = 'scatterplot' | 'heatmap' | 'cluster';
export type VisualizationData = {
  latitude: number;
  longitude: number;
  label: string;
  value?: number;
}

export const CSVProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [csvData, setCsvData] = useState<CSVData[]>([]);
  const [columnNames, setColumnNames] = useState<string[]>([]);

  // handlers
  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results: any) => {
        setCsvData(results.data as CSVData[]);
        if (results.data.length > 0 && typeof results.data[0] === 'object' && results.data[0] !== null) {
          setColumnNames(Object.keys(results.data[0]));
        }
      }
    });
  };

  const value: CSVContextType = {
    csvData,
    columnNames,
    handleFileChange,
  };

  return (
    <CSVContext.Provider value={value}>
      {children}
    </CSVContext.Provider>
  );
};

export const useCSV = () => {
  const context = useContext(CSVContext);
  if (!context) {
    throw new Error('useCSV must be used within a CSVProvider');
  }
  return context;
};
