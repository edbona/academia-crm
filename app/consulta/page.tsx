'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { excluirAlunoConsulta } from '@/app/alunos/actions'

type Aluno = {
  id: number
  nome: string
  telefone: string | null
  email: string | null
  data_nascimento: string | null
  genero: string | null
  objetivo_geral: string | null
  objetivos_especificos: string[] | null
  ativo: boolean
  data_cadastro: string
}

function calcularIdade(dataNascimento: string | null): number | null {
  if (!dataNascimento) return null
  const hoje = new Date()
  const nasc = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

function TagsObjetivo({ objetivos }: { objetivos: string[] | null }) {
  if (!objetivos || objetivos.length === 0) return <span className="text-gray-400">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {objetivos.map(obj => (
        <span key={obj} className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
          {obj}
        </span>
      ))}
    </div>
  )
}


export default function ConsultaPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [catalogo, setCatalogo] = useState<string[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [objetivoFiltro, setObjetivoFiltro] = useState('')
  const [generoFiltro, setGeneroFiltro] = useState('')
  const [idadeMin, setIdadeMin] = useState('')
  const [idadeMax, setIdadeMax] = useState('')
  const [modo, setModo] = useState<'lista' | 'tabela'>('tabela')

  useEffect(() => {
    Promise.all([
      supabase.from('alunos').select('*').eq('ativo', true).order('nome'),
      supabase.from('objetivos_catalogo').select('nome').order('nome'),
    ]).then(([{ data: alunosData }, { data: catalogoData }]) => {
      setAlunos(alunosData ?? [])
      setCatalogo(catalogoData?.map(d => d.nome) ?? [])
      setCarregando(false)
    })
  }, [])

  const filtrados = useMemo(() => {
    const min = idadeMin !== '' ? Number(idadeMin) : null
    const max = idadeMax !== '' ? Number(idadeMax) : null

    return alunos.filter(aluno => {
      const nomeOk = aluno.nome.toLowerCase().includes(busca.toLowerCase())
      const objOk =
        !objetivoFiltro ||
        (aluno.objetivos_especificos ?? []).includes(objetivoFiltro)
      const generoOk = !generoFiltro || aluno.genero === generoFiltro
      const idade = calcularIdade(aluno.data_nascimento)
      const idadeOk =
        (min === null || (idade !== null && idade >= min)) &&
        (max === null || (idade !== null && idade <= max))
      return nomeOk && objOk && generoOk && idadeOk
    })
  }, [alunos, busca, objetivoFiltro, generoFiltro, idadeMin, idadeMax])

  async function handleExcluir(id: number, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir ${nome}? Esta ação não pode ser desfeita.`)) return
    const resultado = await excluirAlunoConsulta(id)
    if (!resultado.erro) setAlunos(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Consulta de Alunos</h1>
            <p className="text-gray-500 mt-1">
              {carregando ? 'Carregando...' : `${filtrados.length} aluno(s) encontrado(s)`}
            </p>
          </div>
          <Link href="/" className="px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            ← Início
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Buscar por nome</label>
            <input
              type="text"
              placeholder="Digite o nome..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Objetivo Específico</label>
            <select
              value={objetivoFiltro}
              onChange={e => setObjetivoFiltro(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os objetivos</option>
              {catalogo.map(obj => (
                <option key={obj} value={obj}>{obj}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Gênero</label>
            <select
              value={generoFiltro}
              onChange={e => setGeneroFiltro(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Faixa de idade</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={120}
                placeholder="De"
                value={idadeMin}
                onChange={e => setIdadeMin(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400 text-sm shrink-0">até</span>
              <input
                type="number"
                min={0}
                max={120}
                placeholder="Até"
                value={idadeMax}
                onChange={e => setIdadeMax(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mb-4">
          <button onClick={() => setModo('lista')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${modo === 'lista' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            ☰ Lista
          </button>
          <button onClick={() => setModo('tabela')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${modo === 'tabela' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            ⊞ Tabela
          </button>
        </div>

        {carregando ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400">Carregando alunos...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-lg">Nenhum aluno encontrado.</p>
            <p className="text-gray-400 mt-1">Tente ajustar os filtros.</p>
          </div>
        ) : modo === 'tabela' ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Nome</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Gênero</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Telefone</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Objetivos Específicos</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Idade</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Cadastro</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map(aluno => {
                  const idade = calcularIdade(aluno.data_nascimento)
                  return (
                    <tr key={aluno.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <Link href={`/alunos/${aluno.id}`} className="text-blue-600 hover:underline">
                          {aluno.nome}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-600 capitalize">{aluno.genero ?? '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{aluno.telefone ?? '—'}</td>
                      <td className="px-6 py-4">
                        <TagsObjetivo objetivos={aluno.objetivos_especificos} />
                      </td>
                      <td className="px-6 py-4 text-gray-600">{idade !== null ? `${idade} anos` : '—'}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(aluno.data_cadastro).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/alunos/${aluno.id}/editar?from=consulta`} className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                            Editar
                          </Link>
                          <button onClick={() => handleExcluir(aluno.id, aluno.nome)} className="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtrados.map(aluno => {
              const idade = calcularIdade(aluno.data_nascimento)
              return (
                <div key={aluno.id} className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/alunos/${aluno.id}`} className="text-base font-semibold text-blue-600 hover:underline">
                      {aluno.nome}
                    </Link>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                      {aluno.genero && <span className="capitalize">⚧ {aluno.genero}</span>}
                      {aluno.telefone && <span>📱 {aluno.telefone}</span>}
                      {idade !== null && <span>🎂 {idade} anos</span>}
                      <span>📅 {new Date(aluno.data_cadastro).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {aluno.objetivo_geral && (
                      <p className="mt-1 text-sm text-gray-500 italic">{aluno.objetivo_geral}</p>
                    )}
                    <div className="mt-2">
                      <TagsObjetivo objetivos={aluno.objetivos_especificos} />
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/alunos/${aluno.id}/editar?from=consulta`} className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                      Editar
                    </Link>
                    <button onClick={() => handleExcluir(aluno.id, aluno.nome)} className="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
                      Excluir
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
