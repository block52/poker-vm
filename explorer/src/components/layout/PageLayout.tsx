import { ReactNode } from "react";
import { Footer } from "../ui/Footer"

interface PageLayoutProps {
    children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow w-full">
                {children}
            </div>
           \
        </div>
    );
}
