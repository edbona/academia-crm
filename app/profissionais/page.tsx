import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import ProfissionaisManager from './ProfissionaisManager'

export default async function ProfissionaisPage() {
  const { data: profissionais, error } = await supabase
    .from('profissionais')
    .select('*')
    .eq('ativo', true)
    .order('criado_em')

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <p className="text-red-600">Erro ao carregar profissionais: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profissionais</h1>
            <p className="text-gray-500 mt-1">Gerencie os profissionais da sua academia</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Início
          </Link>
        </div>

        <ProfissionaisManager profissionaisIniciais={profissionais ?? []} />
      </div>
    </div>
  )
}
