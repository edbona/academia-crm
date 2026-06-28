import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import TabelaHorarios from './TabelaHorarios'

const CONFIG_PADRAO = {
  hora_inicio: '06:00',
  hora_fim: '22:00',
  duracao_minutos: 60,
  vagas_por_horario: 1,
}

export default async function AgendaPage() {
  const { data: config } = await supabase
    .from('configuracao_agenda')
    .select('hora_inicio, hora_fim, duracao_minutos, vagas_por_horario')
    .eq('id', 1)
    .single()

  const configFinal = config ?? CONFIG_PADRAO

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-10">
        <div className="mb-8 flex items-start justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
            <p className="text-gray-500 mt-1">
              {configFinal.hora_inicio} às {configFinal.hora_fim} · aulas de {configFinal.duracao_minutos} min · {configFinal.vagas_por_horario} vaga(s) por horário
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/agenda/configurar"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              ⚙ Configurar
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Início
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <TabelaHorarios config={configFinal} />
        </div>
      </div>
    </div>
  )
}
