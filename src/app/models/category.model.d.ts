export type CategoryType = 'income' | 'expense';

/** Resultado de um SELECT na tabela categories */
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  isFixed: boolean;
  icon: string | null;
  color: string | null;
  /** Auto-relacionamento: ID da categoria pai (subcategoria) */
  parentId: string | null;
}

/** Payload para INSERT na tabela categories */
export interface NewCategory {
  id?: string;
  name: string;
  type: CategoryType;
  isFixed?: boolean;
  icon?: string | null;
  color?: string | null;
  parentId?: string | null;
}

export interface CategoryRule {
  id: string;
  keyword: string;
  categoryId: string;
  priority: number;
  createdByUser: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  categoryName?: string | null;
  categoryType?: CategoryType | null;
}

export interface NewCategoryRule {
  id?: string;
  keyword: string;
  categoryId: string;
  priority?: number;
  createdByUser?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}
