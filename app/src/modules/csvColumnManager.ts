import { useState } from "react";
import type { CSVData } from "../context/CSVContext";

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

export const useCSVColumnManager = (csvData: CSVData[]) => {
  // csv settings
  const [latitudeColumn, setLatitudeColumn] = useState('');
  const [longitudeColumn, setLongitudeColumn] = useState('');
  const [labelColumn, setLabelColumn] = useState('');
  const [errorLocationMessage, setErrorLocationMessage] = useState<string | null>('');

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


  return {
    latitudeColumn,
    longitudeColumn,
    labelColumn,
    setLatitudeColumn: handleSetLatitudeColumn,
    setLongitudeColumn: handleSetLongitudeColumn,
    setLabelColumn,
    errorLocationMessage,
  }
}
