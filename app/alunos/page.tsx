import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import NovoAlunoForm from './NovoAlunoForm'
import BotoesAcao from './BotoesAcao'

type Aluno = {
  id: number
  nome: string
  telefone: string | null
  email: string | null
  data_nascimento: string | null
  genero: string | null
  objetivo: string | null
  ativo: boolean
  data_cadastro: string
}

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const { status } = await searchParams
  const mostrarInativos = status === 'inativos'

  const { data: alunos, error } = await supabase
    .from('alunos')
    .select('*')
    .eq('ativo', !mostrarInativos)
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
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alunos</h1>
            <p className="text-gray-500 mt-1">Gerencie os alunos da sua academia</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Início
          </Link>
        </div>

        {!mostrarInativos && <NovoAlunoForm />}

        <div className="flex gap-2 mt-8 mb-4">
          <Link
            href="/alunos"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !mostrarInativos
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Ativos
          </Link>
          <Link
            href="/alunos?status=inativos"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mostrarInativos
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Inativos
          </Link>
        </div>

        {alunos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-lg">
              {mostrarInativos ? 'Nenhum aluno inativo.' : 'Nenhum aluno cadastrado ainda.'}
            </p>
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
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Ações</th>
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
                    <td className="px-6 py-4">
                      <BotoesAcao id={aluno.id} ativo={aluno.ativo} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
