export interface Transaction {
  id: number;
  memberId: number;
  date: string;
  time: string;
  member: string;
  phone: string;
  type: string;
  amount: number;
  method: 'MoMo' | 'Cash' | 'Bank';
  status: string;
  month: string;
  paymentDate: string;
}

export interface Member {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  firstFruitNumber?: string;
  updatedAt?: string;
}

export interface PaymentForm {
  memberId: number;
  type: string;
  amount: string;
  method: 'MoMo' | 'Cash' | 'Bank';
  month: string;
  paymentDate: string;
}

export interface Asset {
  id: number;
  name: string;
  category: string;
  purchaseDate: string;
  purchaseValue: number;
  currentValue: number;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  location: string;
  description: string;
  quantity: number;
}

export interface AssetCategory {
  id: number;
  name: string;
  code: string;
}

export interface AdminDashboardProps {
  onNavigate: (screen: string) => void;
}
export interface LoginProps {
  onLogin: (email: string) => void;
}