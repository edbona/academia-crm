'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { excluirAlunoConsulta, atualizarPlanoAluno, atualizarProfissionalAluno } from '@/app/alunos/actions'

type PlanoInfo = {
  id: number
  nome: string
  valor: number
}

type ProfissionalInfo = {
  id: number
  nome: string
}

type AlunoProf = {
  profissional_id: number
  profissionais: ProfissionalInfo
}

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
  plano_id: number | null
  planos: PlanoInfo | null
  aluno_profissionais: AlunoProf[]
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

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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

function TagsProfissional({ profs }: { profs: AlunoProf[] }) {
  if (!profs || profs.length === 0) return <span className="text-gray-400">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {profs.map(ap => (
        <span key={ap.profissional_id} className="inline-block bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
          {ap.profissionais.nome}
        </span>
      ))}
    </div>
  )
}

export default function ConsultaPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [catalogo, setCatalogo] = useState<string[]>([])
  const [catalogoPlanos, setCatalogoPlanos] = useState<PlanoInfo[]>([])
  const [catalogoProfissionais, setCatalogoProfissionais] = useState<ProfissionalInfo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [objetivoFiltro, setObjetivoFiltro] = useState('')
  const [generoFiltro, setGeneroFiltro] = useState('')
  const [profissionalFiltro, setProfissionalFiltro] = useState('')
  const [filtroExclusivo, setFiltroExclusivo] = useState(false)
  const [idadeMin, setIdadeMin] = useState('')
  const [idadeMax, setIdadeMax] = useState('')
  const [modo, setModo] = useState<'lista' | 'tabela'>('tabela')
  const [mostrarValores, setMostrarValores] = useState(true)

  const [editandoPlanoId, setEditandoPlanoId] = useState<number | null>(null)
  const [planoEditSelecionado, setPlanoEditSelecionado] = useState('')
  const [isPendingPlano, startPlano] = useTransition()

  const [editandoProfissionalId, setEditandoProfissionalId] = useState<number | null>(null)
  const [profissionaisEditSelecionados, setProfissionaisEditSelecionados] = useState<Set<number>>(new Set())
  const [isPendingProfissional, startProfissional] = useTransition()

  useEffect(() => {
    Promise.all([
      supabase
        .from('alunos')
        .select('*, planos!plano_id(id, nome, valor), aluno_profissionais(profissional_id, profissionais(id, nome))')
        .eq('ativo', true)
        .order('nome'),
      supabase.from('objetivos_catalogo').select('nome').order('nome'),
      supabase.from('planos').select('id, nome, valor').eq('ativo', true).order('criado_em'),
      supabase.from('profissionais').select('id, nome').eq('ativo', true).order('nome'),
    ]).then(([{ data: alunosData }, { data: catalogoData }, { data: planosData }, { data: profData }]) => {
      setAlunos((alunosData ?? []) as Aluno[])
      setCatalogo(catalogoData?.map(d => d.nome) ?? [])
      setCatalogoPlanos(planosData ?? [])
      setCatalogoProfissionais(profData ?? [])
      setCarregando(false)
    })
  }, [])

  const filtrados = useMemo(() => {
    const min = idadeMin !== '' ? Number(idadeMin) : null
    const max = idadeMax !== '' ? Number(idadeMax) : null

    return alunos.filter(aluno => {
      const nomeOk = aluno.nome.toLowerCase().includes(busca.toLowerCase())
      const objOk = !objetivoFiltro || (aluno.objetivos_especificos ?? []).includes(objetivoFiltro)
      const generoOk = !generoFiltro || aluno.genero === generoFiltro
      const profOk = !profissionalFiltro || (
        filtroExclusivo
          ? aluno.aluno_profissionais.length === 1 && aluno.aluno_profissionais[0].profissional_id === Number(profissionalFiltro)
          : aluno.aluno_profissionais.some(ap => ap.profissional_id === Number(profissionalFiltro))
      )
      const idade = calcularIdade(aluno.data_nascimento)
      const idadeOk =
        (min === null || (idade !== null && idade >= min)) &&
        (max === null || (idade !== null && idade <= max))
      return nomeOk && objOk && generoOk && profOk && idadeOk
    })
  }, [alunos, busca, objetivoFiltro, generoFiltro, profissionalFiltro, filtroExclusivo, idadeMin, idadeMax])

  const totalPlanos = useMemo(
    () => filtrados.reduce((sum, a) => sum + (a.planos?.valor ?? 0), 0),
    [filtrados]
  )

  async function handleExcluir(id: number, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir ${nome}? Esta ação não pode ser desfeita.`)) return
    const resultado = await excluirAlunoConsulta(id)
    if (!resultado.erro) setAlunos(prev => prev.filter(a => a.id !== id))
  }

  function iniciarEdicaoPlano(aluno: Aluno) {
    setEditandoPlanoId(aluno.id)
    setPlanoEditSelecionado(aluno.plano_id?.toString() ?? '')
    setEditandoProfissionalId(null)
  }

  function cancelarEdicaoPlano() {
    setEditandoPlanoId(null)
    setPlanoEditSelecionado('')
  }

  function handleSalvarPlano(alunoId: number) {
    const planoId = planoEditSelecionado ? Number(planoEditSelecionado) : null
    startPlano(async () => {
      const resultado = await atualizarPlanoAluno(alunoId, planoId)
      if (!resultado.erro) {
        const planoInfo = planoId ? (catalogoPlanos.find(p => p.id === planoId) ?? null) : null
        setAlunos(prev => prev.map(a =>
          a.id === alunoId ? { ...a, plano_id: planoId, planos: planoInfo } : a
        ))
        setEditandoPlanoId(null)
        setPlanoEditSelecionado('')
      }
    })
  }

  function iniciarEdicaoProfissional(aluno: Aluno) {
    setEditandoProfissionalId(aluno.id)
    setProfissionaisEditSelecionados(new Set(aluno.aluno_profissionais.map(ap => ap.profissional_id)))
    setEditandoPlanoId(null)
  }

  function cancelarEdicaoProfissional() {
    setEditandoProfissionalId(null)
    setProfissionaisEditSelecionados(new Set())
  }

  function toggleProfissionalEdit(id: number) {
    setProfissionaisEditSelecionados(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function handleSalvarProfissional(alunoId: number) {
    const ids = Array.from(profissionaisEditSelecionados)
    startProfissional(async () => {
      const resultado = await atualizarProfissionalAluno(alunoId, ids)
      if (!resultado.erro) {
        const novosProfs: AlunoProf[] = ids.map(id => {
          const info = catalogoProfissionais.find(p => p.id === id)!
          return { profissional_id: id, profissionais: info }
        })
        setAlunos(prev => prev.map(a =>
          a.id === alunoId ? { ...a, aluno_profissionais: novosProfs } : a
        ))
        setEditandoProfissionalId(null)
        setProfissionaisEditSelecionados(new Set())
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-10">

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

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Profissional</label>
            <select
              value={profissionalFiltro}
              onChange={e => { setProfissionalFiltro(e.target.value); setFiltroExclusivo(false) }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os profissionais</option>
              {catalogoProfissionais.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
            {profissionalFiltro && (
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filtroExclusivo}
                  onChange={e => setFiltroExclusivo(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600">Somente exclusivo</span>
              </label>
            )}
          </div>
        </div>

        {/* Controles de visualização */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => setMostrarValores(v => !v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              mostrarValores
                ? 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                : 'bg-amber-50 border-amber-300 text-amber-700'
            }`}
          >
            {mostrarValores ? '🔒 Ocultar valores' : '👁 Mostrar valores'}
          </button>
          <button onClick={() => setModo('lista')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${modo === 'lista' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            ☰ Lista
          </button>
          <button onClick={() => setModo('tabela')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${modo === 'tabela' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            ⊞ Tabela
          </button>
        </div>

        {/* Conteúdo */}
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">Nome</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">Gênero</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">Telefone</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">Objetivos</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">Profissional(is)</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">Plano</th>
                    {mostrarValores && (
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">Valor</th>
                    )}
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">Idade</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">Cadastro</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtrados.map(aluno => {
                    const idade = calcularIdade(aluno.data_nascimento)
                    return (
                      <tr key={aluno.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          <Link href={`/alunos/${aluno.id}`} className="text-blue-600 hover:underline">
                            {aluno.nome}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{aluno.genero ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{aluno.telefone ?? '—'}</td>
                        <td className="px-4 py-3">
                          <TagsObjetivo objetivos={aluno.objetivos_especificos} />
                        </td>

                        <td className="px-4 py-3">
                          <TagsProfissional profs={aluno.aluno_profissionais} />
                        </td>

                        <td className="px-4 py-3 text-gray-700">
                          {aluno.planos?.nome ?? '—'}
                        </td>

                        {mostrarValores && (
                          <td className="px-4 py-3 font-semibold text-gray-800">
                            {aluno.planos ? formatarMoeda(aluno.planos.valor) : '—'}
                          </td>
                        )}
                        <td className="px-4 py-3 text-gray-600">{idade !== null ? `${idade} anos` : '—'}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(aluno.data_cadastro).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
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
            {mostrarValores && (
              <div className="px-4 py-3 bg-gray-50 border-t-2 border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Total em planos ({filtrados.filter(a => a.planos).length} aluno(s) com plano)
                </span>
                <span className="text-base font-bold text-gray-900">{formatarMoeda(totalPlanos)}</span>
              </div>
            )}
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
                      {aluno.planos && <span>📋 {aluno.planos.nome}</span>}
                      {aluno.telefone && <span>📱 {aluno.telefone}</span>}
                      {idade !== null && <span>🎂 {idade} anos</span>}
                      <span>📅 {new Date(aluno.data_cadastro).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {aluno.aluno_profissionais.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {aluno.aluno_profissionais.map(ap => (
                          <span key={ap.profissional_id} className="inline-block bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">
                            👤 {ap.profissionais.nome}
                          </span>
                        ))}
                      </div>
                    )}
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
