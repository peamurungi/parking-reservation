import './globals.css'
export const metadata = { title: 'Parking Slot Reservation' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
