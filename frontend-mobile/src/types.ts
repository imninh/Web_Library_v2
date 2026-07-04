export type Book = {
  id: number;
  title: string;
  author: string;
  category: string;
  description: string | null;
  image: string | null;
  isbn: string | null;
  publisher: string | null;
  year: number | null;
  total_stock: number;
  stock: number;
  borrow_count: number;
  featured: boolean;
  rating?: number;
  rating_count?: number;
  created_at?: string;
};

export type User = {
  id: number;
  username: string;
  role: "user" | "admin";
  full_name: string | null;
  library_card_id: string | null;
  email: string | null;
  account_status: "active" | "blocked";
  profile_complete: boolean;
  current_borrow_count: number;
  overdue_count: number;
};

export type Comment = {
  id: number;
  book_id: number;
  name: string;
  content: string;
  rating: number;
  created_at: string;
};

export type Loan = {
  id: number;
  book_id: number;
  book_title?: string;
  book_copy_id: number | null;
  user_id: number;
  borrower_name: string;
  library_card_id: string | null;
  status: "pending" | "borrowing" | "returned" | "overdue" | "rejected";
  due_date: string | null;
  created_at: string;
};

export type RootStackParamList = {
  Tabs: undefined;
  Book: { id: number };
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Card: undefined;
  Profile: undefined;
};
