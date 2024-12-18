import { useQuery } from "@tanstack/react-query"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

const OLLAMA_API_BASE = import.meta.env.VITE_OLLAMA_API_BASE_URL || 'http://localhost:11434/api';
const TAGS_ENDPOINT = import.meta.env.VITE_OLLAMA_API_TAGS_ENDPOINT || '/tags';

async function fetchModels() {
  const response = await fetch(`${OLLAMA_API_BASE}${TAGS_ENDPOINT}`)
  if (!response.ok) {
    throw new Error('Failed to fetch models')
  }
  const data = await response.json()
  return data.models || []
}

export default function ModelSelector({ value, onChange }) {
  const { data: models, isLoading, error } = useQuery({
    queryKey: ['models'],
    queryFn: fetchModels,
  })

  if (isLoading) {
    return (
      <Select disabled value={value}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>{value}</SelectValue>
        </SelectTrigger>
      </Select>
    )
  }

  if (error) {
    return (
      <Select disabled value={value}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>{value}</SelectValue>
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue>{value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.name} value={model.name}>
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
