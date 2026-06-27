'use client'

import { useActionState, useEffect, useRef } from 'react'
import { criarAluno } from './actions'

type Estado = { tipo: 'erro'; mensagem: string } | { tipo: 'sucesso' } | null

export default function NovoAlunoForm() {
  const [estado, action, pending] = useActionState<Estado, FormData>(criarAluno, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (estado?.tipo === 'sucesso') {
      formRef.current?.reset()
    }
  }, [estado])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Cadastrar Novo Aluno</h2>

      {estado?.tipo === 'sucesso' && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Aluno cadastrado com sucesso! A lista acima foi atualizada.
        </div>
      )}

      {estado?.tipo === 'erro' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {estado.mensagem}
        </div>
      )}

      <form ref={formRef} action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            name="nome"
            type="text"
            required
            placeholder="Nome completo do aluno"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            name="telefone"
            type="tel"
            placeholder="(11) 99999-9999"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input
            name="email"
            type="email"
            placeholder="aluno@email.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento</label>
          <input
            name="data_nascimento"
            type="date"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
          <select
            name="genero"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione...</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
          <input
            name="objetivo"
            type="text"
            placeholder="ex: perder peso, ganhar massa"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Salvando...' : 'Cadastrar Aluno'}
          </button>
        </div>
      </form>
    </div>
  )
}
