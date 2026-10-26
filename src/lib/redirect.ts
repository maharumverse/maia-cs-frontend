// Pembungkus navigasi penuh halaman, dipisah supaya bisa di-mock di test.
export function hardRedirect(url: string): void {
  window.location.replace(url)
}
