import { Braces, KeyRound, Regex, GitCompare, Binary, BookMarked, Wrench } from 'lucide-react';

const ICON_MAP = {
  Braces,
  KeyRound,
  Regex,
  GitCompare,
  Binary,
  BookMarked,
};

export function ToolIcon({ name, className = 'w-5 h-5', ...props }) {
  const IconComponent = ICON_MAP[name] || Wrench;
  return <IconComponent className={className} aria-hidden="true" {...props} />;
}
