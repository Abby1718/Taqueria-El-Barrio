export type UserRole = 'client' | 'admin' | 'employee';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'tacos' | 'bebidas' | 'extras';
  stock?: number;
  minStock?: number;
}

export interface Ticket {
  id: string;
  date: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
  status: 'pending' | 'completed' | 'cancelled' | 'paid';
  paymentMethod?: 'efectivo' | 'transferencia' | 'tarjeta';
  role: UserRole;
}

export type Category = {
  id: 'tacos' | 'bebidas' | 'extras';
  name: string;
  description: string;
  image: string;
};

export const CATEGORIES: Category[] = [
  {
    id: 'tacos',
    name: 'Tacos',
    description: 'Nuestra especialidad: Al Pastor, Carnitas, Cortes y más.',
    image: '',
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    description: 'Aguas frescas, refrescos y cervezas frías.',
    image: '',
  },
  {
    id: 'extras',
    name: 'Extras',
    description: 'Entradas, volcanes y guarniciones.',
    image: '',
  },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Tacos
  {
    id: 't1',
    name: 'Al Pastor',
    description: 'Lomo de cerdo marinado con piña, cilantro y cebolla.',
    price: 18,
    image: '',
    category: 'tacos',
    stock: 30,
    minStock: 50,
  },
  {
    id: 't2',
    name: 'Suadero',
    description: 'Carne de res tierna y jugosa picada finamente.',
    price: 20,
    image: '',
    category: 'tacos',
    stock: 30,
    minStock: 30,
  },
  {
    id: 't3',
    name: 'Bistec',
    description: 'Corte de res asado al carbón con sal de grano.',
    price: 22,
    image: '',
    category: 'tacos',
    stock: 30,
    minStock: 25,
  },
  {
    id: 't4',
    name: 'Longaniza',
    description: 'Longaniza artesanal de la casa bien doradita.',
    price: 20,
    image: '',
    category: 'tacos',
    stock: 30,
    minStock: 20,
  },
  {
    id: 't10',
    name: 'Costilla',
    description: 'Carne de costilla de res sin hueso picada.',
    price: 30,
    image: '',
    category: 'tacos',
    stock: 15,
    minStock: 20, // Low stock example
  },
  // Bebidas
  {
    id: 'b1',
    name: 'Horchata',
    description: 'Agua de arroz tradicional con canela y vainilla.',
    price: 25,
    image: '',
    category: 'bebidas',
    stock: 40,
    minStock: 10,
  },
  {
    id: 'b3',
    name: 'Coca-Cola',
    description: 'Refresco embotellado de 600ml bien helado.',
    price: 30,
    image: '',
    category: 'bebidas',
    stock: 5,
    minStock: 15, // Low stock example
  },
];
