import "app/App.scss";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Spinner from "shared/ui/Spinner";

const Main = lazy(() => import("features/navigation/pages/Main"));
const ExtensionImport = lazy(() => import("features/youtube/import/ExtensionImport"));
const PlaylistFramePreview = lazy(
  () => import("features/youtube/prototype/PlaylistFramePreview"),
);

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="preview/playlist-frame" element={<PlaylistFramePreview />} />
          <Route
            path="preview/youtube-import"
            element={<Main tools={<ExtensionImport />} />}
          />
          <Route path="*" element={<Main tools={<ExtensionImport />} />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
