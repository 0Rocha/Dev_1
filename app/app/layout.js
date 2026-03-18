import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';

config.autoAddCss = false;

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

