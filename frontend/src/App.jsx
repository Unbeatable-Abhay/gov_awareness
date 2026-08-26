import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import HomeSchemeDetailPage from "./pages/HomeSchemeDetailPage";
import SchemesPage from "./pages/SchemesPage";
import SchemeDetailPage from "./pages/SchemeDetailPage";
import ProfilePage from "./pages/ProfilePage";
import DirectoryPage from "./pages/DirectoryPage";
import LegalPage from "./pages/LegalPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home/scheme/:schemeName" element={<HomeSchemeDetailPage />} />
      <Route path="/schemes" element={<SchemesPage />} />
      <Route path="/schemes/scheme/:schemeName" element={<SchemeDetailPage />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/directory" element={<DirectoryPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

export default App;