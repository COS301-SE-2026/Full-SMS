"use client";

import { MarketplaceCardProps, MarketplacePlugin } from "@/types/marketplace";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Download, Check, Calendar } from "lucide-react";
import { formatDate } from "@/utils/dateTime";
import { Badge } from "@/components/ui/Badge";

export default function MarketplaceCard({
  plugin,
  onInstall,
  isInstalling = false,
  isOwner = false,
  isInstalled = false,
}: Readonly<MarketplaceCardProps>) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex flex-col h-full">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground truncate">
                {plugin.name}
              </h3>
              <span className="text-xs text-foreground/50 bg-card-hover px-2 py-1 rounded">
                v{plugin.version}
              </span>
            </div>

            <p className="text-sm text-foreground/60 mb-4 line-clamp-2">
              {plugin.description || "No description available"}
            </p>

            <div className="flex items-center gap-4 text-xs text-foreground/50 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {plugin.created_at
                    ? formatDate(plugin.created_at)
                    : "Unknown"}
                </span>
              </div>
            </div>
          </div>
          {isOwner ? (
            <Badge variant="secondary" className="w-full justify-center py-2">
              Your Plugin
            </Badge>
          ) : isInstalled ? (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Check className="h-4 w-4" />}
              disabled
              className="w-full mt-auto"
            >
              Installed
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => onInstall(plugin.id)}
              disabled={isInstalling}
              className="w-full mt-auto"
            >
              {isInstalling ? "Installing..." : "Install"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
