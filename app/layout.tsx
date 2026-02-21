import type { Metadata } from 'next';
import './globals.css';
import EnterpriseLayout from '@/components/EnterpriseLayout';

export const metadata: Metadata = {
  title: 'Enterprise Leiga — CRM',
  description: 'CRM kerfi fyrir Enterprise bílaleigu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="is">
      <body>
        <EnterpriseLayout>{children}</EnterpriseLayout>
      </body>
    </html>
  );
}
