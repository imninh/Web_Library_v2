export const colors = {
  bg: "#faf8f2",
  ink: "#1b3a31",
  inkSoft: "#8a978c",
  cream: "#fbfcf5",
  lime: "#cfe021",
  limeDeep: "#b9ce17",
  olive1: "#93a163",
  olive2: "#84924f",
  forest: "#1b3a31",
  coral: "#e0715a",
  teal: "#3f7d70",
  sand: "#d8b45a",
  plum: "#6b5a86",
  line: "rgba(27,58,49,.08)",
  panel: "#fff",
  panelSoft: "#f0ece1",
  danger: "#c64545",
  success: "#3f7d4a",
  successBg: "#e2f0e4",
  warn: "#8a6d1f",
  warnBg: "#f7edcf",
} as const;

export const font = {
  head: "Poppins_700Bold",
  body: "Mulish_400Regular",
} as const;

export const covers: Array<{ bg: string; fg: string; meta: string }> = [
  { bg: "#8c9a5a", fg: "#fbfcf5", meta: "rgba(251,252,245,.8)" },
  { bg: "#1b3a31", fg: "#fbfcf5", meta: "rgba(251,252,245,.7)" },
  { bg: "#e0715a", fg: "#fff7f2", meta: "rgba(255,247,242,.85)" },
  { bg: "#e7e0cf", fg: "#1b3a31", meta: "#6c7a63" },
  { bg: "#3f7d70", fg: "#f2fbf8", meta: "rgba(242,251,248,.82)" },
  { bg: "#d8b45a", fg: "#2a230f", meta: "#5c4e22" },
  { bg: "#6b5a86", fg: "#f7f3fb", meta: "rgba(247,243,251,.82)" },
];

export function coverFor(id: number) {
  return covers[id % covers.length];
}

export const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#8a6d1f", bg: "#f7edcf" },
  borrowing: { label: "Borrowing", color: "#2f6e57", bg: "#d8ecdf" },
  overdue: { label: "Overdue", color: "#b23b3b", bg: "#f6dada" },
  returned: { label: "Returned", color: "#5c6b63", bg: "#e8eae6" },
  rejected: { label: "Rejected", color: "#8a8a8a", bg: "#ececec" },
};
