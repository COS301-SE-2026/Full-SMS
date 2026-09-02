"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MarketplacePlugin } from "@/types/marketplace";
import { useAuth } from "@/contexts/authContext/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import MarketplaceGrid from "@/components/marketplace/MarketplaceGrid";
import StatusFilterButton from "@/components/ui/StatusFilterButton";
import { Search, Plus } from "lucide-react";
import { MarketplaceContentProps, FilterOption } from "@/types/marketplace";

export default function MarketplaceContent({
  plugins,
  installedPluginIds,
  installingId,
  onInstall,
}: Readonly<MarketplaceContentProps>) {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  const filteredPlugins = useMemo(() => {
    const result = plugins.filter((plugin) => {
      if (!plugin) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = plugin.name?.toLowerCase().includes(query);
        const matchesDescription = plugin.description
          ?.toLowerCase()
          .includes(query);
        if (!matchesName && !matchesDescription) return false;
      }

      if (filterBy === "installed" && !installedPluginIds.includes(plugin.id)) {
        return false;
      }
      if (filterBy === "not_installed") {
        if (
          installedPluginIds.includes(plugin.id) ||
          plugin.user_id === user?.id
        ) {
          return false;
        }
      }

      return true;
    });

    result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return result;
  }, [plugins, searchQuery, filterBy, installedPluginIds, user?.id]);

  const hasPlugins = plugins.length > 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <input
            type="text"
            placeholder="Search marketplace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-13 pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <StatusFilterButton
            label="All"
            value="all"
            currentFilter={filterBy}
            onClick={setFilterBy}
            count={plugins.length}
          />
          <StatusFilterButton
            label="Installed"
            value="installed"
            currentFilter={filterBy}
            onClick={setFilterBy}
            count={
              plugins.filter((p) => installedPluginIds.includes(p.id)).length
            }
          />
          <StatusFilterButton
            label="Not Installed"
            value="not_installed"
            currentFilter={filterBy}
            onClick={setFilterBy}
            count={
              plugins.filter(
                (p) =>
                  !installedPluginIds.includes(p.id) && p.user_id !== user?.id,
              ).length
            }
          />
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => router.push("/plugins")}
          className="ml-auto"
        >
          Submit New Plugin
        </Button>
      </div>

      <p className="text-sm text-foreground/60 mb-6">
        Showing {filteredPlugins.length} of {plugins.length} plugins
      </p>

      {filteredPlugins.length > 0 ? (
        <MarketplaceGrid
          plugins={filteredPlugins}
          onInstall={onInstall}
          installingId={installingId}
          installedPluginIds={installedPluginIds}
        />
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Search className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
            <p className="text-foreground/60">
              {hasPlugins
                ? "No plugins match your search criteria"
                : "No approved plugins in the marketplace yet"}
            </p>
            <p className="text-sm text-foreground/40 mt-1">
              {hasPlugins
                ? "Try adjusting your filters"
                : "Check back later for new plugins"}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
