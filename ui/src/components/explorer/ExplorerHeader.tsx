import { useLocation } from "react-router-dom";

interface ExplorerHeaderProps {
    title?: string;
    subtitle?: string;
}

export const ExplorerHeader = ({ title = "Block Explorer", subtitle = "Latest blocks on Pokerchain" }: ExplorerHeaderProps) => {
    const location = useLocation();
    const currentPath = location.pathname;

    const navLinks = [
        { href: "/explorer", label: "Latest Blocks" },
        { href: "/explorer/accounts", label: "All Accounts" },
        { href: "/explorer/address", label: "Address Lookup" },
        { href: "/explorer/distribution", label: "Card Distribution Analytics" },
        { href: "/nodes", label: "Nodes" }
    ];

    const isActive = (href: string) => {
        if (href === "/explorer") {
            return currentPath === "/explorer";
        }
        if (href === "/nodes") {
            // Also highlight for individual node pages
            return currentPath === "/nodes" || currentPath.startsWith("/node/");
        }
        return currentPath.startsWith(href);
    };

    return (
        <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 text-center">{title}</h1>
            <p className="text-gray-400 text-center">{subtitle}</p>
            <div className="mt-3 flex gap-4 justify-center flex-wrap items-center">
                {navLinks.map(link => (
                    <a
                        key={link.href}
                        href={link.href}
                        className={`text-sm transition-colors ${
                            isActive(link.href)
                                ? "text-white font-semibold underline"
                                : "text-blue-400 hover:text-blue-300 hover:underline"
                        }`}
                    >
                        {link.label}
                    </a>
                ))}
            </div>
        </div>
    );
};

export default ExplorerHeader;
