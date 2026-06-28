import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

function calcularIdade(dataNascimento: string | null): number | null {
  if (!dataNascimento) return null
  const hoje = new Date()
  const nasc = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

function Campo({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm text-gray-900">{valor ?? '—'}</p>
    </div>
  )
}

export default async function PerfilAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: aluno, error } = await supabase
    .from('alunos')
    .select('*, profissionais!profissional_id(id, nome)')
    .eq('id', id)
    .single()

  if (error || !aluno) notFound()

  const idade = calcularIdade(aluno.data_nascimento)
  const objetivos: string[] = aluno.objetivos_especificos ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{aluno.nome}</h1>
            <span
              className={`inline-block mt-2 text-xs font-medium px-2 py-1 rounded-full ${
                aluno.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {aluno.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              href="/consulta"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Voltar
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Início
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Campo label="Nome completo" valor={aluno.nome} />
            <Campo label="Gênero" valor={aluno.genero} />
            <Campo label="CPF" valor={aluno.cpf} />
            <Campo label="Profissional" valor={aluno.profissionais?.nome ?? null} />
            <Campo label="Telefone" valor={aluno.telefone} />
            <Campo label="E-mail" valor={aluno.email} />
            <Campo
              label="Data de nascimento"
              valor={
                aluno.data_nascimento
                  ? `${new Date(aluno.data_nascimento).toLocaleDateString('pt-BR')}${idade !== null ? ` (${idade} anos)` : ''}`
                  : null
              }
            />
            <Campo
              label="Data de cadastro"
              valor={new Date(aluno.data_cadastro).toLocaleDateString('pt-BR')}
            />
          </div>

          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Objetivo Geral
            </p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {aluno.objetivo_geral ?? '—'}
            </p>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Objetivos Específicos
            </p>
            {objetivos.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum objetivo específico cadastrado.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {objetivos.map(obj => (
                  <span
                    key={obj}
                    className="inline-block bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full"
                  >
                    {obj}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <Link
              href={`/alunos/${aluno.id}/editar`}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Editar aluno
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
