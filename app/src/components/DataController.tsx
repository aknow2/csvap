import dayjs, { Dayjs } from 'dayjs';
import React, { useState } from 'react';
import { useCSV } from '../context/CSVContext';
import { useVData } from '../context/VDataContext';
import type { LayerSettings, LayerType, HeatmapLayerSettings, ScatterplotLayerSettings, HexagonLayerSettings } from '../modules/layerManager';

// Helper types for LayerEditorCard
type ModifiableHeatmapSettings = Omit<HeatmapLayerSettings, 'id' | 'brand'>;
type ModifiableScatterplotSettings = Omit<ScatterplotLayerSettings, 'id' | 'brand'>;
type ModifiableHexagonSettings = Omit<HexagonLayerSettings, 'id' | 'brand'>;

// Union of all keys that can be modified across any layer type
type AllModifiableSettingKeys = 
  keyof ModifiableHeatmapSettings | 
  keyof ModifiableScatterplotSettings | 
  keyof ModifiableHexagonSettings;

function OutlinedCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      width: '100%',
      maxWidth: '600px',
      backgroundColor: '#fff' }}>
      {children}
    </div>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      {children}
    </div>
  );
};

function CardTitle({ title }: { title: string }) {
  return (
    <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
      {title}
    </h3>
  );
}

function CardSubtitle({ subtitle }: { subtitle: string }) {
  return (
    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'normal' }}>
      {subtitle}
    </h4>
  );
}

// Remove old LayerSelection and LayerSettings components as they are for a single layer.
// We will create a new component for editing individual layers.

interface LayerEditorCardProps {
  layer: LayerSettings;
  updateLayer: (id: string, newSettings: Partial<Omit<LayerSettings, 'id' | 'brand'>>) => void;
  removeLayer: (id: string) => void;
}

const LayerEditorCard: React.FC<LayerEditorCardProps> = ({ layer, updateLayer, removeLayer }) => {
  // Updated handleSettingChange function
  const handleSettingChange = <K extends AllModifiableSettingKeys>(
    setting: K,
    value: K extends 'color' ? string : number // 'color' is string, other known settings are numbers
  ) => {
    // The object { [setting]: value } is now strongly typed.
    // e.g., if K is 'opacity', value is number -> { opacity: number }
    // This is assignable to Partial<Omit<LayerSettings, 'id' | 'brand'>>
    updateLayer(layer.id, { [setting]: value });
  };

  const renderLayerSpecificSettings = () => {
    switch (layer.brand) {
      case 'heatmap-layer':
        const heatmapSettings = layer as HeatmapLayerSettings;
        return (
          <>
            <CardSubtitle subtitle="Heatmap Settings" />
            <div>
              <label>Opacity: </label>
              <input
                type="number"
                value={heatmapSettings.opacity}
                style={{ width: '40%' }}
                min={0}
                max={1}
                step={0.01}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 1) {
                    handleSettingChange('opacity', val);
                  }
                }}
              />
            </div>
          </>
        );
      case 'scatterplot-layer':
        const scatterplotSettings = layer as ScatterplotLayerSettings;
        return (
          <>
            <CardSubtitle subtitle="Scatterplot Settings" />
            <div>
              <label>Radius: </label>
              <input
                type="number"
                value={scatterplotSettings.radius}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  // Added NaN check and ensure positive for radius
                  if (!isNaN(val) && val > 0) {
                     handleSettingChange('radius', val);
                  }
                }}
              />
            </div>
            <div>
              <label>Color: </label>
              <input
                type="color"
                value={scatterplotSettings.color}
                onChange={(e) => handleSettingChange('color', e.target.value)}
              />
            </div>
          </>
        );
      case 'hexagon-layer':
        const hexagonSettings = layer as HexagonLayerSettings;
        return (
          <>
            <CardSubtitle subtitle="Hexagon Settings" />
            <div>
              <label>Radius (m): </label>
              <input
                type="number"
                value={hexagonSettings.radius}
                min={50} // Example min
                onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if(!isNaN(val) && val >= 50) handleSettingChange('radius', val)
                }}
              />
            </div>
            <div>
              <label>Coverage (0-1): </label>
              <input
                type="number"
                value={hexagonSettings.coverage}
                min={0}
                max={1}
                step={0.01}
                onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if(!isNaN(val) && val >=0 && val <=1) handleSettingChange('coverage', val)
                }}
              />
            </div>
            <div>
              <label>Opacity (0-1): </label>
              <input
                type="number"
                value={hexagonSettings.opacity}
                min={0}
                max={1}
                step={0.01}
                onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if(!isNaN(val) && val >=0 && val <=1) handleSettingChange('opacity', val)
                }}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <OutlinedCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CardTitle title={`${layer.brand.replace('-layer', '').replace(/^\w/, c => c.toUpperCase())} Layer (ID: ${layer.id.substring(0, 4)})`} />
        <button onClick={() => removeLayer(layer.id)} style={{ color: 'red', background:'none', border:'none', cursor:'pointer'}}>Remove</button>
      </div>
      {renderLayerSpecificSettings()}
    </OutlinedCard>
  );
}

