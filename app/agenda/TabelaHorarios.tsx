'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { adicionarAluno, removerAgendamento, bloquearVaga, moverAgendamento } from './actions'

const DIAS_CURTO = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DIAS_FULL = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

type Config = {
  hora_inicio: string
  hora_fim: string
  duracao_minutos: number
  vagas_por_horario: number
}

type AlunoInfo = {
  id: number
  nome: string
  planos: { sessoes_semana: number } | null
}

type Agendamento = {
  id: number
  dia_semana: number
  horario: string
  aluno_id: number | null
  bloqueado: boolean
  alunos: AlunoInfo | null
}

type Painel =
  | { tipo: 'vaga'; dia: number; horario: string }
  | { tipo: 'entry'; id: number }

function gerarSlots(horaInicio: string, horaFim: string, duracaoMin: number): string[] {
  const slots: string[] = []
  const [hi, mi] = horaInicio.split(':').map(Number)
  const [hf, mf] = horaFim.split(':').map(Number)
  let min = hi * 60 + mi
  const fimMin = hf * 60 + mf
  while (min < fimMin) {
    slots.push(`${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`)
    min += duracaoMin
  }
  return slots
}

async function recarregarDados() {
  const { data } = await supabase
    .from('agendamentos')
    .select('id, dia_semana, horario, aluno_id, bloqueado, alunos(id, nome, planos!plano_id(sessoes_semana))')
    .order('horario')
  return (data ?? []) as Agendamento[]
}

