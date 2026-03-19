import DashboardLayout from '@/components/DashboardLayout';

export const metadata = {
  title: 'Admin Dashboard — ExLabour',
};

export default function AdminLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
