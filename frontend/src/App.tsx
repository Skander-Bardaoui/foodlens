import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import HistoryPage from "./pages/HistoryPage";
import ResultPage from "./pages/ResultPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<UploadPage />} />
        <Route path="result" element={<ResultPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
