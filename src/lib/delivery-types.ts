export const DELIVERY_TYPE_OPTIONS = [
  { value: "AUTOMATION", label: "Automação" },
  { value: "IPC", label: "IPC" },
  { value: "MEETING", label: "Reunião" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "HOTSEAT", label: "Hotseat" },
  { value: "OTHER", label: "Outro" },
] as const;

export const DELIVERY_TYPE_VALUES = DELIVERY_TYPE_OPTIONS.map((o) => o.value);

export const deliveryTypeConfig: Record<string, string> = Object.fromEntries(
  DELIVERY_TYPE_OPTIONS.map((o) => [o.value, o.label])
);
