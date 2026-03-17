import React from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "./context/I18nContext";
import { DeckProvider } from "./context/DeckContext";
import { useRouter } from "./hooks/use-router";
import { NavBar } from "./components/NavBar";
import { LandingPage } from "./components/LandingPage";
import { DeckBuilder } from "./components/DeckBuilder";
import "./styles/deck-builder.css";

const App: React.FC = () => {
  const { route, navigate } = useRouter();

  const renderPage = () => {
    if (route.path === "/deck-building" || route.path.startsWith("/deck-building")) {
      const searchParams = new URLSearchParams(window.location.search);
      return (
        <DeckProvider>
          <DeckBuilder searchParams={searchParams} navigate={navigate} />
        </DeckProvider>
      );
    }
    return <LandingPage navigate={navigate} />;
  };

  return (
    <I18nProvider>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <NavBar navigate={navigate} currentPath={route.path} />
        <main style={{ flex: 1, paddingTop: "var(--nav-height)" }}>
          {renderPage()}
        </main>
      </div>
    </I18nProvider>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
