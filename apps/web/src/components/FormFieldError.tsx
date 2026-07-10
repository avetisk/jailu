export const FormFieldError = ({ error }: { error?: string }) =>
  error && <p className="text-xs text-red-600">{error}</p>
