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
            <div className="mt-3 flex gap-3 justify-center flex-wrap items-center">
                {navLinks.map(link => (
                    <a
                        key={link.href}
                        href={link.href}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActive(link.href)
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
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
