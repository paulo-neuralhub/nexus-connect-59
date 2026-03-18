import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface PageContextType {
  title: string;
  setTitle: (title: string) => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export function PageProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("Dashboard");

  return (
    <PageContext.Provider value={{ title, setTitle }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageTitle(newTitle?: string) {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error("usePageTitle must be used within a PageProvider");
  }

  // Avoid setState during render (causes React warnings / render loops)
  useEffect(() => {
    if (newTitle !== undefined && context.title !== newTitle) {
      context.setTitle(newTitle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTitle]);
  
  return context;
}
