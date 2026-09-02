export const governorates = [
  { name: "بغداد", code: "BGD" },
  { name: "الناصرية ذي قار", code: "NAS" },
  { name: "ديالى", code: "DYL" },
  { name: "الكوت واسط", code: "KOT" },
  { name: "كربلاء", code: "KRB" },
  { name: "دهوك", code: "DOH" },
  { name: "بابل الحلة", code: "BBL" },
  { name: "النجف", code: "NJF" },
  { name: "البصرة", code: "BAS" },
  { name: "اربيل", code: "ARB" },
  { name: "كركوك", code: "KRK" },
  { name: "السليمانيه", code: "SMH" },
  { name: "صلاح الدين", code: "SAH" },
  { name: "الانبار", code: "ANB" },
  { name: "السماوة المثنى", code: "SAM" },
  { name: "موصل", code: "MOS" },
  { name: "الديوانية", code: "DWN" },
  { name: "العمارة ميسان", code: "AMA" }
] as const;

export type Governorate = (typeof governorates)[number];
export type GovernorateCode = Governorate["code"];

export function getGovernorateByName(name: string) {
  return governorates.find((governorate) => governorate.name === name);
}

export function getGovernorateByCode(code: string) {
  return governorates.find((governorate) => governorate.code === code);
}

export function isGovernorateCode(code: string): code is GovernorateCode {
  return governorates.some((governorate) => governorate.code === code);
}
