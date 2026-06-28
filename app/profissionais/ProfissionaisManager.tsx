'use client'

import { useState, useTransition } from 'react'
import { criarProfissional, renomearProfissional, excluirProfissional } from './actions'

type Profissional = {
  id: number
  nome: string
  ativo: boolean
  criado_em: string
}

export default function ProfissionaisManager({ profissionaisIniciais }: { profissionaisIniciais: Profissional[] }) {
  const [profissionais, setProfissionais] = useState(profissionaisIniciais)

  const [nomeNovo, setNomeNovo] = useState('')
  const [erroCriacao, setErroCriacao] = useState('')
  const [isPendingCreate, startCreate] = useTransition()

  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nomeEdit, setNomeEdit] = useState('')
  const [erroEdicao, setErroEdicao] = useState('')
  const [isPendingEdit, startEdit] = useTransition()

  function handleCriar() {
    const nome = nomeNovo.trim()
    if (!nome) { setErroCriacao('O nome é obrigatório.'); return }
    setErroCriacao('')
    startCreate(async () => {
      const resultado = await criarProfissional(nome)
      if (resultado.erro) {
        setErroCriacao(resultado.erro)
      } else if (resultado.profissional) {
        setProfissionais(prev => [...prev, resultado.profissional!])
        setNomeNovo('')
      }
    })
  }

  function iniciarEdicao(p: Profissional) {
    setEditandoId(p.id)
    setNomeEdit(p.nome)
    setErroEdicao('')
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setNomeEdit('')
    setErroEdicao('')
  }

  function handleSalvarNome(id: number) {
    const nome = nomeEdit.trim()
    if (!nome) { setErroEdicao('O nome não pode ser vazio.'); return }
    setErroEdicao('')
    startEdit(async () => {
      const resultado = await renomearProfissional(id, nome)
      if (resultado.erro) {
        setErroEdicao(resultado.erro)
      } else {
        setProfissionais(prev => prev.map(p => p.id === id ? { ...p, nome } : p))
        setEditandoId(null)
        setNomeEdit('')
      }
    })
  }

  async function handleExcluir(id: number, nome: string) {
    if (!confirm(`Excluir o profissional "${nome}"? Os alunos vinculados ficarão sem profissional.`)) return
    const resultado = await excluirProfissional(id)
    if (!resultado.erro) setProfissionais(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Novo Profissional</h2>

        {erroCriacao && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {erroCriacao}
          </div>
        )}

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={nomeNovo}
              onChange={e => setNomeNovo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCriar()}
              placeholder="Ex: João Silva"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleCriar}
            disabled={isPendingCreate}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {isPendingCreate ? 'Adicionando...' : '+ Adicionar'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Profissionais Cadastrados</h2>
          <p className="text-sm text-gray-500 mt-0.5">{profissionais.length} profissional(is)</p>
        </div>

        {profissionais.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">Nenhum profissional cadastrado.</p>
            <p className="text-gray-400 text-sm mt-1">Adicione o primeiro profissional acima.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-600 font-semibold">Nome</th>
                <th className="text-left px-6 py-3 text-gray-600 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profissionais.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {editandoId === p.id ? (
                      <div>
                        <input
                          type="text"
                          value={nomeEdit}
                          onChange={e => setNomeEdit(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSalvarNome(p.id)
                            if (e.key === 'Escape') cancelarEdicao()
                          }}
                          autoFocus
                          className="w-full max-w-xs rounded-lg border border-blue-400 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {erroEdicao && <p className="text-red-600 text-xs mt-1">{erroEdicao}</p>}
                      </div>
                    ) : (
                      <span className="font-medium text-gray-900">{p.nome}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editandoId === p.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSalvarNome(p.id)}
                          disabled={isPendingEdit}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {isPendingEdit ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          onClick={cancelarEdicao}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => iniciarEdicao(p)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Renomear
                        </button>
                        <button
                          onClick={() => handleExcluir(p.id, p.nome)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
