import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import HistoryPage from "./pages/HistoryPage";
import NotFoundPage from "./pages/NotFoundPage";
import ResultPage from "./pages/ResultPage";
import UploadPage from "./pages/UploadPage";

// The styleguide is a development tool and is excluded from production bundles.
const StyleguidePage = import.meta.env.DEV
  ? lazy(() => import("./pages/StyleguidePage"))
  : null;

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<UploadPage />} />
        <Route path="result" element={<ResultPage />} />
        <Route path="result/:id" element={<ResultPage />} />
        <Route path="history" element={<HistoryPage />} />
        {StyleguidePage ? (
          <Route
            path="styleguide"
            element={
              <Suspense fallback={null}>
                <StyleguidePage />
              </Suspense>
            }
          />
        ) : null}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
