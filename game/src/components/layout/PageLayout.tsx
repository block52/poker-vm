import { ReactNode } from "react";

interface PageLayoutProps {
    children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
    return <div className="max-w-8xl mx-auto p-8 min-h-screen flex flex-col">{children}</div>;
}
