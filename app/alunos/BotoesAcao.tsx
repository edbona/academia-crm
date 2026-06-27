'use client'

import Link from 'next/link'
import { excluirAluno, alterarStatus } from './actions'

export default function BotoesAcao({ id, ativo }: { id: number; ativo: boolean }) {
  const alterarStatusComId = alterarStatus.bind(null, id, ativo)
  const excluirComId = excluirAluno.bind(null, id)

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/alunos/${id}/editar`}
        className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Editar
      </Link>

      <form action={alterarStatusComId}>
        <button
          type="submit"
          className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
            ativo
              ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
              : 'border-green-300 text-green-700 hover:bg-green-50'
          }`}
        >
          {ativo ? 'Inativar' : 'Ativar'}
        </button>
      </form>

      <form
        action={excluirComId}
        onSubmit={(e) => {
          if (!confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) {
            e.preventDefault()
          }
        }}
      >
        <button
          type="submit"
          className="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
        >
          Excluir
        </button>
      </form>
    </div>
  )
}
