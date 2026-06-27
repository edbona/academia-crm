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
  objetivo: string | null
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

const FAIXAS = [
  { label: 'Todas as idades', min: 0, max: 999 },
  { label: '18 – 25 anos', min: 18, max: 25 },
  { label: '26 – 35 anos', min: 26, max: 35 },
  { label: '36 – 45 anos', min: 36, max: 45 },
  { label: '46+ anos', min: 46, max: 999 },
]

export default function ConsultaPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [objetivoFiltro, setObjetivoFiltro] = useState('')
  const [faixaLabel, setFaixaLabel] = useState('Todas as idades')
  const [modo, setModo] = useState<'lista' | 'tabela'>('tabela')

  useEffect(() => {
    supabase
      .from('alunos')
      .select('*')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => {
        setAlunos(data ?? [])
        setCarregando(false)
      })
  }, [])

  const objetivos = useMemo(() => {
    const unicos = [...new Set(alunos.map(a => a.objetivo).filter(Boolean))] as string[]
    return unicos.sort()
  }, [alunos])

  const faixa = FAIXAS.find(f => f.label === faixaLabel) ?? FAIXAS[0]

  const filtrados = useMemo(() => {
    return alunos.filter(aluno => {
      const nomeOk = aluno.nome.toLowerCase().includes(busca.toLowerCase())
      const objOk = !objetivoFiltro || aluno.objetivo === objetivoFiltro
      const idade = calcularIdade(aluno.data_nascimento)
      const idadeOk =
        faixa.min === 0 ||
        (idade !== null && idade >= faixa.min && idade <= faixa.max)
      return nomeOk && objOk && idadeOk
    })
  }, [alunos, busca, objetivoFiltro, faixa])

  async function handleExcluir(id: number, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir ${nome}? Esta ação não pode ser desfeita.`)) return
    const resultado = await excluirAlunoConsulta(id)
    if (!resultado.erro) {
      setAlunos(prev => prev.filter(a => a.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Cabeçalho */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Consulta de Alunos</h1>
            <p className="text-gray-500 mt-1">
              {carregando ? 'Carregando...' : `${filtrados.length} aluno(s) encontrado(s)`}
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Início
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            <label className="block text-xs font-medium text-gray-500 mb-1">Objetivo</label>
            <select
              value={objetivoFiltro}
              onChange={e => setObjetivoFiltro(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os objetivos</option>
              {objetivos.map(obj => (
                <option key={obj} value={obj}>{obj}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Faixa de idade</label>
            <select
              value={faixaLabel}
              onChange={e => setFaixaLabel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FAIXAS.map(f => (
                <option key={f.label} value={f.label}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggle de modo */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => setModo('lista')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              modo === 'lista'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            ☰ Lista
          </button>
          <button
            onClick={() => setModo('tabela')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              modo === 'tabela'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            ⊞ Tabela
          </button>
        </div>

        {/* Resultado */}
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
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Telefone</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Objetivo</th>
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
                      <td className="px-6 py-4 text-gray-600">{aluno.telefone ?? '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{aluno.objetivo ?? '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{idade !== null ? `${idade} anos` : '—'}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(aluno.data_cadastro).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/alunos/${aluno.id}/editar`}
                            className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleExcluir(aluno.id, aluno.nome)}
                            className="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                          >
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
                <div
                  key={aluno.id}
                  className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/alunos/${aluno.id}`}
                      className="text-base font-semibold text-blue-600 hover:underline"
                    >
                      {aluno.nome}
                    </Link>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                      {aluno.telefone && <span>📱 {aluno.telefone}</span>}
                      {aluno.objetivo && <span>🎯 {aluno.objetivo}</span>}
                      {idade !== null && <span>🎂 {idade} anos</span>}
                      <span>📅 {new Date(aluno.data_cadastro).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/alunos/${aluno.id}/editar`}
                      className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleExcluir(aluno.id, aluno.nome)}
                      className="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                    >
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
