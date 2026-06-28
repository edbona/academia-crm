'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function salvarConfiguracao(
  horaInicio: string,
  horaFim: string,
  duracaoMinutos: number,
  vagasPorHorario: number
): Promise<{ erro?: string }> {
  const { error } = await supabase
    .from('configuracao_agenda')
    .upsert({ id: 1, hora_inicio: horaInicio, hora_fim: horaFim, duracao_minutos: duracaoMinutos, vagas_por_horario: vagasPorHorario })
  if (error) return { erro: error.message }
  revalidatePath('/agenda')
  revalidatePath('/agenda/configurar')
  return {}
}

export async function adicionarAluno(
  alunoId: number,
  diaSemana: number,
  horario: string
): Promise<{ erro?: string }> {
  // Verificar se aluno já está nesse slot
  const { data: existente } = await supabase
    .from('agendamentos')
    .select('id')
    .eq('aluno_id', alunoId)
    .eq('dia_semana', diaSemana)
    .eq('horario', horario)
    .maybeSingle()

  if (existente) return { erro: 'Aluno já está nesse horário.' }

  // Verificar limite do plano
  const { data: aluno } = await supabase
    .from('alunos')
    .select('planos!plano_id(sessoes_semana)')
    .eq('id', alunoId)
    .single()

  const sessoesSemana: number = (aluno?.planos as { sessoes_semana: number } | null)?.sessoes_semana ?? 1

  const { count: sessoesAtuais } = await supabase
    .from('agendamentos')
    .select('id', { count: 'exact', head: true })
    .eq('aluno_id', alunoId)
    .eq('bloqueado', false)

  if ((sessoesAtuais ?? 0) >= sessoesSemana) {
    return { erro: `Limite de ${sessoesSemana} sessão(ões)/semana do plano atingido.` }
  }

  // Verificar disponibilidade de vagas
  const { data: config } = await supabase
    .from('configuracao_agenda')
    .select('vagas_por_horario')
    .eq('id', 1)
    .single()

  const { count: ocupados } = await supabase
    .from('agendamentos')
    .select('id', { count: 'exact', head: true })
    .eq('dia_semana', diaSemana)
    .eq('horario', horario)

  if ((ocupados ?? 0) >= (config?.vagas_por_horario ?? 1)) {
    return { erro: 'Não há vagas disponíveis nesse horário.' }
  }

  const { error } = await supabase.from('agendamentos').insert({
    aluno_id: alunoId,
    dia_semana: diaSemana,
    horario,
    bloqueado: false,
  })

  if (error) return { erro: error.message }
  revalidatePath('/agenda')
  return {}
}

export async function removerAgendamento(id: number): Promise<{ erro?: string }> {
  const { error } = await supabase.from('agendamentos').delete().eq('id', id)
  if (error) return { erro: error.message }
  revalidatePath('/agenda')
  return {}
}

export async function bloquearVaga(diaSemana: number, horario: string): Promise<{ erro?: string }> {
  // Verificar disponibilidade
  const { data: config } = await supabase
    .from('configuracao_agenda')
    .select('vagas_por_horario')
    .eq('id', 1)
    .single()

  const { count: ocupados } = await supabase
    .from('agendamentos')
    .select('id', { count: 'exact', head: true })
    .eq('dia_semana', diaSemana)
    .eq('horario', horario)

  if ((ocupados ?? 0) >= (config?.vagas_por_horario ?? 1)) {
    return { erro: 'Sem vagas para bloquear nesse horário.' }
  }

  const { error } = await supabase.from('agendamentos').insert({
    dia_semana: diaSemana,
    horario,
    bloqueado: true,
    aluno_id: null,
  })

  if (error) return { erro: error.message }
  revalidatePath('/agenda')
  return {}
}

export async function moverAgendamento(
  id: number,
  novoDia: number,
  novoHorario: string
): Promise<{ erro?: string }> {
  // Verificar disponibilidade no novo slot
  const { data: ag } = await supabase
    .from('agendamentos')
    .select('aluno_id')
    .eq('id', id)
    .single()

  if (ag?.aluno_id) {
    const { data: existente } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('aluno_id', ag.aluno_id)
      .eq('dia_semana', novoDia)
      .eq('horario', novoHorario)
      .neq('id', id)
      .maybeSingle()

    if (existente) return { erro: 'Aluno já está nesse horário.' }
  }

  const { data: config } = await supabase
    .from('configuracao_agenda')
    .select('vagas_por_horario')
    .eq('id', 1)
    .single()

  const { count: ocupados } = await supabase
    .from('agendamentos')
    .select('id', { count: 'exact', head: true })
    .eq('dia_semana', novoDia)
    .eq('horario', novoHorario)
    .neq('id', id)

  if ((ocupados ?? 0) >= (config?.vagas_por_horario ?? 1)) {
    return { erro: 'Não há vagas disponíveis no horário destino.' }
  }

  const { error } = await supabase
    .from('agendamentos')
    .update({ dia_semana: novoDia, horario: novoHorario })
    .eq('id', id)

  if (error) return { erro: error.message }
  revalidatePath('/agenda')
  return {}
}
