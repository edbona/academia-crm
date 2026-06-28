'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { salvarConfiguracao } from '@/app/agenda/actions'

export default function ConfigurarAgendaPage() {
  const [horaInicio, setHoraInicio] = useState('06:00')
  const [horaFim, setHoraFim] = useState('22:00')
  const [duracao, setDuracao] = useState(60)
  const [vagas, setVagas] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  useEffect(() => {
    supabase
      .from('configuracao_agenda')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setHoraInicio(data.hora_inicio)
          setHoraFim(data.hora_fim)
          setDuracao(data.duracao_minutos)
          setVagas(data.vagas_por_horario)
        }
      })
  }, [])

  function slotCount() {
    const [hi, mi] = horaInicio.split(':').map(Number)
    const [hf, mf] = horaFim.split(':').map(Number)
    const totalMin = hf * 60 + mf - (hi * 60 + mi)
    if (totalMin <= 0 || duracao <= 0) return 0
    return Math.floor(totalMin / duracao)
  }

  async function handleSalvar() {
    setMensagem(null)
    const [hi, mi] = horaInicio.split(':').map(Number)
    const [hf, mf] = horaFim.split(':').map(Number)
    if (hf * 60 + mf <= hi * 60 + mi) {
      setMensagem({ tipo: 'erro', texto: 'O horário de encerramento deve ser após o início.' })
      return
    }
    if (duracao < 15 || duracao > 240) {
      setMensagem({ tipo: 'erro', texto: 'Duração deve ser entre 15 e 240 minutos.' })
      return
    }
    if (vagas < 1 || vagas > 50) {
      setMensagem({ tipo: 'erro', texto: 'Número de vagas deve ser entre 1 e 50.' })
      return
    }
    setSalvando(true)
    const res = await salvarConfiguracao(horaInicio, horaFim, duracao, vagas)
    setSalvando(false)
    if (res.erro) {
      setMensagem({ tipo: 'erro', texto: res.erro })
    } else {
      setMensagem({ tipo: 'sucesso', texto: 'Configurações salvas com sucesso!' })
    }
  }

  const totalSlots = slotCount()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurar Agenda</h1>
            <p className="text-gray-500 mt-1">Definições do expediente semanal</p>
          </div>
          <Link href="/agenda" className="px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            ← Agenda
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">

          {mensagem && (
            <div className={`p-3 rounded-lg text-sm ${mensagem.tipo === 'sucesso' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {mensagem.texto}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início do expediente</label>
              <input
                type="time"
                value={horaInicio}
                onChange={e => setHoraInicio(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Encerramento do expediente</label>
              <input
                type="time"
                value={horaFim}
                onChange={e => setHoraFim(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duração da aula (minutos)</label>
            <input
              type="number"
              min={15}
              max={240}
              step={5}
              value={duracao}
              onChange={e => setDuracao(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Ex.: 60 para aulas de 1 hora, 50 para 50 minutos</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vagas por horário</label>
            <input
              type="number"
              min={1}
              max={50}
              value={vagas}
              onChange={e => setVagas(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Número de alunos simultâneos por horário</p>
          </div>

          {totalSlots > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800">Prévia da configuração</p>
              <p className="text-sm text-blue-700 mt-1">
                {totalSlots} horário(s) por dia · {totalSlots * 6} horários na semana · {totalSlots * 6 * vagas} vagas totais
              </p>
            </div>
          )}

          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="w-full px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {salvando ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </div>
    </div>
  )
}
