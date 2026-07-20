import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ArticlesPage from './pages/ArticlesPage';
import GalleryPage from './pages/GalleryPage';
import BioPage from './pages/BioPage';
import SponsorsPage from './pages/SponsorsPage';
import PackagesPage from './pages/PackagesPage';
import RankingsPage from './pages/RankingsPage';
import './styles/admin.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/articles" replace />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/bio" element={<BioPage />} />
          <Route path="/sponsors" element={<SponsorsPage />} />
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
