import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/common/ThemeProvider';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { JsonStudio } from './features/json-studio/JsonStudio';
import { ToolShellPage } from './pages/ToolShellPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="json-studio" element={<JsonStudio />} />
            <Route path="jwt-inspector" element={<ToolShellPage toolId="jwt-inspector" />} />
            <Route path="regex-playground" element={<ToolShellPage toolId="regex-playground" />} />
            <Route path="json-diff" element={<ToolShellPage toolId="json-diff" />} />
            <Route path="encode-decode" element={<ToolShellPage toolId="encode-decode" />} />
            <Route path="recipes" element={<ToolShellPage toolId="recipes" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
