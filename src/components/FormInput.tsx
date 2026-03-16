type FormInputProps = {
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

export default function FormInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}: FormInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-slate-300">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-emerald-500"
      />
    </div>
  )
}