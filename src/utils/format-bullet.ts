export function toRoman(num: number): string {
  const romans = [
    "I", "II", "III", "IV", "V",
    "VI", "VII", "VIII", "IX", "X"
  ];
  return romans[num - 1] || "X";
}
