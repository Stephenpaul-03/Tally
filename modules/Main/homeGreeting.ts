/** Follow the device's local hour; keep wording stable within each time period. */
export function homeGreeting(hour: number) {
  if (hour < 4 || hour >= 22) return "Up late";
  if (hour < 6) return "An early start";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
