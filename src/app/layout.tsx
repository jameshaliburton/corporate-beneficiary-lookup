import './globals.css'

export const metadata = {
  title: 'OwnedBy - Corporate Ownership Research Tool',
  description: 'Research corporate ownership structures and beneficiary information with AI-powered analysis. Discover who owns what companies and trace ownership chains.',
  keywords: 'corporate ownership, beneficiary research, ownership structure, corporate research, AI analysis, barcode lookup',
  authors: [{ name: 'OwnedBy Team' }],
  creator: 'OwnedBy',
  publisher: 'OwnedBy',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ownedby.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'OwnedBy - Corporate Ownership Research Tool',
    description: 'Research corporate ownership structures and beneficiary information with AI-powered analysis.',
    url: 'https://ownedby.app',
    siteName: 'OwnedBy',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OwnedBy - Corporate Ownership Research Tool',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OwnedBy - Corporate Ownership Research Tool',
    description: 'Research corporate ownership structures and beneficiary information with AI-powered analysis.',
    images: ['/og-image.png'],
    creator: '@ownedby',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>{children}</body>
    </html>
  )
}
