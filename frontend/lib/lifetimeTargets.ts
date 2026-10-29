import { ClusteringRes, GroupData, LevelData } from "@/types/analysis";

// Saved lifetime fits are keyed "<upload>:<measurement>:<channel>:<part>", where part is
// "full", a level's "<start>-<end>" photon range, or a group's "group[<ranges>]".
// The export service parses the same keys (api/services/export_service.py).

export function levelFitKeyPart(level: LevelData): string {
  return `${level.start_index}-${level.end_index}`;
}

// A group is keyed by the photon ranges of its levels rather than its id or grouping step,
// so a fit stays attached to exactly the photons it was made from if grouping is re-run.
export function groupFitKeyPart(levels: LevelData[]): string {
  const ranges = [...levels]
    .sort((a, b) => a.start_index - b.start_index)
    .map(levelFitKeyPart);
  return `group[${ranges.join(",")}]`;
}

export function fitTargetKey(
  uploadId: string,
  measurementId: string,
  channel: number,
  part: string,
): string {
  return `${uploadId}:${measurementId}:${channel}:${part}`;
}

// Groups of the grouping step currently chosen on the Grouping tab
export function selectedGroups(grouping: ClusteringRes | undefined): GroupData[] {
  if (!grouping) return [];
  return grouping.steps?.[grouping.selected_step_index]?.groups ?? [];
}

// The group's levels, or null when the group refers to levels that no longer exist
// (e.g. change-point analysis was re-run after grouping).
export function groupLevels(group: GroupData, levels: LevelData[]): LevelData[] | null {
  const members = group.level_indices.map((index) => levels[index]);
  return members.every(Boolean) ? members : null;
}

export function photonRanges(levels: LevelData[]): [number, number][] {
  return levels.map((level) => [level.start_index, level.end_index]);
}

export function groupPhotonCount(levels: LevelData[]): number {
  return levels.reduce((total, level) => total + level.num_photons, 0);
}

// Key part for whatever the Lifetime tab currently shows
export function selectionFitKeyPart(
  levels: LevelData[],
  groups: GroupData[],
  selectedLevelIdx: number | null,
  selectedGroupIdx: number | null,
): string {
  if (selectedGroupIdx !== null) {
    const group = groups[selectedGroupIdx];
    const members = group ? groupLevels(group, levels) : null;
    if (members) return groupFitKeyPart(members);
  }
  if (selectedLevelIdx !== null && levels[selectedLevelIdx]) {
    return levelFitKeyPart(levels[selectedLevelIdx]);
  }
  return "full";
}
