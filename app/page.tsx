import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="mb-10 text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/marca.jpeg"
              alt="Logotipo da academia"
              width={200}
              height={200}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Mais forte a cada treino!</h1>
          <p className="text-gray-500 mt-2">Gerencia seu tempo.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Link
            href="/alunos"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-2xl group-hover:bg-blue-100 transition-colors">
                👥
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Alunos</h2>
                <p className="text-sm text-gray-500">Cadastre e visualize seus alunos</p>
              </div>
              <span className="ml-auto text-gray-300 group-hover:text-blue-400 text-xl transition-colors">→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
