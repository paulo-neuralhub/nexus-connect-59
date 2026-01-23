export function formatEur(cents: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format((cents ?? 0) / 100);
}
