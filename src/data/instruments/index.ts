export type InstrumentId = "ukulele" | "guitar" | "bass" | "piano";

export interface InstrumentInfo {
  id: InstrumentId;
  label: string;
  icon: string;
}

export const INSTRUMENTS: InstrumentInfo[] = [
  { id: "ukulele", label: "Ukulele", icon: "🎸" },
  { id: "guitar", label: "Guitar", icon: "🎸" },
  { id: "bass", label: "Bass", icon: "🎸" },
  { id: "piano", label: "Piano", icon: "🎹" },
];

export function isInstrumentId(value: string | undefined): value is InstrumentId {
  return !!value && INSTRUMENTS.some((i) => i.id === value);
}
