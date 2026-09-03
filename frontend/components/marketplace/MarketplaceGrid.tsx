"use client";

import { MarketplacePlugin, MarketplaceGridProps } from "@/types/marketplace";
import MarketplaceCard from "./MarketplaceCard";
import { useAuth } from "@/contexts/authContext/AuthContext";

export default function MarketplaceGrid({
  plugins,
  onInstall,
  installingId,
  installedPluginIds,
}: MarketplaceGridProps) {
  const { user } = useAuth();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plugins.map((plugin) => (
        <MarketplaceCard
          key={plugin.id}
          plugin={plugin}
          onInstall={onInstall}
          isInstalling={installingId === plugin.id}
          isOwner={user ? plugin.user_id === user.id : false}
          isInstalled={installedPluginIds.includes(plugin.id)}
        />
      ))}
    </div>
  );
}
