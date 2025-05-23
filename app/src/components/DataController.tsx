import dayjs, { Dayjs } from 'dayjs';
import { useCSV } from '../context/CSVContext';
import { useVData, type LayerSettings } from '../context/VDataContext';

function OutlinedCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', marginBottom: '16px', width: '100%', maxWidth: '400px', backgroundColor: '#fff' }}>
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

function LayerSelection({ layerSettings, updateLayerSettings }: { layerSettings: LayerSettings; updateLayerSettings: (settings: LayerSettings) => void }) {
  return (
    <OutlinedCard>
      <CardTitle title="Layer Selection" />
      <div>
        <label>Layer Type</label>
        <select
          value={layerSettings.brand}
          onChange={(e) => {
            const selectedLayer = e.target.value as LayerSettings['brand'];
            switch (selectedLayer) {
              case 'heatmap-layer':
                updateLayerSettings({ brand: selectedLayer, opacity: 0.5 });
                break;
              case 'scatterplot-layer':
                updateLayerSettings({ brand: selectedLayer, radius: 100, color: '#49FF20'  });
                break;
              case 'hexagon-layer': // Add Hexagon Layer case
                updateLayerSettings({ brand: selectedLayer, radius: 1000, coverage: 0.8, opacity: 0.8 }); // Set default values including opacity
                break;
              default:
                throw new Error(`Unknown layer type: ${selectedLayer}`);
            }
          }}
        >
          <option value="heatmap-layer">Heatmap Layer</option>
          <option value="scatterplot-layer">Scatterplot Layer</option>
          <option value="hexagon-layer">Hexagon Layer</option> {/* Add Hexagon Layer option */}
        </select>
      </div>
      </OutlinedCard>
  );
}

function LayerSettings({ layerSettings, updateLayerSettings }: { layerSettings: LayerSettings; updateLayerSettings: (settings: LayerSettings) => void }) {

  switch (layerSettings.brand) {
    case 'heatmap-layer':
      return (
        <OutlinedCard>
          <CardTitle title="Heatmap Layer Settings" />
          <div>
            <label>Opacity</label>
            <input
              type="number"
              value={layerSettings.opacity}
              style={{ width: '40%' }}
              min={0}
              max={1}
              step={0.01}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value) || value < 0 || value > 1) {
                  return; // Ignore invalid values
                }
                updateLayerSettings({ ...layerSettings, opacity: value });
              }}
            />
          </div>
        </OutlinedCard>
      );
    case 'scatterplot-layer':
      return (
        <OutlinedCard>
          <CardTitle title="Scatterplot Layer Settings" />
          <div>
            <label>Radius</label>
            <input
              type="number"
              value={layerSettings.radius}
              onChange={(e) => updateLayerSettings({ ...layerSettings, radius: parseFloat(e.target.value) })}
            />
           </div>
           <div>
            <label>Color</label>
            <input
              type="color"
              value={layerSettings.color}
              onChange={(e) => updateLayerSettings({ ...layerSettings, color: e.target.value })}
            /> 
           </div> 
        </OutlinedCard>);
    case 'hexagon-layer': // Add Hexagon Layer settings UI
      return (
        <OutlinedCard>
          <CardTitle title="Hexagon Layer Settings" />
          <div>
            <label>Radius</label>
            <input
              type="number"
              value={layerSettings.radius}
              min={1000}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value) ) return;
                if (value < 1000) {
                  updateLayerSettings({ ...layerSettings, radius: 1000 });
                  return;
                }
                updateLayerSettings({ ...layerSettings, radius: value });
              }}
            />
          </div>
          <div>
            <label>Coverage (0-1)</label>
            <input
              type="number"
              value={layerSettings.coverage}
              min={0}
              max={1}
              step={0.01}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value) || value < 0 || value > 1) return;
                updateLayerSettings({ ...layerSettings, coverage: value });
              }}
            />
          </div>
          <div>
            <label>Opacity (0-1)</label>
            <input
              type="number"
              value={layerSettings.opacity}
              min={0}
              max={1}
              step={0.01}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value) || value < 0 || value > 1) return;
                updateLayerSettings({ ...layerSettings, opacity: value });
              }}
            />
          </div>
          {/* Add other HexagonLayer specific settings here if needed */}
        </OutlinedCard>
      );
  }
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
    visualizationData,
    updateLayerSettings,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    setDateFilterColumn,
    layerSettings,
    errorDateMessage,
    dateFilterColumn,
    minDate,
    maxDate,
  } = useVData();

  return (
    <Container>
      <OutlinedCard>
        <CardTitle title='CSV'></CardTitle>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />
        {csvData.length > 0 && (
          <>
            <div>
              <label> Total: {csvData.length}</label>
            </div>
            <div>
              <label> Displayed: {visualizationData.length}</label>
            </div>
            <CardSubtitle subtitle='Select column'></CardSubtitle>
            <div>
              <label>Latitude</label>
              <select value={latitudeColumn} onChange={(e) => setLatitudeColumn(e.target.value)} disabled={columnNames.length === 0}>
                <option value="">Select a column</option>
                {columnNames.map((columnName) => (
                  <option key={columnName} value={columnName}>{columnName}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Longitude</label>
              <select value={longitudeColumn} onChange={(e) => setLongitudeColumn(e.target.value)} disabled={columnNames.length === 0}>
                <option value="">Select a column</option>
                {columnNames.map((columnName) => (
                  <option key={columnName} value={columnName}>{columnName}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Label</label>
              <select value={labelColumn} onChange={(e) => setLabelColumn(e.target.value)} disabled={columnNames.length === 0}>
                <option value="">Select a column</option>
                {columnNames.map((columnName) => (
                  <option key={columnName} value={columnName}>{columnName}</option>
                ))}
              </select>
            </div>
            {errorLocationMessage && (
              <div style={{ color: 'red' }}>{errorLocationMessage}</div>
            )}
          </>
        )}
      </OutlinedCard>
      {
        csvData.length > 0 && 
          <>
            <LayerSelection
              layerSettings={layerSettings}
              updateLayerSettings={updateLayerSettings}
            ></LayerSelection>
            <LayerSettings
              updateLayerSettings={updateLayerSettings}
              layerSettings={layerSettings}
            ></LayerSettings>
            <DatetimeFilterSetting
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              setDateFilterColumn={setDateFilterColumn}
              errorMessage={errorDateMessage}
              columnNames={columnNames}
              dateFilterColumn={dateFilterColumn}
              minDate={minDate}
              maxDate={maxDate}
            ></DatetimeFilterSetting>
          </>
      }
    </Container>
  );
}

export default DataController;
