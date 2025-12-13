import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { RoomPage } from './pages/RoomPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="room/:roomId" element={<RoomPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

