export function UserAvatar({
  initials,
  size = 'md',
}: {
  initials: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-semibold text-zinc-600 dark:text-zinc-300`}
    >
      {initials}
    </div>
  )
}
