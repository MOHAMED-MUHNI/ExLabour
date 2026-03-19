import DashboardLayout from '@/components/DashboardLayout';

export const metadata = {
  title: 'Dashboard — ExLabour',
};

export default function Layout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
