'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

type Estado = { tipo: 'erro'; mensagem: string } | { tipo: 'sucesso' } | null

export async function criarAluno(prevState: Estado, formData: FormData): Promise<Estado> {
  const nome = (formData.get('nome') as string)?.trim()

  if (!nome) {
    return { tipo: 'erro', mensagem: 'O nome é obrigatório.' }
  }

  const { error } = await supabase.from('alunos').insert({
    nome,
    telefone: (formData.get('telefone') as string) || null,
    email: (formData.get('email') as string) || null,
    data_nascimento: (formData.get('data_nascimento') as string) || null,
    objetivo: (formData.get('objetivo') as string) || null,
  })

  if (error) {
    return { tipo: 'erro', mensagem: 'Erro ao salvar: ' + error.message }
  }

  revalidatePath('/alunos')
  return { tipo: 'sucesso' }
}