function DatetimeFilterSetting({
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    errorMessage,
    columnNames,
    setDateFilterColumn,
    dateFilterColumn,
    minDate,
    maxDate,
  }: {
    startDate: Dayjs;
    endDate: Dayjs;
    setStartDate: (date: Dayjs) => void;
    setEndDate: (date: Dayjs) => void;
    setDateFilterColumn: (columnName: string) => void;
    errorMessage: string | null;
    columnNames: string[];
    minDate: Dayjs;
    maxDate: Dayjs;
    dateFilterColumn: string;
  }) {


  return (
    <OutlinedCard>
      <CardTitle title="Datetime Filter" />
      <div>
        <label>Date Filter Column</label>
        <select
          value={dateFilterColumn}
          onChange={(e) => {
            setDateFilterColumn(e.target.value);
          }}
        >
           <option value="">Select a column</option>
          {
            columnNames.map((columnName) => (
              <option key={columnName} value={columnName}>
                {columnName}
              </option>
            ))
          }
        </select>
      </div>
      <div>
        <label>Start Date</label>
        <input
          type="datetime-local"
          value={startDate.format('YYYY-MM-DDTHH:mm')}
          min={minDate.format('YYYY-MM-DDTHH:mm')}
          max={maxDate.format('YYYY-MM-DDTHH:mm')}
          onChange={(e) => {
            const selectedDate = dayjs(e.target.value);
              // check valid date object
              if (selectedDate.isValid()) {
                setStartDate(selectedDate);
              }
          } }
        />
      </div>
      <div>
        <label>End Date</label>
        <input
          type="datetime-local"
          value={endDate.format('YYYY-MM-DDTHH:mm')}
          min={minDate.format('YYYY-MM-DDTHH:mm')}
          max={maxDate.format('YYYY-MM-DDTHH:mm')}
          onChange={(e) => {
            const selectedDate = dayjs(e.target.value);
              // check valid date object
              if (selectedDate.isValid()) {
                setEndDate(selectedDate);
              }
          }
          }
        />
      </div>
      <div>
        <input
          type="range"
          style={{ width: '100%' }}
          min={minDate.valueOf()}
          max={maxDate.valueOf()}
          value={ startDate.valueOf()}
          onChange={(e) => {
            const deltaTime = endDate.valueOf() - startDate.valueOf();
            const selectedStartDate = dayjs(Number(e.target.value));
            const selectedEndDate = selectedStartDate.add(deltaTime, 'millisecond');
            if (selectedStartDate.isValid() && selectedEndDate.isValid() && selectedEndDate.isBefore(maxDate)) {
              setStartDate(selectedStartDate);
              setEndDate(selectedEndDate);
            }
          }}
        />
      </div>
      {errorMessage && (
        <div style={{ color: 'red' }}>{errorMessage}</div>
      )}
    </OutlinedCard>
  );
}

function DataController() {
  const { csvData, columnNames, handleFileChange } = useCSV();
  const {
    latitudeColumn,
    setLatitudeColumn,
    longitudeColumn,
    setLongitudeColumn,
    labelColumn,
    setLabelColumn,
    errorLocationMessage,
    // visualizationData, // Not directly used in DataController UI for layer settings now
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    setDateFilterColumn,
    errorDateMessage,
    dateFilterColumn,
    minDate,
    maxDate,
    activeLayers,
    addLayer,
    removeLayer,
    updateLayer,
    layerTypes,
  } = useVData();

  const [selectedLayerTypeToAdd, setSelectedLayerTypeToAdd] = useState<LayerType>(layerTypes[0] || 'hexagon-layer');

  const handleAddLayer = () => {
    if (selectedLayerTypeToAdd) {
      addLayer(selectedLayerTypeToAdd);
    }
  };

  return (
    <Container>
      <OutlinedCard>
        <CardTitle title="Data Source" />
        <input type="file" accept=".csv" onChange={handleFileChange} />
        {csvData && (
          <>
            <div>
              <label>Latitude Column</label>
              <select
                value={latitudeColumn}
                onChange={(e) => setLatitudeColumn(e.target.value)}
              >
                <option value="">Select a column</option>
                {columnNames.map((columnName) => (
                  <option key={columnName} value={columnName}>
                    {columnName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Longitude Column</label>
              <select
                value={longitudeColumn}
                onChange={(e) => setLongitudeColumn(e.target.value)}
              >
                <option value="">Select a column</option>
                {columnNames.map((columnName) => (
                  <option key={columnName} value={columnName}>
                    {columnName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Label Column</label>
              <select
                value={labelColumn}
                onChange={(e) => setLabelColumn(e.target.value)}
              >
                <option value="">Select a column</option>
                {columnNames.map((columnName) => (
                  <option key={columnName} value={columnName}>
                    {columnName}
                  </option>
                ))}
              </select>
            </div>
            {errorLocationMessage && (
              <div style={{ color: 'red' }}>{errorLocationMessage}</div>
            )}
          </>
        )}
      </OutlinedCard>

      {csvData && (
        <DatetimeFilterSetting 
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          errorMessage={errorDateMessage}
          columnNames={columnNames}
          setDateFilterColumn={setDateFilterColumn}
          dateFilterColumn={dateFilterColumn}
          minDate={minDate}
          maxDate={maxDate}
        />
      )}

      {/* Layer Management UI */}
      <OutlinedCard>
        <CardTitle title="Layer Configuration" />
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="layerTypeSelect" style={{ marginRight: '8px' }}>Add Layer Type:</label>
          <select 
            id="layerTypeSelect"
            value={selectedLayerTypeToAdd} 
            onChange={(e) => setSelectedLayerTypeToAdd(e.target.value as LayerType)}
            style={{ marginRight: '8px' }}
          >
            {layerTypes.map(type => (
              <option key={type} value={type}>
                {type.replace('-layer', '').replace(/^\w/, c => c.toUpperCase())}
              </option>
            ))}
          </select>
          <button onClick={handleAddLayer}>Add Layer</button>
        </div>

        {activeLayers.length === 0 && <p>No layers added yet. Add a layer to begin.</p>}
        {activeLayers.map(layer => (
          <LayerEditorCard 
            key={layer.id} 
            layer={layer} 
            updateLayer={updateLayer} 
            removeLayer={removeLayer} 
          />
        ))}
      </OutlinedCard>

    </Container>
  );
}

export default DataController;
