'use client'

import { useActionState, useEffect, useState } from 'react'
import { atualizarAluno } from '@/app/alunos/actions'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Aluno = {
  id: number
  nome: string
  telefone: string | null
  email: string | null
  data_nascimento: string | null
  genero: string | null
  objetivo_geral: string | null
  objetivos_especificos: string[] | null
  plano_id: number | null
  cpf: string | null
}

type PlanoOpcao = { id: number; nome: string; valor: number }

type Estado = { tipo: 'erro'; mensagem: string } | { tipo: 'sucesso' } | null

export default function EditarAlunoForm({ aluno, origem }: { aluno: Aluno; origem: 'alunos' | 'consulta' }) {
  const atualizarComId = atualizarAluno.bind(null, aluno.id)
  const [estado, action, pending] = useActionState<Estado, FormData>(atualizarComId, null)

  const [catalogo, setCatalogo] = useState<string[]>([])
  const [extras, setExtras] = useState<string[]>([])
  const [selecionados, setSelecionados] = useState<Set<string>>(
    new Set(aluno.objetivos_especificos ?? [])
  )
  const [inputNovo, setInputNovo] = useState('')
  const [planos, setPlanos] = useState<PlanoOpcao[]>([])
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState(aluno.plano_id?.toString() ?? '')

  useEffect(() => {
    Promise.all([
      supabase.from('objetivos_catalogo').select('nome').order('nome'),
      supabase.from('planos').select('id, nome, valor').eq('ativo', true).order('criado_em'),
    ]).then(([{ data: catalogoData }, { data: planosData }]) => {
      const catalogoNomes = catalogoData?.map(d => d.nome) ?? []
      const existentes = aluno.objetivos_especificos ?? []
      const fora = existentes.filter(o => !catalogoNomes.includes(o))
      setCatalogo(catalogoNomes)
      setExtras(fora)
      setPlanos(planosData ?? [])
    })
  }, [aluno.objetivos_especificos])

  const todosObjetivos = [...catalogo, ...extras]

  function toggle(nome: string) {
    setSelecionados(prev => {
      const s = new Set(prev)
      s.has(nome) ? s.delete(nome) : s.add(nome)
      return s
    })
  }

  function adicionarNovo() {
    const nome = inputNovo.trim()
    if (!nome) return
    const jaExiste = todosObjetivos.some(o => o.toLowerCase() === nome.toLowerCase())
    if (!jaExiste) setExtras(prev => [...prev, nome])
    setSelecionados(prev => new Set([...prev, nome]))
    setInputNovo('')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {estado?.tipo === 'erro' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {estado.mensagem}
        </div>
      )}

      <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="origem" value={origem} />
        <input type="hidden" name="plano_id" value={planoSelecionadoId} />
        {[...selecionados].map(obj => (
          <input type="hidden" name="objetivos_especificos" value={obj} key={obj} />
        ))}

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            name="nome"
            type="text"
            required
            defaultValue={aluno.nome}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
          <select
            name="genero"
            defaultValue={aluno.genero ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione...</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plano de Adesão</label>
          <select
            value={planoSelecionadoId}
            onChange={e => setPlanoSelecionadoId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sem plano</option>
            {planos.map(p => (
              <option key={p.id} value={p.id}>
                {p.nome}{p.valor > 0 ? ` — R$ ${p.valor.toFixed(2).replace('.', ',')}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            name="telefone"
            type="tel"
            defaultValue={aluno.telefone ?? ''}
            placeholder="(11) 99999-9999"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
          <input
            name="cpf"
            type="text"
            defaultValue={aluno.cpf ?? ''}
            placeholder="000.000.000-00"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input
            name="email"
            type="email"
            defaultValue={aluno.email ?? ''}
            placeholder="aluno@email.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento</label>
          <input
            name="data_nascimento"
            type="date"
            defaultValue={aluno.data_nascimento ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo Geral</label>
          <textarea
            name="objetivo_geral"
            rows={3}
            defaultValue={aluno.objetivo_geral ?? ''}
            placeholder="Descreva o objetivo principal do aluno..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Objetivos Específicos
            {selecionados.size > 0 && (
              <span className="ml-2 text-xs font-normal text-blue-600">
                {selecionados.size} selecionado(s)
              </span>
            )}
          </label>

          {todosObjetivos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {todosObjetivos.map(obj => (
                <label
                  key={obj}
                  className="flex items-center gap-2 text-sm cursor-pointer select-none group"
                >
                  <input
                    type="checkbox"
                    checked={selecionados.has(obj)}
                    onChange={() => toggle(obj)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 group-hover:text-gray-900">{obj}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={inputNovo}
              onChange={e => setInputNovo(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  adicionarNovo()
                }
              }}
              placeholder="Novo objetivo específico..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={adicionarNovo}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              + Adicionar
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Digite um objetivo não listado e clique em Adicionar — ele será salvo no catálogo.
          </p>
        </div>

        <div className="sm:col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <Link
            href={origem === 'consulta' ? '/consulta' : '/alunos'}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Voltar
          </Link>
          <Link
            href="/"
            className="px-6 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Início
          </Link>
        </div>
      </form>
    </div>
  )
}
