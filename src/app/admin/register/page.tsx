import Link from 'next/link'
import { RegisterForm } from './register-form'
import { GoogleSignInButton } from '../_components/google-sign-in-button'
import { createSupabaseServer } from '@/infrastructure/supabase/server'

export default async function RegisterPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  const isOAuthUser = !!user
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0]

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FDFBF9] to-[#F5F0EB] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-lg font-bold font-serif text-slate-900">Reservas Chanantes</p>
        </div>
        <div className="rounded-2xl border border-warm-border bg-white p-8 shadow-lg">
          {isOAuthUser ? (
            <>
              {userName && (
                <p className="text-center text-sm text-teal-600 mb-1">
                  Hola, {userName}
                </p>
              )}
              <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Configura tu negocio</h1>
              <p className="text-center text-sm text-slate-500 mb-6">
                Solo un paso más: pon el nombre de tu negocio para crear tu página de reservas
              </p>
              <RegisterForm isOAuthUser />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Crea tu cuenta</h1>
              <p className="text-center text-sm text-slate-500 mb-6">
                Configura tu página de reservas en minutos
              </p>
              <GoogleSignInButton />
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-warm-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-slate-400">o</span>
                </div>
              </div>
              <RegisterForm />
            </>
          )}
        </div>
        {!isOAuthUser && (
          <p className="text-center text-sm text-slate-500">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/admin/login" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
              Iniciar sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
