import { Route, Routes } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import HistoryPage from "./pages/HistoryPage";
import NotFoundPage from "./pages/NotFoundPage";
import ResultPage from "./pages/ResultPage";
import StyleguidePage from "./pages/StyleguidePage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<UploadPage />} />
        <Route path="result" element={<ResultPage />} />
        <Route path="result/:id" element={<ResultPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="styleguide" element={<StyleguidePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
