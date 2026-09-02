export function formatIQD(amount: number) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(amount)} د.ع`;
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
