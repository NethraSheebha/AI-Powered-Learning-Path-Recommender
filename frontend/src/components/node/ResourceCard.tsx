import { ExternalLink, Clock, FileText, PlayCircle, BookOpen } from 'lucide-react';
import type { Resource } from '../../types';

// ============================================================
// ResourceCard — displays a single learning resource
// ============================================================

const typeConfig: Record<string, { label: string; icon: React.ElementType; colorClass: string }> = {
  video: { label: 'Video', icon: PlayCircle, colorClass: 'resource-type-video' },
  article: { label: 'Article', icon: FileText, colorClass: 'resource-type-article' },
  documentation: { label: 'Docs', icon: BookOpen, colorClass: 'resource-type-documentation' },
  course: { label: 'Course', icon: BookOpen, colorClass: 'resource-type-course' },
};

interface Props {
  resource: Resource;
}

export default function ResourceCard({ resource }: Props) {
  const config = typeConfig[resource.type] ?? typeConfig['article'];
  const Icon = config.icon;

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-1 mb-1 ${config.colorClass}`}>
            <Icon size={11} />
            <span>{config.label}</span>
          </div>
          <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
            {resource.title}
          </p>
          {resource.duration_minutes && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
              <Clock size={10} />
              <span>{resource.duration_minutes} min</span>
            </div>
          )}
        </div>
        <ExternalLink size={13} className="text-slate-400 flex-shrink-0 mt-0.5 group-hover:text-blue-500 transition-colors" />
      </div>
    </a>
  );
}
