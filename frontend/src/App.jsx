import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage     from './pages/DashboardPage';
import VoicePage         from './pages/VoicePage';
import SessionDetailPage from './pages/SessionDetailPage';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="page-content">
          <Routes>
            <Route path="/"            element={<DashboardPage />}     />
            <Route path="/voice"       element={<VoicePage />}         />
            <Route path="/session/:id" element={<SessionDetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
