import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DebugProvider } from "./contexts/DebugContext";
import Home from "./pages/Home";
import DebugEvaluation from "./pages/DebugEvaluation";
import CacheAnalyticsPanel from "./components/CacheAnalyticsPanel";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/debug-eval"} component={DebugEvaluation} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <DebugProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            {process.env.NODE_ENV === 'development' && <CacheAnalyticsPanel />}
          </TooltipProvider>
        </DebugProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
