import './App.css';
import CSVReader from './components/DataController';
import { CSVProvider } from './context/CSVContext';
import { VDataProvider } from './context/VDataContext';
import { useState, useEffect } from 'react';
import { ControllerStatusProvider } from './context/ControllerStatusContext';
import RootMap from './components/Map';

// ルート定義：パス → コンポーネント
const routes = {
  '#': function () {
    return <ControllerStatusProvider>
      <RootMap />
    </ControllerStatusProvider> 
  },
  '#ctrl': function () {

    return  <CSVProvider>
      <VDataProvider>
        <CSVReader />
      </VDataProvider>
      </CSVProvider>
  },
};
type Routes = typeof routes;

function Router({ routes }: { routes: Routes }) {
  const [path, setPath] = useState(
    window.location.hash || '#'
  );

  useEffect(() => {
    const onHashChange = () => {
      setPath(window.location.hash || '#');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const Component = routes[path as keyof Routes] || routes['#'];
  return <Component />;
}

function App() {
  return (
    <Router routes={routes} />
  );
}

export default App;
