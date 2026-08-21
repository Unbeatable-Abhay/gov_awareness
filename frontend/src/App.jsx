import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ComingSoonPage from "./pages/ComingSoonPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/schemes" element={<ComingSoonPage title="Schemes" />} />
      <Route path="/legal" element={<ComingSoonPage title="Legal Advisory" />} />
      <Route path="/directory" element={<ComingSoonPage title="Directory" />} />
    </Routes>
  );
}

export default App;