'use client'

import { useActionState } from 'react'
import { atualizarAluno } from '@/app/alunos/actions'
import Link from 'next/link'

type Aluno = {
  id: number
  nome: string
  telefone: string | null
  email: string | null
  data_nascimento: string | null
  genero: string | null
  objetivo: string | null
}

type Estado = { tipo: 'erro'; mensagem: string } | { tipo: 'sucesso' } | null

export default function EditarAlunoForm({ aluno }: { aluno: Aluno }) {
  const atualizarComId = atualizarAluno.bind(null, aluno.id)
  const [estado, action, pending] = useActionState<Estado, FormData>(atualizarComId, null)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {estado?.tipo === 'erro' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {estado.mensagem}
        </div>
      )}

      <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
          <input
            name="objetivo"
            type="text"
            defaultValue={aluno.objetivo ?? ''}
            placeholder="ex: perder peso, ganhar massa"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            href="/alunos"
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
