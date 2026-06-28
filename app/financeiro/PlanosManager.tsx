'use client'

import { useState, useTransition } from 'react'
import { criarPlano, atualizarValorPlano, excluirPlano } from './actions'

type Plano = {
  id: number
  nome: string
  valor: number
  ativo: boolean
  criado_em: string
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function PlanosManager({ planosIniciais }: { planosIniciais: Plano[] }) {
  const [planos, setPlanos] = useState(planosIniciais)

  const [nomeNovo, setNomeNovo] = useState('')
  const [valorNovo, setValorNovo] = useState('')
  const [erroCriacao, setErroCriacao] = useState('')
  const [isPendingCreate, startCreate] = useTransition()

  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [valorEdit, setValorEdit] = useState('')
  const [erroEdicao, setErroEdicao] = useState('')
  const [isPendingEdit, startEdit] = useTransition()

  function handleCriar() {
    const nome = nomeNovo.trim()
    if (!nome) { setErroCriacao('O nome do plano é obrigatório.'); return }
    setErroCriacao('')
    const valor = parseFloat(valorNovo.replace(',', '.')) || 0
    startCreate(async () => {
      const resultado = await criarPlano(nome, valor)
      if (resultado.erro) {
        setErroCriacao(resultado.erro)
      } else if (resultado.plano) {
        setPlanos(prev => [...prev, resultado.plano!])
        setNomeNovo('')
        setValorNovo('')
      }
    })
  }

  function iniciarEdicao(plano: Plano) {
    setEditandoId(plano.id)
    setValorEdit(plano.valor.toFixed(2).replace('.', ','))
    setErroEdicao('')
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setValorEdit('')
    setErroEdicao('')
  }

  function handleSalvarValor(id: number) {
    const valor = parseFloat(valorEdit.replace(',', '.'))
    if (isNaN(valor) || valor < 0) { setErroEdicao('Valor inválido.'); return }
    setErroEdicao('')
    startEdit(async () => {
      const resultado = await atualizarValorPlano(id, valor)
      if (resultado.erro) {
        setErroEdicao(resultado.erro)
      } else {
        setPlanos(prev => prev.map(p => p.id === id ? { ...p, valor } : p))
        setEditandoId(null)
        setValorEdit('')
      }
    })
  }

  async function handleExcluir(id: number, nome: string) {
    if (!confirm(`Excluir o plano "${nome}"? Esta ação não pode ser desfeita.`)) return
    const resultado = await excluirPlano(id)
    if (!resultado.erro) setPlanos(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Novo Plano</h2>

        {erroCriacao && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {erroCriacao}
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Plano</label>
            <input
              type="text"
              value={nomeNovo}
              onChange={e => setNomeNovo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCriar()}
              placeholder="Ex: Plano família"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-36">
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              type="text"
              value={valorNovo}
              onChange={e => setValorNovo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCriar()}
              placeholder="0,00"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleCriar}
            disabled={isPendingCreate}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {isPendingCreate ? 'Criando...' : '+ Criar Plano'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Planos Cadastrados</h2>
          <p className="text-sm text-gray-500 mt-0.5">{planos.length} plano(s)</p>
        </div>

        {planos.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">Nenhum plano cadastrado.</p>
            <p className="text-gray-400 text-sm mt-1">Crie o primeiro plano acima.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-600 font-semibold">Plano</th>
                <th className="text-left px-6 py-3 text-gray-600 font-semibold">Valor Mensal</th>
                <th className="text-left px-6 py-3 text-gray-600 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {planos.map(plano => (
                <tr key={plano.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{plano.nome}</td>
                  <td className="px-6 py-4">
                    {editandoId === plano.id ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm font-medium">R$</span>
                          <input
                            type="text"
                            value={valorEdit}
                            onChange={e => setValorEdit(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSalvarValor(plano.id)
                              if (e.key === 'Escape') cancelarEdicao()
                            }}
                            autoFocus
                            className="w-32 rounded-lg border border-blue-400 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {erroEdicao && (
                          <p className="text-red-600 text-xs mt-1">{erroEdicao}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-700 font-semibold">{formatarMoeda(plano.valor)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editandoId === plano.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSalvarValor(plano.id)}
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
                          onClick={() => iniciarEdicao(plano)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Editar valor
                        </button>
                        <button
                          onClick={() => handleExcluir(plano.id, plano.nome)}
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
