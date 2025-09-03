import { getDebts } from '@/actions/debt'
import DebtTracker from '@/components/debt/DebtTracker'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Debt Tracker - Personal Finance',
  description: 'Track and manage your debts',
}

export default async function DebtTrackerPage() {
  const { userId } = auth()

  if(!userId){

    redirect("/sign-in");
  }

  const debts = await getDebts()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Debt Tracker</h1>
        <p className="text-gray-600">Manage and track your debts and payments</p>
      </div>
      
      <DebtTracker initialDebts={debts} />
    </div>
  )
}