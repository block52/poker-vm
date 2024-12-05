import { ReactNode } from "react";

interface PageLayoutProps {
    children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
    return <div className="max-w-6xl mx-auto p-8">{children}</div>;
}
