import Link from 'next/link'
import { ServiceForm } from '../service-form'

export default function NewServicePage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/services"
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          &larr; Back to services
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">New service</h1>
      </div>
      <ServiceForm />
    </div>
  )
}
