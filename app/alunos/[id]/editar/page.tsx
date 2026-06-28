import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import EditarAlunoForm from './EditarAlunoForm'

export default async function EditarAlunoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const { id } = await params
  const { from } = await searchParams

  const { data: aluno, error } = await supabase
    .from('alunos')
    .select('*, aluno_profissionais(profissional_id)')
    .eq('id', id)
    .single()

  if (error || !aluno) {
    notFound()
  }

  const alunoComProfs = {
    ...aluno,
    profissionais_ids: (aluno.aluno_profissionais ?? []).map((ap: { profissional_id: number }) => ap.profissional_id),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Editar Aluno</h1>
          <p className="text-gray-500 mt-1">{aluno.nome}</p>
        </div>
        <EditarAlunoForm aluno={alunoComProfs} origem={from === 'consulta' ? 'consulta' : 'alunos'} />
      </div>
    </div>
  )
}
