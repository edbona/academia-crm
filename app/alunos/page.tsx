import { supabase } from '@/lib/supabase'
import NovoAlunoForm from './NovoAlunoForm'

type Aluno = {
  id: number
  nome: string
  telefone: string | null
  email: string | null
  data_nascimento: string | null
  genero: string | null
  objetivo: string | null
  data_cadastro: string
}

export default async function AlunosPage() {
  const { data: alunos, error } = await supabase
    .from('alunos')
    .select('*')
    .order('data_cadastro', { ascending: false })

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <p className="text-red-600">Erro ao carregar alunos: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Alunos</h1>
          <p className="text-gray-500 mt-1">Gerencie os alunos da sua academia</p>
        </div>

        {alunos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-lg">Nenhum aluno cadastrado ainda.</p>
            <p className="text-gray-400 mt-1">Use o formulário abaixo para adicionar o primeiro!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Nome</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Gênero</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Telefone</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">E-mail</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Objetivo</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alunos.map((aluno: Aluno) => (
                  <tr key={aluno.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{aluno.nome}</td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{aluno.genero ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{aluno.telefone ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{aluno.email ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{aluno.objetivo ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(aluno.data_cadastro).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <NovoAlunoForm />
      </div>
    </div>
  )
}
