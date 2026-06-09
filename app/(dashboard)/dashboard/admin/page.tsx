import AdminOperationsDashboard from '@/components/admin/admin-operations-dashboard'
import AdminFinanceDashboard from '@/components/escrow/admin-finance-dashboard'

export default function AdminDashboardPage() {
  return (
    <>
      <AdminOperationsDashboard />
      <AdminFinanceDashboard />
    </>
  )
}
