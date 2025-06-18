import './globals.css'

export const metadata = {
  title: 'Corporate Beneficiary Lookup',
  description: 'Find the corporate beneficiary for any product barcode.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
