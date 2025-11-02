import React, { useState } from "react";
import { colors, hexToRgba } from "../../utils/colorConfig";

export interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    defaultTab?: string;
    className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, className = "" }) => {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

    return (
        <div className={`w-full ${className}`}>
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium 
                            transition-all duration-300 relative overflow-hidden
                            ${activeTab === tab.id ? "text-white shadow-lg" : "text-gray-400 hover:text-gray-300"}
                        `}
                        style={{
                            background:
                                activeTab === tab.id
                                    ? `linear-gradient(135deg, ${colors.brand.primary} 0%, ${hexToRgba(colors.brand.primary, 0.8)} 100%)`
                                    : `linear-gradient(135deg, ${hexToRgba(colors.ui.bgMedium, 0.6)} 0%, ${hexToRgba(colors.ui.bgMedium, 0.4)} 100%)`,
                            border: `1px solid ${activeTab === tab.id ? hexToRgba(colors.brand.primary, 0.3) : hexToRgba(colors.brand.primary, 0.1)}`
                        }}
                        onMouseEnter={e => {
                            if (activeTab !== tab.id) {
                                e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.2);
                                e.currentTarget.style.background = `linear-gradient(135deg, ${hexToRgba(colors.ui.bgMedium, 0.8)} 0%, ${hexToRgba(
                                    colors.ui.bgMedium,
                                    0.6
                                )} 100%)`;
                            }
                        }}
                        onMouseLeave={e => {
                            if (activeTab !== tab.id) {
                                e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.1);
                                e.currentTarget.style.background = `linear-gradient(135deg, ${hexToRgba(colors.ui.bgMedium, 0.6)} 0%, ${hexToRgba(
                                    colors.ui.bgMedium,
                                    0.4
                                )} 100%)`;
                            }
                        }}
                    >
                        {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                        <span>{tab.label}</span>

                        {/* Active tab indicator */}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 animate-pulse" style={{ backgroundColor: colors.accent.glow }} />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="transition-all duration-300 ease-in-out">{activeTabContent}</div>
        </div>
    );
};

export default Tabs;
