import Link from 'next/link'
import { ServiceForm } from '../service-form'

export default function NewServicePage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/services"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Back to services
        </Link>
        <h1 className="text-2xl font-bold mt-2">New service</h1>
      </div>
      <ServiceForm />
    </div>
  )
}
