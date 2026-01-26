export interface PastoralGroup {
  id: string;
  name: string;
}

export interface PastoralZone {
  id: string;
  name: string;
  groups: PastoralGroup[];
}

export const pastoralZones: PastoralZone[] = [
  {
    id: "zone_lin",
    name: "林牧區",
    groups: [
      { id: "group_joy", name: "喜樂小組" },
      { id: "group_peace", name: "平安小組" },
    ],
  },
  {
    id: "zone_zhang",
    name: "張牧區",
    groups: [{ id: "group_kindness", name: "恩慈小組" }],
  },
  {
    id: "zone_li",
    name: "李牧區",
    groups: [],
  },
  {
    id: "zone_wang",
    name: "王牧區",
    groups: [],
  },
  {
    id: "zone_chen",
    name: "陳牧區",
    groups: [],
  },
];
