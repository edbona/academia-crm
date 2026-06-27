import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import EditarAlunoForm from './EditarAlunoForm'

export default async function EditarAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: aluno, error } = await supabase
    .from('alunos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !aluno) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Editar Aluno</h1>
          <p className="text-gray-500 mt-1">{aluno.nome}</p>
        </div>
        <EditarAlunoForm aluno={aluno} />
      </div>
    </div>
  )
}
