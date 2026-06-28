'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

type Profissional = {
  id: number
  nome: string
  ativo: boolean
  criado_em: string
}

export async function criarProfissional(nome: string): Promise<{ profissional?: Profissional; erro?: string }> {
  const { data, error } = await supabase
    .from('profissionais')
    .insert({ nome })
    .select()
    .single()

  if (error) return { erro: error.message }
  revalidatePath('/profissionais')
  return { profissional: data }
}

export async function renomearProfissional(id: number, nome: string): Promise<{ erro?: string }> {
  const { error } = await supabase.from('profissionais').update({ nome }).eq('id', id)
  if (error) return { erro: error.message }
  revalidatePath('/profissionais')
  return {}
}

export async function excluirProfissional(id: number): Promise<{ erro?: string }> {
  const { error } = await supabase.from('profissionais').delete().eq('id', id)
  if (error) return { erro: error.message }
  revalidatePath('/profissionais')
  return {}
}
