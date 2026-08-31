import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import TopBar from './components/TopBar';
import GoalIntake from './screens/GoalIntake';
import GraphView from './screens/GraphView';
import Dashboard from './screens/Dashboard';
import './index.css';

function HomeEntry() {
  const [params] = useSearchParams();
  const forceOnboarding = params.get('new') === '1';
  const learnerId = localStorage.getItem('learner_id');
  const graphId = localStorage.getItem('graph_id');

  if (!forceOnboarding && learnerId && graphId) {
    return <Navigate to={`/graph/${graphId}`} replace />;
  }
  return <GoalIntake />;
}

export default function App() {
  return (
    <BrowserRouter>
      <TopBar />
      <Routes>
        <Route path="/" element={<HomeEntry />} />
        <Route path="/graph/:graphId" element={<GraphView />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
