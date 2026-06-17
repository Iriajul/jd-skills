"use client";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="font-mono text-[10px] uppercase tracking-widest text-[#111111]"
      >
        {label}
      </label>
      <input id={inputId} className="input-np" {...props} />
      {error && (
        <span className="font-mono text-[10px] text-[#CC0000] uppercase tracking-wider">
          {error}
        </span>
      )}
    </div>
  );
}
