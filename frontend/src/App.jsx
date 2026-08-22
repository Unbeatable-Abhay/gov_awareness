import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ComingSoonPage from "./pages/ComingSoonPage";
import HomeSchemeDetailPage from "./pages/HomeSchemeDetailPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/schemes" element={<ComingSoonPage title="Schemes" />} />
      <Route path="/legal" element={<ComingSoonPage title="Legal Advisory" />} />
      <Route path="/directory" element={<ComingSoonPage title="Directory" />} />
        <Route path="/home/scheme/:schemeName" element={<HomeSchemeDetailPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

export default App;