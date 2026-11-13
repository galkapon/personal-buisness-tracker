import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'
import { useState } from 'react'

interface ResearchSource {
  name: string
  icon: string
  description: string
  url: string
  color: string
}

interface ResearchCategory {
  name: string
  keywords: string[]
  sources: ResearchSource[]
}

const defaultResearchData: ResearchCategory[] = [
  {
    name: 'Machine Learning',
    keywords: ['machine learning', 'deep learning', 'neural networks', 'AI'],
    sources: [
      {
        name: 'Google Scholar',
        icon: '🎓',
        description: 'Academic papers & citations',
        url: 'https://scholar.google.com/scholar?q=machine%20learning',
        color: 'bg-blue-50 border-blue-200',
      },
      {
        name: 'ArXiv',
        icon: '📄',
        description: 'Preprints of research papers',
        url: 'https://arxiv.org/list/cs.LG/recent',
        color: 'bg-red-50 border-red-200',
      },
      {
        name: 'LinkedIn Articles',
        icon: '💼',
        description: 'Industry insights & discussions',
        url: 'https://www.linkedin.com/search/results/content/?keywords=machine%20learning',
        color: 'bg-sky-50 border-sky-200',
      },
      {
        name: 'Medium',
        icon: '✍️',
        description: 'Technical blogs & tutorials',
        url: 'https://medium.com/search?q=machine%20learning',
        color: 'bg-gray-50 border-gray-200',
      },
    ],
  },
  {
    name: 'Web Development',
    keywords: ['web development', 'React', 'TypeScript', 'frontend'],
    sources: [
      {
        name: 'Dev.to',
        icon: '🖥️',
        description: 'Developer community & articles',
        url: 'https://dev.to/search?q=web%20development',
        color: 'bg-purple-50 border-purple-200',
      },
      {
        name: 'Stack Overflow',
        icon: '❓',
        description: 'Q&A for developers',
        url: 'https://stackoverflow.com/search?q=web+development',
        color: 'bg-orange-50 border-orange-200',
      },
      {
        name: 'GitHub Trending',
        icon: '⭐',
        description: 'Popular repositories',
        url: 'https://github.com/trending?spoken_language_code=&since=daily',
        color: 'bg-gray-50 border-gray-200',
      },
      {
        name: 'CSS Tricks',
        icon: '🎨',
        description: 'Frontend design & code',
        url: 'https://css-tricks.com/',
        color: 'bg-pink-50 border-pink-200',
      },
    ],
  },
  {
    name: 'Data Science',
    keywords: ['data science', 'data analysis', 'statistics', 'visualization'],
    sources: [
      {
        name: 'Kaggle',
        icon: '📊',
        description: 'Datasets & competitions',
        url: 'https://www.kaggle.com/datasets',
        color: 'bg-cyan-50 border-cyan-200',
      },
      {
        name: 'Towards Data Science',
        icon: '📈',
        description: 'Data science articles',
        url: 'https://towardsdatascience.com/',
        color: 'bg-green-50 border-green-200',
      },
      {
        name: 'Google Scholar',
        icon: '🎓',
        description: 'Academic research',
        url: 'https://scholar.google.com/scholar?q=data%20science',
        color: 'bg-blue-50 border-blue-200',
      },
      {
        name: 'Papers With Code',
        icon: '💻',
        description: 'Research papers + code',
        url: 'https://paperswithcode.com/search?q=data+science',
        color: 'bg-indigo-50 border-indigo-200',
      },
    ],
  },
]

export function ResearchDashboard() {
  const { signOut } = useAuth()
  const [researchData] = useState<ResearchCategory[]>(defaultResearchData)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-gray-900">Research Hub</h1>
            <nav className="flex gap-6">
              <Link to="/" className="text-gray-700 hover:text-gray-900 font-medium">
                Home
              </Link>
              <Link to="/tracking" className="text-gray-700 hover:text-gray-900 font-medium">
                Tracking
              </Link>
              <Link to="/research" className="text-gray-700 hover:text-gray-900 font-medium text-blue-600">
                Research
              </Link>
            </nav>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Research & Learning Resources
          </h2>
          <p className="text-gray-600">
            Curated links to stay updated on the latest news, research, and trends in your field
          </p>
        </div>

        <div className="space-y-6">
          {researchData.map((category) => (
            <div
              key={category.name}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === category.name ? null : category.name
                  )
                }
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {category.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-2xl">
                  {expandedCategory === category.name ? '−' : '+'}
                </span>
              </button>

              {expandedCategory === category.name && (
                <div className="border-t border-gray-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {category.sources.map((source) => (
                      <a
                        key={source.name}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`border rounded-lg p-4 hover:shadow-md transition ${source.color}`}
                      >
                        <div className="text-3xl mb-2">{source.icon}</div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {source.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {source.description}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            💡 Tip: Customize your research topics
          </h3>
          <p className="text-gray-700">
            You can edit <code className="bg-white px-2 py-1 rounded text-sm">src/pages/ResearchDashboard.tsx</code> to add your own keywords and research sources tailored to your projects.
          </p>
        </div>
      </main>
    </div>
  )
}
