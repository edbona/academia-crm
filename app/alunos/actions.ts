'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
    genero: (formData.get('genero') as string) || null,
    objetivo: (formData.get('objetivo') as string) || null,
  })

  if (error) {
    return { tipo: 'erro', mensagem: 'Erro ao salvar: ' + error.message }
  }

  revalidatePath('/alunos')
  return { tipo: 'sucesso' }
}

export async function atualizarAluno(id: number, prevState: Estado, formData: FormData): Promise<Estado> {
  const nome = (formData.get('nome') as string)?.trim()

  if (!nome) {
    return { tipo: 'erro', mensagem: 'O nome é obrigatório.' }
  }

  const { error } = await supabase
    .from('alunos')
    .update({
      nome,
      telefone: (formData.get('telefone') as string) || null,
      email: (formData.get('email') as string) || null,
      data_nascimento: (formData.get('data_nascimento') as string) || null,
      genero: (formData.get('genero') as string) || null,
      objetivo: (formData.get('objetivo') as string) || null,
    })
    .eq('id', id)

  if (error) {
    return { tipo: 'erro', mensagem: 'Erro ao atualizar: ' + error.message }
  }

  revalidatePath('/alunos')
  redirect('/alunos')
}

export async function alterarStatus(id: number, ativo: boolean, _formData: FormData) {
  const { error } = await supabase
    .from('alunos')
    .update({ ativo: !ativo })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/alunos')
}

export async function excluirAluno(id: number, _formData: FormData) {
  const { error } = await supabase.from('alunos').delete().eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/alunos')
  redirect('/alunos')
}

export async function excluirAlunoConsulta(id: number): Promise<{ erro?: string }> {
  const { error } = await supabase.from('alunos').delete().eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath('/consulta')
  return {}
}
