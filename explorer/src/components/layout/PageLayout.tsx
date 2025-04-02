import { ReactNode } from "react";

interface PageLayoutProps {
    children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow w-full">
                {children}
            </div>
           
        </div>
    );
}
