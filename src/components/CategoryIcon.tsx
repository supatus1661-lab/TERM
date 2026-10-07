import React from 'react';
import {
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Tv,
  HeartPulse,
  BookOpen,
  Receipt,
  TrendingUp,
  Users,
  MoreHorizontal,
  Briefcase,
  Gift,
  Laptop,
  Store,
  LineChart,
  Sparkles,
  DollarSign,
  Tag,
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Tv,
  HeartPulse,
  BookOpen,
  Receipt,
  TrendingUp,
  Users,
  MoreHorizontal,
  Briefcase,
  Gift,
  Laptop,
  Store,
  LineChart,
  Sparkles,
  DollarSign,
  Tag,
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
};

interface Props {
  iconName: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CategoryIcon: React.FC<Props> = ({ iconName, className = 'w-5 h-5', style }) => {
  const IconComponent = ICON_MAP[iconName] || Tag;
  return <IconComponent className={className} style={style} />;
};
