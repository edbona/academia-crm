'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

type Plano = {
  id: number
  nome: string
  valor: number
  ativo: boolean
  criado_em: string
}

export async function criarPlano(nome: string, valor: number): Promise<{ plano?: Plano; erro?: string }> {
  const { data, error } = await supabase
    .from('planos')
    .insert({ nome, valor })
    .select()
    .single()

  if (error) return { erro: error.message }
  revalidatePath('/financeiro')
  return { plano: data }
}

export async function atualizarValorPlano(id: number, valor: number): Promise<{ erro?: string }> {
  const { error } = await supabase.from('planos').update({ valor }).eq('id', id)
  if (error) return { erro: error.message }
  revalidatePath('/financeiro')
  return {}
}

export async function excluirPlano(id: number): Promise<{ erro?: string }> {
  const { error } = await supabase.from('planos').delete().eq('id', id)
  if (error) return { erro: error.message }
  revalidatePath('/financeiro')
  return {}
}
