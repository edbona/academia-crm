'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type Estado = { tipo: 'erro'; mensagem: string } | { tipo: 'sucesso' } | null

async function salvarNovosObjetivos(objetivos: string[]) {
  if (objetivos.length === 0) return
  await supabase
    .from('objetivos_catalogo')
    .upsert(
      objetivos.map(nome => ({ nome })),
      { onConflict: 'nome', ignoreDuplicates: true }
    )
}

export async function criarAluno(prevState: Estado, formData: FormData): Promise<Estado> {
  const nome = (formData.get('nome') as string)?.trim()

  if (!nome) {
    return { tipo: 'erro', mensagem: 'O nome é obrigatório.' }
  }

  const objetivosEspecificos = formData.getAll('objetivos_especificos') as string[]
  await salvarNovosObjetivos(objetivosEspecificos)

  const planoIdStr = formData.get('plano_id') as string
  const plano_id = planoIdStr ? Number(planoIdStr) : null

  const profIdStr = formData.get('profissional_id') as string
  const profissional_misto = profIdStr === 'misto'
  const profissional_id = !profissional_misto && profIdStr ? Number(profIdStr) : null

  const { error } = await supabase.from('alunos').insert({
    nome,
    telefone: (formData.get('telefone') as string) || null,
    email: (formData.get('email') as string) || null,
    data_nascimento: (formData.get('data_nascimento') as string) || null,
    genero: (formData.get('genero') as string) || null,
    cpf: (formData.get('cpf') as string) || null,
    objetivo_geral: (formData.get('objetivo_geral') as string) || null,
    objetivos_especificos: objetivosEspecificos,
    plano_id,
    profissional_id,
    profissional_misto,
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

  const objetivosEspecificos = formData.getAll('objetivos_especificos') as string[]
  await salvarNovosObjetivos(objetivosEspecificos)

  const planoIdStr = formData.get('plano_id') as string
  const plano_id = planoIdStr ? Number(planoIdStr) : null

  const profIdStr = formData.get('profissional_id') as string
  const profissional_misto = profIdStr === 'misto'
  const profissional_id = !profissional_misto && profIdStr ? Number(profIdStr) : null

  const { error } = await supabase
    .from('alunos')
    .update({
      nome,
      telefone: (formData.get('telefone') as string) || null,
      email: (formData.get('email') as string) || null,
      data_nascimento: (formData.get('data_nascimento') as string) || null,
      genero: (formData.get('genero') as string) || null,
      cpf: (formData.get('cpf') as string) || null,
      objetivo_geral: (formData.get('objetivo_geral') as string) || null,
      objetivos_especificos: objetivosEspecificos,
      plano_id,
      profissional_id,
      profissional_misto,
    })
    .eq('id', id)

  if (error) {
    return { tipo: 'erro', mensagem: 'Erro ao atualizar: ' + error.message }
  }

  const destino = (formData.get('origem') as string) === 'consulta' ? '/consulta' : '/alunos'
  revalidatePath('/alunos')
  revalidatePath('/consulta')
  redirect(destino)
}

export async function atualizarProfissionalAluno(alunoId: number, profissionalId: number | 'misto' | null): Promise<{ erro?: string }> {
  const misto = profissionalId === 'misto'
  const { error } = await supabase
    .from('alunos')
    .update({
      profissional_id: misto ? null : profissionalId,
      profissional_misto: misto,
    })
    .eq('id', alunoId)
  if (error) return { erro: error.message }
  revalidatePath('/consulta')
  revalidatePath('/alunos')
  return {}
}

export async function atualizarPlanoAluno(alunoId: number, planoId: number | null): Promise<{ erro?: string }> {
  const { error } = await supabase
    .from('alunos')
    .update({ plano_id: planoId })
    .eq('id', alunoId)
  if (error) return { erro: error.message }
  revalidatePath('/consulta')
  revalidatePath('/alunos')
  return {}
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