export default function TabelaHorarios({ config }: { config: Config }) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [alunos, setAlunos] = useState<AlunoInfo[]>([])
  const [carregando, setCarregando] = useState(true)

  const [painel, setPainel] = useState<Painel | null>(null)
  const [movendo, setMovendo] = useState(false)
  const [moveDia, setMoveDia] = useState(1)
  const [moveHorario, setMoveHorario] = useState('')
  const [alunoAdd, setAlunoAdd] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erroMsg, setErroMsg] = useState('')

  const slots = useMemo(
    () => gerarSlots(config.hora_inicio, config.hora_fim, config.duracao_minutos),
    [config]
  )

  useEffect(() => {
    Promise.all([
      recarregarDados(),
      supabase.from('alunos').select('id, nome, planos!plano_id(sessoes_semana)').eq('ativo', true).order('nome'),
    ]).then(([ags, { data: alunosData }]) => {
      setAgendamentos(ags)
      setAlunos((alunosData ?? []) as AlunoInfo[])
      setCarregando(false)
    })
  }, [])

  function fecharPainel() {
    setPainel(null)
    setMovendo(false)
    setMoveHorario('')
    setAlunoAdd('')
    setErroMsg('')
  }

  function abrirVaga(dia: number, horario: string) {
    if (painel?.tipo === 'vaga' && painel.dia === dia && painel.horario === horario) {
      fecharPainel()
    } else {
      setPainel({ tipo: 'vaga', dia, horario })
      setMovendo(false)
      setAlunoAdd('')
      setErroMsg('')
    }
  }

  function abrirEntry(id: number) {
    if (painel?.tipo === 'entry' && painel.id === id) {
      fecharPainel()
    } else {
      setPainel({ tipo: 'entry', id })
      setMovendo(false)
      setErroMsg('')
    }
  }

  function sessoesAluno(alunoId: number) {
    return agendamentos.filter(a => a.aluno_id === alunoId && !a.bloqueado).length
  }

  function limitePlano(aluno: AlunoInfo) {
    return (aluno.planos as { sessoes_semana: number } | null)?.sessoes_semana ?? 1
  }

  function alunosDisponiveis(dia: number, horario: string) {
    const jaNoSlot = new Set(
      agendamentos.filter(a => a.dia_semana === dia && a.horario === horario && a.aluno_id).map(a => a.aluno_id)
    )
    return alunos.filter(a => !jaNoSlot.has(a.id) && sessoesAluno(a.id) < limitePlano(a))
  }

  async function handleAdicionar(dia: number, horario: string) {
    if (!alunoAdd) return
    setSalvando(true)
    setErroMsg('')
    const res = await adicionarAluno(Number(alunoAdd), dia, horario)
    if (res.erro) {
      setErroMsg(res.erro)
    } else {
      const dados = await recarregarDados()
      setAgendamentos(dados)
      fecharPainel()
    }
    setSalvando(false)
  }

  async function handleBloquear(dia: number, horario: string) {
    setSalvando(true)
    setErroMsg('')
    const res = await bloquearVaga(dia, horario)
    if (res.erro) {
      setErroMsg(res.erro)
    } else {
      const dados = await recarregarDados()
      setAgendamentos(dados)
      fecharPainel()
    }
    setSalvando(false)
  }

  async function handleRemover(id: number) {
    setSalvando(true)
    const res = await removerAgendamento(id)
    if (!res.erro) {
      setAgendamentos(prev => prev.filter(a => a.id !== id))
      fecharPainel()
    }
    setSalvando(false)
  }

  async function handleMover(id: number) {
    if (!moveHorario) return
    setSalvando(true)
    setErroMsg('')
    const res = await moverAgendamento(id, moveDia, moveHorario)
    if (res.erro) {
      setErroMsg(res.erro)
    } else {
      const dados = await recarregarDados()
      setAgendamentos(dados)
      fecharPainel()
    }
    setSalvando(false)
  }

  if (carregando) {
    return <p className="text-gray-400 text-center py-16">Carregando agenda...</p>
  }

  if (slots.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-400">Nenhum horário configurado.</p>
        <a href="/agenda/configurar" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          Configurar expediente →
        </a>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-gray-100 px-3 py-3 border border-gray-200 text-gray-500 font-semibold text-xs w-20 text-center whitespace-nowrap">
              Horário
            </th>
            {DIAS_CURTO.map((dia, i) => (
              <th key={i} className="px-3 py-3 bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-xs text-center whitespace-nowrap min-w-[160px]">
                {dia}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map(slot => (
            <tr key={slot} className="group">
              <td className="sticky left-0 z-10 bg-gray-50 border border-gray-200 px-3 py-2 text-gray-500 font-mono text-xs text-center whitespace-nowrap">
                {slot}
              </td>
              {[1, 2, 3, 4, 5, 6].map(dia => {
                const celula = agendamentos.filter(a => a.dia_semana === dia && a.horario === slot)
                const estudantes = celula.filter(a => !a.bloqueado && a.aluno_id)
                const bloqueados = celula.filter(a => a.bloqueado)
                const vazios = Math.max(0, config.vagas_por_horario - estudantes.length - bloqueados.length)
                const painelVagaAberto = painel?.tipo === 'vaga' && painel.dia === dia && painel.horario === slot

                return (
                  <td key={dia} className="border border-gray-200 p-1.5 align-top">
                    <div className="flex flex-col gap-1">

                      {/* Alunos agendados */}
                      {estudantes.map(ag => {
                        const entryAberta = painel?.tipo === 'entry' && painel.id === ag.id
                        return (
                          <div key={ag.id}>
                            <button
                              onClick={() => abrirEntry(ag.id)}
                              title={ag.alunos?.nome}
                              className={`w-full text-left text-xs px-2 py-1 rounded-md font-medium truncate transition-colors ${
                                entryAberta
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              }`}
                            >
                              {ag.alunos?.nome ?? '—'}
                            </button>
                            {entryAberta && (
                              <div className="mt-1 p-2 bg-white border border-blue-200 rounded-lg shadow-md">
                                <p className="text-xs font-semibold text-gray-800 mb-2 truncate">{ag.alunos?.nome}</p>
                                {movendo ? (
                                  <div className="flex flex-col gap-1.5">
                                    {erroMsg && <p className="text-xs text-red-600">{erroMsg}</p>}
                                    <select
                                      value={moveDia}
                                      onChange={e => setMoveDia(Number(e.target.value))}
                                      className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                      {DIAS_FULL.map((d, i) => (
                                        <option key={i + 1} value={i + 1}>{d}</option>
                                      ))}
                                    </select>
                                    <select
                                      value={moveHorario}
                                      onChange={e => setMoveHorario(e.target.value)}
                                      className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                      <option value="">Escolher horário...</option>
                                      {slots.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleMover(ag.id)}
                                        disabled={salvando || !moveHorario}
                                        className="flex-1 text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                      >
                                        {salvando ? '...' : 'Confirmar'}
                                      </button>
                                      <button
                                        onClick={() => { setMovendo(false); setMoveHorario(''); setErroMsg('') }}
                                        className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-500 hover:bg-gray-50"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1">
                                    <button
                                      onClick={() => { setMovendo(true); setMoveDia(dia); setMoveHorario(slot) }}
                                      className="w-full text-xs px-2 py-1 rounded border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors"
                                    >
                                      Mover
                                    </button>
                                    <button
                                      onClick={() => handleRemover(ag.id)}
                                      disabled={salvando}
                                      className="w-full text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                                    >
                                      Remover
                                    </button>
                                    <button onClick={fecharPainel} className="w-full text-xs px-2 py-1 rounded border border-gray-200 text-gray-400 hover:bg-gray-50">
                                      Fechar
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Slots bloqueados */}
                      {bloqueados.map(ag => {
                        const entryAberta = painel?.tipo === 'entry' && painel.id === ag.id
                        return (
                          <div key={ag.id}>
                            <button
                              onClick={() => abrirEntry(ag.id)}
                              className={`w-full text-xs px-2 py-1 rounded-md font-bold transition-colors ${
                                entryAberta
                                  ? 'bg-red-600 text-white'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              B
                            </button>
                            {entryAberta && (
                              <div className="mt-1 p-2 bg-white border border-red-200 rounded-lg shadow-md">
                                <p className="text-xs text-gray-500 mb-2">Vaga bloqueada</p>
                                <button
                                  onClick={() => handleRemover(ag.id)}
                                  disabled={salvando}
                                  className="w-full text-xs px-2 py-1 rounded border border-orange-300 text-orange-700 hover:bg-orange-50 disabled:opacity-50 transition-colors"
                                >
                                  Desbloquear
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Vagas disponíveis */}
                      {Array.from({ length: vazios }).map((_, i) => (
                        <button
                          key={`v-${i}`}
                          onClick={() => abrirVaga(dia, slot)}
                          className={`w-full text-xs px-2 py-1 rounded-md font-bold transition-colors border ${
                            painelVagaAberto && i === 0
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          }`}
                        >
                          V
                        </button>
                      ))}

                      {/* Painel de vaga aberto */}
                      {painelVagaAberto && (
                        <div className="mt-1 p-2 bg-white border border-green-200 rounded-lg shadow-md">
                          {erroMsg && <p className="text-xs text-red-600 mb-1">{erroMsg}</p>}
                          <select
                            value={alunoAdd}
                            onChange={e => { setAlunoAdd(e.target.value); setErroMsg('') }}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-xs mb-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Selecionar aluno...</option>
                            {alunosDisponiveis(dia, slot).map(a => {
                              const sessoes = sessoesAluno(a.id)
                              const limite = limitePlano(a)
                              return (
                                <option key={a.id} value={a.id}>
                                  {a.nome} ({sessoes}/{limite}x)
                                </option>
                              )
                            })}
                          </select>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleAdicionar(dia, slot)}
                              disabled={salvando || !alunoAdd}
                              className="flex-1 text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                              {salvando ? '...' : 'Adicionar'}
                            </button>
                            <button
                              onClick={() => handleBloquear(dia, slot)}
                              disabled={salvando}
                              title="Bloquear esta vaga"
                              className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors font-bold"
                            >
                              B
                            </button>
                            <button
                              onClick={fecharPainel}
                              className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-500 hover:bg-gray-50"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legenda */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-200 bg-gray-50">
        <span className="text-xs text-gray-500 font-medium">Legenda:</span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="inline-block w-5 h-5 rounded bg-blue-100 text-blue-800 text-center leading-5 font-medium text-[10px]">A</span>
          Aluno agendado
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="inline-block w-5 h-5 rounded bg-green-50 border border-green-200 text-green-700 text-center leading-5 font-bold text-[10px]">V</span>
          Vaga disponível
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="inline-block w-5 h-5 rounded bg-red-100 text-red-700 text-center leading-5 font-bold text-[10px]">B</span>
          Bloqueado
        </span>
      </div>
    </div>
  )
}
