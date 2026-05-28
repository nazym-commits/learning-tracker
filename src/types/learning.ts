export type ItemType = 'course' | 'book' | 'video' | 'podcast';

export interface LearningItem {
  id: string;
  title: string;
  author: string;
  type: ItemType;
  progress: number;
  createdAt: number;
}

export type FilterType = 'all' | ItemType;
export type SortOrder = 'progress-asc' | 'progress-desc' | 'newest' | 'oldest';
