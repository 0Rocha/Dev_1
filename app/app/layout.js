export const metadata = {
  title: 'Stack padrão',
  description: 'Next.js + PostgreSQL',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br" style={{ height: '100%' }}>
      <body style={{ margin: 0, minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}

