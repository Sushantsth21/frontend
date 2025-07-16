import './globals.css'

export const metadata = {
  title: 'RE-Assist',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}