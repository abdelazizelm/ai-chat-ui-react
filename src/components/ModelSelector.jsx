import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

const AVAILABLE_MODELS = [
  "llama2:latest",
  "codellama:latest",
  "mistral:latest",
  "mixtral:latest",
  "neural-chat:latest",
  "starling-lm:latest",
  "phi:latest",
]

export default function ModelSelector({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {AVAILABLE_MODELS.map((model) => (
          <SelectItem key={model} value={model}>
            {model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
