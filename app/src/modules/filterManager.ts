import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { CSVData } from '../context/CSVContext';
import { useEffect, useState } from 'react';

export interface FilterState {
  dateFilterColumn: string;
  startDate: Dayjs;
  endDate: Dayjs;
  minDate: Dayjs;
  maxDate: Dayjs;
  errorDateMessage: string | null;
}

export type FilterActions = {
    handleSetDateFilterColumn: (columnName: string) => void;
    handleSetStartDate: (date: Dayjs) => void;
    handleSetEndDate: (date: Dayjs) => void;
}

export type FilterManager = {
  filterState: FilterState;
} & FilterActions;

const initialFilterState: FilterState = {
  dateFilterColumn: '',
  startDate: dayjs(),
  endDate: dayjs(),
  minDate: dayjs(),
  maxDate: dayjs(),
  errorDateMessage: null,
};

const validateDateColumn = (columnName: string, data: CSVData[]): boolean => {
  if (!columnName) {
    return true;
  }
  for (const row of data) {
    const value = row[columnName];
    if (value === undefined || value === null) {
      continue;
    }
    const dateValue = dayjs(value);
    if (!dateValue.isValid()) {
      return false;
    }
  }
  return true;
};

const calculateDateRange = (
  csvData: CSVData[],
  dateFilterColumn: string
): { minDate: Dayjs | null; maxDate: Dayjs | null } => {
  if (!dateFilterColumn || csvData.length === 0) {
    return { minDate: null, maxDate: null };
  }

  const getFirstValidDate = () => {
    const firstValidDateRow = csvData.find((row) => {
      const dateValue = dayjs(row[dateFilterColumn]);
      return dateValue.isValid();
    });
    return firstValidDateRow ? dayjs(firstValidDateRow[dateFilterColumn]) : null;
  };

  let minDate: Dayjs | null = getFirstValidDate();
  let maxDate: Dayjs | null = getFirstValidDate();

  for (const row of csvData) {
    const dateValue = row[dateFilterColumn] ? dayjs(row[dateFilterColumn]) : null;
    if (!dateValue || !dateValue.isValid()) {
      continue;
    }
    if (minDate === null || dateValue.isBefore(minDate)) {
      minDate = dateValue;
    }
    if (maxDate === null || dateValue.isAfter(maxDate)) {
      maxDate = dateValue;
    }
  }
  return { minDate, maxDate };
};

const updateFilterStateOnColumnChange = (
  currentState: FilterState,
  csvData: CSVData[],
  newColumn: string
): FilterState => {
  if (csvData.length > 0 && newColumn) {
    if (!validateDateColumn(newColumn, csvData)) {
      return { ...currentState, dateFilterColumn: newColumn, errorDateMessage: 'Invalid date column' };
    }
    const { minDate, maxDate } = calculateDateRange(csvData, newColumn);
    return {
      ...currentState,
      dateFilterColumn: newColumn,
      startDate: minDate ?? dayjs(),
      endDate: maxDate ?? dayjs(),
      minDate: minDate ?? dayjs(),
      maxDate: maxDate ?? dayjs(),
      errorDateMessage: null,
    };
  } else if (!newColumn) {
    return {
      ...initialFilterState, // Reset to initial if column is cleared
      dateFilterColumn: '', // Ensure column is explicitly empty
    };
  }
  return currentState; // Should not happen if newColumn is empty, but as a fallback
};

const validateDateRange = (currentState: FilterState): FilterState => {
  if (currentState.startDate.isValid() && currentState.endDate.isValid() && currentState.startDate.isAfter(currentState.endDate)) {
    return { ...currentState, errorDateMessage: 'Start date must be before end date' };
  } else if (currentState.errorDateMessage) {
    return { ...currentState, errorDateMessage: null };
  }
  return currentState;
};

export const useFilterManager = (
  csvData: CSVData[],
): FilterManager => {
  // Filter state managed by VDataProvider
  const [filterState, setFilterState] = useState<FilterState>(initialFilterState);

  useEffect(() => {
    setFilterState(currentState => updateFilterStateOnColumnChange(currentState, csvData, currentState.dateFilterColumn));
  }, [csvData, filterState.dateFilterColumn]);

  useEffect(() => {
    setFilterState(currentState => validateDateRange(currentState));
  }, [filterState.startDate, filterState.endDate]); // Keep dependency on errorDateMessage if it can be set from elsewhere

  const handleSetDateFilterColumn = (columnName: string) => {
    setFilterState(prevState => ({ ...prevState, dateFilterColumn: columnName }));
  };

  const handleSetStartDate = (date: Dayjs) => {
    setFilterState(prevState => ({ ...prevState, startDate: date }));
  };

  const handleSetEndDate = (date: Dayjs) => {
    setFilterState(prevState => ({ ...prevState, endDate: date }));
  };

  return {
    filterState,
    handleSetDateFilterColumn,
    handleSetStartDate,
    handleSetEndDate,
  };
}