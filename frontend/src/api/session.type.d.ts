declare namespace API {
  interface Session {
    created_at: string
    session_id: string
    session_name: string
    updated_at: string
    // user_id: string
  }

  interface ChatItem {
    id: number
    role: import('@/configs').ChatRole
    type: import('@/configs').ChatType
    loading?: boolean
    error?: string
    content?: string
    think?: string

    documents?: Document[]
    reference?: Reference[]
    rag_trace?: RagTraceStep[]
    recommended_questions?: string[]
  }

  interface Document {
    document_id: string
    document_name: string
    content_with_weight: string
  }

  interface Reference {
    id: string
    document_id: string
    document_name: string
    content_with_weight: string
    score?: number
    positions: number[][]
  }

  interface RagTraceMatch {
    rank: number
    score?: number
    document_name: string
    content_preview: string
  }

  interface RagTraceStep {
    id: string
    title: string
    status: 'pending' | 'running' | 'complete' | 'error'
    description: string
    details?: Record<string, unknown>
    matches?: RagTraceMatch[]
  }
}
