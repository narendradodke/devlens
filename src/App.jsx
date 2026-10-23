import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/common/ThemeProvider';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { JsonStudio } from './features/json-studio/JsonStudio';
import { JwtInspector } from './features/jwt-inspector/JwtInspector';
import { RegexPlayground } from './features/regex-playground/RegexPlayground';
import { JsonDiff } from './features/json-diff/JsonDiff';
import { EncodeDecodeLab } from './features/encode-decode/EncodeDecodeLab';
import { RecipeManager } from './features/recipe-manager/RecipeManager';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="json-studio" element={<JsonStudio />} />
            <Route path="jwt-inspector" element={<JwtInspector />} />
            <Route path="regex-playground" element={<RegexPlayground />} />
            <Route path="json-diff" element={<JsonDiff />} />
            <Route path="encode-decode" element={<EncodeDecodeLab />} />
            <Route path="recipes" element={<RecipeManager />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
