import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { Login } from "./pages/Login";
import AcceptInvite from "./pages/AcceptInvite";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/accept-invite"} component={AcceptInvite} />
      <Route path={"/404"} component={NotFound} />
      <Route path={"/admin/:tab"} component={Home} />
      <Route path={"/admin"} component={Home} />
      <Route path={"/merchant/:tab"} component={Home} />
      <Route path={"/merchant"} component={Home} />
      <Route path={"/store/:tab"} component={Home} />
      <Route path={"/store"} component={Home} />
      <Route path={"/:tab"} component={Home} />
      <Route path={"/"} component={Home} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          defaultTheme="light"
          switchable
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

