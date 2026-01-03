import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

export interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const AppLayout = ({ children, title, showBackButton, onBack }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showBackButton ? (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {title && <h1 className="text-lg font-semibold">{title}</h1>}
          </div>
        </header>
      ) : (
        <Header title={title} />
      )}
      <main className="flex-1 pb-20 md:pb-6">
        {children}
      </main>
      {!showBackButton && <MobileNav />}
    </div>
  );
};
