import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ShoppingCart, 
  UtensilsCrossed, 
  Beer, 
  PlusCircle, 
  CheckCircle2, 
  X,
  Trash2,
  ChevronRight,
  PartyPopper,
  Camera,
  Plus,
  Receipt,
  Lock,
  Unlock,
  Users,
  ClipboardList
} from 'lucide-react';
import { CATEGORIES, INITIAL_MENU_ITEMS, type Category, type MenuItem, type UserRole, type Ticket } from './data';

type ClientScreen = 'categories' | 'menu' | 'cart' | 'pedido';
type AdminScreen = 'dashboard' | 'tickets' | 'inventory' | 'products';
type EmployeeScreen = 'orders';

type Screen = ClientScreen | AdminScreen | EmployeeScreen;

interface CartItem extends MenuItem {
  quantity: number;
}

export default function App() {
  const [role, setRole] = useState<UserRole>('client');
  const [currentScreen, setCurrentScreen] = useState<Screen>('categories');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Dynamic menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Employee Password & Section States
  const [isEmployeeAuthenticated, setIsEmployeeAuthenticated] = useState<boolean>(false);
  const [employeeRole, setEmployeeRole] = useState<'carlos' | 'sofia' | 'miguel' | 'all' | null>(null);
  const [employeePasswordInput, setEmployeePasswordInput] = useState<string>('');
  const [pwdError, setPwdError] = useState<string>('');
  const [employeeActiveTab, setEmployeeActiveTab] = useState<'registro' | 'carlos' | 'sofia' | 'miguel'>('registro');
  const [preparedItems, setPreparedItems] = useState<Record<string, boolean>>({});
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState<string>('');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<'all' | 'pending' | 'completed' | 'paid'>('all');
  
  // Admin Password & Authentication States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminPwdError, setAdminPwdError] = useState<string>('');
  
  // New product form state
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<'tacos' | 'bebidas' | 'extras'>('tacos');

  const getItemQuantity = (itemId: string) => quantities[itemId] || 1;

  const updateItemQuantity = (itemId: string, delta: number, maxStock: number = 999) => {
    setQuantities(prev => {
      const current = prev[itemId] || 1;
      const next = Math.max(1, current + delta);
      return {
        ...prev,
        [itemId]: Math.min(next, maxStock)
      };
    });
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const newTicket: Ticket = {
      id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleString(),
      total: totalPrice,
      status: 'pending',
      role: 'client',
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    };

    // Update tickets
    setTickets(prev => [newTicket, ...prev]);

    // Update inventory
    setMenuItems(prev => prev.map(item => {
      const cartItem = cart.find(ci => ci.id === item.id);
      if (cartItem) {
        return {
          ...item,
          stock: Math.max(0, (item.stock || 0) - cartItem.quantity)
        };
      }
      return item;
    }));

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCart([]);
      setCurrentScreen('categories');
    }, 4000);
  };

  const completeOrder = (ticketId: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status: 'completed' } : t
    ));
  };

  const handlePayTicket = (ticketId: string, method: 'efectivo' | 'transferencia' | 'tarjeta') => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status: 'paid', paymentMethod: method } : t
    ));
  };

  const handleAddProduct = () => {
    if (!newProductName || !newProductPrice) return;
    
    const newItem: MenuItem = {
      id: `custom-${Date.now()}`,
      name: newProductName,
      price: parseFloat(newProductPrice),
      description: `Nuevo ${newProductCategory} artesanal del Barrio.`,
      image: '',
      category: newProductCategory
    };
    
    setMenuItems(prev => [...prev, newItem]);
    setShowAddForm(false);
    setNewProductName('');
    setNewProductPrice('');
    setNewProductCategory('tacos');
  };

  const addToCart = (item: MenuItem) => {
    const qtyToAdd = getItemQuantity(item.id);
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + qtyToAdd } : i);
      }
      return [...prev, { ...item, quantity: qtyToAdd }];
    });
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const itemInMenu = menuItems.find(m => m.id === itemId);
        const maxAvailable = itemInMenu?.stock ?? 999;
        const nextQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: Math.min(nextQty, maxAvailable) };
      }
      return i;
    }));
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const navigateToCategory = (category: Category) => {
    setSelectedCategory(category);
    setCurrentScreen('menu');
  };

  const changeRole = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole !== 'employee') {
      setIsEmployeeAuthenticated(false);
      setEmployeeRole(null);
    }
    if (newRole !== 'admin') {
      setIsAdminAuthenticated(false);
      setAdminPasswordInput('');
      setAdminPwdError('');
    }
    if (newRole === 'admin') setCurrentScreen('dashboard');
    else if (newRole === 'employee') setCurrentScreen('orders');
    else setCurrentScreen('categories');
  };

  const handleAdminKeypadPress = (val: string) => {
    setAdminPwdError('');
    if (val === 'DELETE') {
      setAdminPasswordInput(prev => prev.slice(0, -1));
    } else if (val === 'CLEAR') {
      setAdminPasswordInput('');
    } else if (val === 'OK') {
      if (adminPasswordInput === '1986') {
        setIsAdminAuthenticated(true);
        setAdminPasswordInput('');
      } else {
        setAdminPwdError('Contraseña incorrecta. Intente de nuevo.');
        setAdminPasswordInput('');
      }
    } else {
      if (adminPasswordInput.length < 8) {
        setAdminPasswordInput(prev => prev + val);
      }
    }
  };

  const handleKeypadPress = (val: string) => {
    setPwdError('');
    if (val === 'DELETE') {
      setEmployeePasswordInput(prev => prev.slice(0, -1));
    } else if (val === 'CLEAR') {
      setEmployeePasswordInput('');
    } else if (val === 'OK') {
      if (employeePasswordInput === '123') {
        setIsEmployeeAuthenticated(true);
        setEmployeeRole('carlos');
        setEmployeeActiveTab('carlos');
        setEmployeePasswordInput('');
      } else if (employeePasswordInput === '456') {
        setIsEmployeeAuthenticated(true);
        setEmployeeRole('sofia');
        setEmployeeActiveTab('sofia');
        setEmployeePasswordInput('');
      } else if (employeePasswordInput === '789') {
        setIsEmployeeAuthenticated(true);
        setEmployeeRole('miguel');
        setEmployeeActiveTab('miguel');
        setEmployeePasswordInput('');
      } else if (employeePasswordInput === '1234' || employeePasswordInput === 'barrio') {
        setIsEmployeeAuthenticated(true);
        setEmployeeRole('all');
        setEmployeeActiveTab('registro');
        setEmployeePasswordInput('');
      } else {
        setPwdError('Contraseña incorrecta. Intente de nuevo.');
        setEmployeePasswordInput('');
      }
    } else {
      if (employeePasswordInput.length < 8) {
        setEmployeePasswordInput(prev => prev + val);
      }
    }
  };

  const togglePreparedItem = (ticketId: string, itemName: string) => {
    setPreparedItems(prev => ({
      ...prev,
      [`${ticketId}-${itemName}`]: !prev[`${ticketId}-${itemName}`]
    }));
  };

  const handleUpdateStock = (itemId: string, delta: number) => {
    setMenuItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          stock: Math.max(0, (item.stock ?? 0) + delta)
        };
      }
      return item;
    }));
  };

  const AdminInventory = () => (
    <div className="p-6 space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Inventario</h2>
        <p className="category-label text-brand-text/60 italic">Reporte de stock actual y reabastecimiento</p>
      </div>

      <div className="grid gap-4">
        {menuItems.map(item => {
          const isLow = (item.stock || 0) <= (item.minStock || 0);
          return (
            <div key={item.id} className={`bento-card p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-2 ${isLow ? 'border-red-500 bg-red-50/50' : 'border-transparent'}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black uppercase text-lg leading-none">{item.name}</h4>
                  {isLow ? (
                    <span className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">¡Falta!</span>
                  ) : (
                    <span className="bg-green-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Ok</span>
                  )}
                </div>
                <p className="text-xs opacity-60 mt-1">Stock Mínimo Necesario: <span className="font-mono font-bold">{item.minStock ?? 0}</span></p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-black uppercase tracking-wider opacity-50">Stock Actual:</span>
                  <span className={`font-mono text-sm font-black px-2 py-0.5 rounded border-2 border-brand-text ${isLow ? 'bg-red-100 text-red-700' : 'bg-brand-bg text-brand-text'}`}>
                    {item.stock ?? 0}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t border-brand-text/5 md:border-none">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-60 w-full md:w-auto md:mr-1">Reabastecer:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUpdateStock(item.id, -10)}
                    disabled={(item.stock ?? 0) < 10}
                    className="px-2 py-1 bg-brand-bg hover:bg-brand-text hover:text-white disabled:opacity-30 disabled:hover:bg-brand-bg disabled:hover:text-brand-text border-2 border-brand-text rounded-lg font-black text-xs transition-all active:translate-y-0.5"
                    title="Quitar 10"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => handleUpdateStock(item.id, -1)}
                    disabled={(item.stock ?? 0) < 1}
                    className="px-2 py-1 bg-brand-bg hover:bg-brand-text hover:text-white disabled:opacity-30 disabled:hover:bg-brand-bg disabled:hover:text-brand-text border-2 border-brand-text rounded-lg font-black text-xs transition-all active:translate-y-0.5"
                    title="Quitar 1"
                  >
                    -1
                  </button>
                  
                  <div className="h-6 w-0.5 bg-brand-text/10 mx-1" />

                  <button
                    onClick={() => handleUpdateStock(item.id, 1)}
                    className="px-2 py-1 bg-brand-bg hover:bg-brand-text hover:text-white border-2 border-brand-text rounded-lg font-black text-xs transition-all active:translate-y-0.5"
                    title="Sumar 1"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleUpdateStock(item.id, 10)}
                    className="px-2 py-1 bg-brand-bg hover:bg-brand-text hover:text-white border-2 border-brand-text rounded-lg font-black text-xs transition-all active:translate-y-0.5"
                    title="Sumar 10"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => handleUpdateStock(item.id, 50)}
                    className="px-2 py-1 bg-brand-bg hover:bg-brand-text hover:text-white border-2 border-brand-text rounded-lg font-black text-xs transition-all active:translate-y-0.5"
                    title="Sumar 50"
                  >
                    +50
                  </button>
                </div>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const amount = parseInt(formData.get('customAmount') as string, 10);
                    if (!isNaN(amount) && amount > 0) {
                      handleUpdateStock(item.id, amount);
                      e.currentTarget.reset();
                    }
                  }}
                  className="flex items-center gap-1 ml-auto md:ml-2"
                >
                  <input
                    type="number"
                    name="customAmount"
                    min="1"
                    placeholder="Cant."
                    className="w-16 px-2 py-1 text-xs border-2 border-brand-text rounded-lg text-center font-mono focus:outline-none focus:border-brand-accent placeholder:opacity-40"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-brand-accent hover:bg-brand-text text-white border-2 border-brand-text rounded-lg font-black text-[10px] uppercase transition-all"
                  >
                    Sumar
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const AdminTickets = () => (
    <div className="p-6 space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Tickets</h2>
        <p className="category-label text-brand-text/60 italic">Últimas transacciones</p>
      </div>

      <div className="space-y-4">
        {tickets.map(ticket => (
          <div key={ticket.id} className="bento-card p-5 bg-white space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold opacity-40">{ticket.date}</span>
                <h4 className="font-black text-xl uppercase leading-none">{ticket.id}</h4>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border-2 ${
                ticket.status === 'paid' 
                  ? 'bg-blue-50 text-blue-800 border-blue-600' 
                  : ticket.status === 'completed' 
                    ? 'bg-green-50 text-green-800 border-green-600' 
                    : 'bg-yellow-50 text-yellow-800 border-yellow-500'
              }`}>
                {ticket.status === 'paid' 
                  ? `Pagado (${ticket.paymentMethod === 'efectivo' ? '💵 Efectivo' : ticket.paymentMethod === 'transferencia' ? '📱 Transfer' : '💳 Tarjeta'})` 
                  : ticket.status === 'completed' 
                    ? 'Listo para pagar 🧾' 
                    : 'En cocina 👨‍🍳'}
              </span>
            </div>
            <div className="space-y-1">
              {ticket.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t flex justify-between items-center">
              <span className="text-sm font-black uppercase opacity-40">Total</span>
              <span className="text-xl font-mono font-black text-brand-accent">${ticket.total.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AdminProducts = () => (
    <div className="p-6 space-y-8">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Productos</h2>
          <p className="category-label text-brand-text/60 italic">Gestión de catálogo</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-brand-accent text-white p-3 rounded-xl border-2 border-brand-text shadow-[3px_3px_0px_#075985] hover:bg-brand-text transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {menuItems.map(item => (
          <div key={item.id} className="bento-card p-4 bg-white flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-bg/20 rounded-lg flex items-center justify-center">
              {item.category === 'tacos' ? <Plus className="w-5 h-5 opacity-30" /> : <Plus className="w-5 h-5 opacity-30" />}
            </div>
            <div className="flex-1">
              <h4 className="font-black uppercase text-sm">{item.name}</h4>
              <p className="text-[10px] opacity-40 uppercase font-bold tracking-wider">{item.category}</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-black text-brand-price">${item.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const RoleSwitcher = () => (
    <div className="fixed top-20 right-6 z-[60] flex flex-col gap-2 scale-75 origin-top-right">
      {[
        { id: 'client', label: 'Cliente' },
        { id: 'admin', label: 'Administrador' },
        { id: 'employee', label: 'Empleado' }
      ].map((r) => (
        <button
          key={r.id}
          onClick={() => changeRole(r.id as UserRole)}
          className={`px-4 py-2 rounded-full border-2 border-brand-text font-black uppercase text-[10px] transition-all ${
            role === r.id ? 'bg-brand-text text-white' : 'bg-white text-brand-text opacity-50'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  const AdminNav = () => (
    <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t-4 border-brand-text z-50 flex p-4 justify-around md:relative md:border-t-0 md:bg-transparent">
      <button 
        onClick={() => setCurrentScreen('dashboard')}
        className={`flex flex-col items-center gap-1 ${currentScreen === 'dashboard' ? 'text-brand-accent' : 'opacity-40'}`}
      >
        <CheckCircle2 className="w-6 h-6" />
        <span className="text-[10px] font-black uppercase">Panel</span>
      </button>
      <button 
        onClick={() => setCurrentScreen('tickets')}
        className={`flex flex-col items-center gap-1 ${currentScreen === 'tickets' ? 'text-brand-accent' : 'opacity-40'}`}
      >
        <ShoppingCart className="w-6 h-6" />
        <span className="text-[10px] font-black uppercase">Tickets</span>
      </button>
      <button 
        onClick={() => setCurrentScreen('inventory')}
        className={`flex flex-col items-center gap-1 ${currentScreen === 'inventory' ? 'text-brand-accent' : 'opacity-40'}`}
      >
        <Beer className="w-6 h-6" />
        <span className="text-[10px] font-black uppercase">Inventario</span>
      </button>
      <button 
        onClick={() => setCurrentScreen('products')}
        className={`flex flex-col items-center gap-1 ${currentScreen === 'products' ? 'text-brand-accent' : 'opacity-40'}`}
      >
        <Plus className="w-6 h-6" />
        <span className="text-[10px] font-black uppercase">Productos</span>
      </button>
    </div>
  );

  const ClientNav = () => {
    const completedTickets = tickets.filter(t => t.status === 'completed');
    
    return (
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t-4 border-brand-text z-50 flex p-4 justify-around md:relative md:border-t-0 md:bg-transparent">
        <button 
          onClick={() => setCurrentScreen('categories')}
          className={`flex flex-col items-center gap-1 ${currentScreen === 'categories' || currentScreen === 'menu' ? 'text-brand-accent font-black' : 'opacity-40'}`}
        >
          <UtensilsCrossed className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase">Menú</span>
        </button>
        <button 
          onClick={() => setCurrentScreen('cart')}
          className={`flex flex-col items-center gap-1 relative ${currentScreen === 'cart' ? 'text-brand-accent font-black' : 'opacity-40'}`}
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase">Carrito</span>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-2 bg-brand-text text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
              {totalItems}
            </span>
          )}
        </button>
        <button 
          onClick={() => setCurrentScreen('pedido')}
          className={`flex flex-col items-center gap-1 relative ${currentScreen === 'pedido' ? 'text-brand-accent font-black' : 'opacity-40'}`}
        >
          <Receipt className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase">Pedido</span>
          {tickets.length > 0 && (
            <span className={`absolute -top-1 -right-2 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-black border border-white ${
              completedTickets.length > 0 ? 'bg-green-600 text-white animate-pulse' : 'bg-yellow-500 text-white'
            }`}>
              {tickets.length}
            </span>
          )}
        </button>
      </div>
    );
  };

  const ClientPedido = () => {
    return (
      <div className="p-6 md:p-10 space-y-8 pb-32">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Mis Pedidos</h2>
          <p className="category-label text-brand-text/60 italic">Consulta el estado de tu ticket</p>
        </div>

        {tickets.length === 0 ? (
          <div className="bento-card p-10 bg-white text-center space-y-4 border-2 border-brand-text shadow-[4px_4px_0px_#2D241E]">
            <div className="w-16 h-16 bg-brand-bg border-2 border-brand-text rounded-full flex items-center justify-center mx-auto opacity-40">
              <Receipt className="w-8 h-8 text-brand-text" />
            </div>
            <p className="font-bold text-sm uppercase opacity-50">Usted no ha realizado ningún pedido aún.</p>
            <p className="text-xs opacity-40">¡Date un gusto y pide unos deliciosos tacos ahora!</p>
            <button
              onClick={() => setCurrentScreen('categories')}
              className="bg-brand-accent text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 border-brand-text shadow-[3px_3px_0px_#075985] hover:bg-brand-text transition-all"
            >
              Ver Menú
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket) => {
              const isCompleted = ticket.status === 'completed';
              const isPaid = ticket.status === 'paid';
              return (
                <div 
                  key={ticket.id} 
                  className={`relative overflow-hidden bento-card p-6 bg-white border-2 border-brand-text shadow-[4px_4px_0px_#2D241E] space-y-4 transition-all ${
                    isPaid 
                      ? 'border-blue-600 shadow-[4px_4px_0px_#1E3A8A]' 
                      : isCompleted 
                        ? 'border-green-600 shadow-[4px_4px_0px_#1B4332]' 
                        : ''
                  }`}
                >
                  <div className="flex justify-between items-center pb-3 border-b-2 border-dashed border-brand-text/10">
                    <div>
                      <span className="text-[10px] font-mono font-bold opacity-40">{ticket.date}</span>
                      <h4 className="font-black text-xl uppercase leading-none">{ticket.id}</h4>
                    </div>
                    <div>
                      {isPaid ? (
                        <span className="bg-blue-650 text-blue-800 text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider flex items-center border-2 border-blue-600 shadow-[2px_2px_0px_#1E3A8A]">
                          Pagado ✅
                        </span>
                      ) : isCompleted ? (
                        <span className="bg-green-600 text-white text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider animate-pulse flex items-center border-2 border-brand-text shadow-[2px_2px_0px_#1B4332]">
                          Listo para Pagar 🧾
                        </span>
                      ) : (
                        <span className="bg-yellow-500 text-brand-text text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider flex items-center border-2 border-brand-text">
                          En Cocina 👨‍🍳
                        </span>
                      )}
                    </div>
                  </div>

                  {isPaid ? (
                    <div className="p-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg">
                      <p className="text-xs font-black uppercase text-blue-700 leading-normal">
                        ¡Pago registrado existosamente! Muchas gracias por comer con nosotros en El Barrio. ¡Vuelva pronto por más tacos! 🌮
                      </p>
                    </div>
                  ) : isCompleted ? (
                    <div className="p-3 bg-green-50 border-2 border-dashed border-green-300 rounded-lg space-y-3">
                      <p className="text-xs font-black uppercase text-green-700 leading-normal">
                        ¡Tu ticket ha sido entregado! Selecciona tu método de pago para realizar el pago:
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          onClick={() => handlePayTicket(ticket.id, 'efectivo')}
                          className="bg-brand-bg hover:bg-brand-text hover:text-white border-2 border-brand-text text-brand-text px-3 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_#2D241E] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                        >
                          <span className="text-sm">💵</span>
                          <span>Efectivo</span>
                        </button>
                        <button
                          onClick={() => handlePayTicket(ticket.id, 'transferencia')}
                          className="bg-brand-bg hover:bg-brand-text hover:text-white border-2 border-brand-text text-brand-text px-3 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_#2D241E] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                        >
                          <span className="text-sm">📱</span>
                          <span>Transfer</span>
                        </button>
                        <button
                          onClick={() => handlePayTicket(ticket.id, 'tarjeta')}
                          className="bg-brand-bg hover:bg-brand-text hover:text-white border-2 border-brand-text text-brand-text px-3 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_#2D241E] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                        >
                          <span className="text-sm">💳</span>
                          <span>Tarjeta</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-lg">
                      <p className="text-xs font-black uppercase text-yellow-700 leading-normal">
                        Estamos preparando tu orden con el auténtico sabor del barrio. Espera a que el empleado la apruebe para recibir tu ticket.
                      </p>
                    </div>
                  )}

                  <div className="bg-brand-bg/30 p-4 rounded-xl border border-brand-text/10 font-mono text-xs space-y-2 relative overflow-hidden">
                    <div className="text-center font-bold pb-2 border-b border-brand-text/20 uppercase tracking-widest text-[9px] opacity-60">
                      *** DETALLE DE CONSUMO ***
                    </div>
                    
                    <div className="space-y-1.5 pt-2">
                      {ticket.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.quantity}x {it.name}</span>
                          <span className="font-bold">${(it.price * it.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-dashed border-brand-text/20 pt-2 flex justify-between items-center text-sm font-black uppercase">
                      <span>Total Neto</span>
                      <span className="text-brand-accent">${ticket.total.toFixed(2)}</span>
                    </div>

                    {isPaid && (
                      <div className="border-t border-dashed border-brand-text/20 pt-2 flex justify-between items-center text-[10px] font-black uppercase text-blue-700">
                        <span>Método de Pago</span>
                        <span>{ticket.paymentMethod === 'efectivo' ? '💵 Efectivo' : ticket.paymentMethod === 'transferencia' ? '📱 Transferencia' : '💳 Tarjeta'}</span>
                      </div>
                    )}

                    <div className="text-center text-[9px] opacity-40 pt-2 border-t border-brand-text/10">
                      ¡Gracias por comer con nosotros en El Barrio!
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const OrderSummary = ({ className = "" }: { className?: string }) => (
    <div className={`flex flex-col h-full bg-white border-l-4 border-brand-text p-6 ${className}`}>
      <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-brand-accent" />
        Tu Orden
      </h2>
      
      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
          <UtensilsCrossed className="w-12 h-12 mb-4" />
          <p className="category-label italic">El comal está vacío...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {cart.map((item) => (
            <div key={item.id} className="bento-card p-4 bg-brand-bg/50 border-2">
              <div className="flex justify-between items-start mb-2">
                <span className="font-black uppercase tracking-tight text-sm">{item.name}</span>
                <button onClick={() => removeFromCart(item.id)} className="text-brand-text/30 hover:text-brand-accent">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2 bg-white border-2 border-brand-text rounded-md px-1">
                  <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1"><X className="w-3 h-3" /></button>
                  <span className="font-mono font-bold text-xs w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1"><PlusCircle className="w-3 h-3 text-brand-text" /></button>
                </div>
                <span className="price-tag text-sm">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div className="mt-6 pt-6 border-t-4 border-brand-text">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-black uppercase opacity-40">Total</span>
            <span className="text-3xl font-mono font-black text-brand-accent">${totalPrice.toFixed(2)}</span>
          </div>
          <button 
            className="w-full bg-brand-accent text-white py-4 rounded-xl font-black uppercase tracking-widest border-2 border-brand-text shadow-[4px_4px_0px_#075985] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            onClick={handleCheckout}
          >
            ORDENAR YA
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg font-sans flex justify-center">
      <RoleSwitcher />
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-bg/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bento-card bg-white p-10 max-w-sm w-full text-center space-y-6"
            >
              <div className="w-24 h-24 bg-brand-accent border-4 border-brand-text rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0px_#075985]">
                <PartyPopper className="w-12 h-12 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">¡Listo!</h3>
                <p className="category-label mt-2 italic text-brand-price">
                  Su pedido fué hecho, espere su ticket para realizar el pago
                </p>
              </div>
              <button 
                onClick={() => setShowSuccess(false)}
                className="w-full bg-brand-text text-white py-4 rounded-xl font-black uppercase tracking-widest"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}

        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-brand-bg/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white border-t-4 border-brand-text p-8 w-full max-w-lg rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] space-y-6"
            >
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Agregar Nuevo Producto</h3>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-mono font-bold opacity-40 uppercase tracking-widest">ID: #TAC-2024-{(menuItems.length + 1).toString().padStart(3, '0')}</span>
                  <span className="text-[10px] font-serif italic opacity-30">generado automáticamente</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-black uppercase tracking-wider opacity-60">Nombre del Producto</label>
                  <input 
                    type="text" 
                    placeholder="Ingrese el nombre del producto..."
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full bento-card p-4 text-brand-text placeholder:opacity-30 focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-black uppercase tracking-wider opacity-60">Precio</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-brand-price">$</span>
                    <input 
                      type="number" 
                      placeholder="12.99"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      className="w-full bento-card p-4 pl-10 text-right font-mono font-bold text-brand-price focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black uppercase tracking-wider opacity-60">Categoría</label>
                  <div className="flex gap-3">
                    {['tacos', 'bebidas', 'extras'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setNewProductCategory(cat as any)}
                        className={`flex-1 py-3 px-4 rounded-full border-2 border-brand-text font-black uppercase text-xs tracking-widest transition-all ${
                          newProductCategory === cat 
                            ? 'bg-brand-accent text-white shadow-[3px_3px_0px_#075985]' 
                            : 'bg-brand-bg/30 text-brand-text/50 border-brand-text/20'
                        }`}
                      >
                        {cat === 'tacos' ? 'Taco' : cat === 'bebidas' ? 'Bebida' : 'Extra'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="text-sm font-black uppercase tracking-wider opacity-60">Foto</label>
                  <button className="w-14 h-14 bento-card flex items-center justify-center bg-brand-bg/20 text-brand-text/40 hover:text-brand-accent transition-colors group">
                    <Camera className="w-6 h-6 transform group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleAddProduct}
                  disabled={!newProductName || !newProductPrice}
                  className="flex-1 bg-green-600 text-white py-4 rounded-full font-black uppercase tracking-widest border-2 border-brand-text shadow-[4px_4px_0px_#2D241E] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                >
                  Enviar
                </button>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-slate-300 text-brand-text/60 py-4 rounded-full font-black uppercase tracking-widest border-2 border-brand-text shadow-[4px_4px_0px_#2D241E] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-6xl flex flex-col md:flex-row shadow-2xl bg-white min-h-screen">
                     {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen relative border-r-2 border-brand-text/10">
          {/* Header */}
          <header className="bg-white px-6 py-6 flex items-center justify-between sticky top-0 z-30 border-b-2 border-brand-text">
            <div className="flex items-center gap-3">
              {role === 'client' && currentScreen !== 'categories' && (
                <button 
                  id="back-button"
                  onClick={() => setCurrentScreen('categories')}
                  className="w-10 h-10 border-2 border-brand-text flex items-center justify-center rounded-lg hover:bg-brand-bg transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-brand-text" />
                </button>
              )}
              {role !== 'client' && (
                <div className="px-2 py-1 bg-brand-accent text-white text-[10px] font-black rounded uppercase">
                  {role === 'admin' ? 'Administrador' : 'Empleado'}
                </div>
              )}
              <div>
                <h1 id="app-title" className="text-2xl font-black uppercase tracking-tighter leading-none">EL BARRIO</h1>
                <p className="category-label">Sabor auténtico</p>
              </div>
            </div>
            
            <div className="md:hidden">
              {role === 'client' ? (
                <button 
                  id="cart-toggle"
                  onClick={() => setCurrentScreen('cart')}
                  className="relative w-12 h-12 bg-brand-accent border-2 border-brand-text shadow-[3px_3px_0px_#075985] rounded-full text-white flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-brand-text text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-brand-text">
                      {totalItems}
                    </span>
                  )}
                </button>
              ) : (
                <div className="w-8" />
              )}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-brand-bg/20">
            <AnimatePresence mode="wait">
              {/* Client Views */}
              {role === 'client' && currentScreen === 'categories' && (
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-6 md:p-10 space-y-8 pb-32"
                >
                  <div className="space-y-1">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Categorías</h2>
                    <p className="category-label text-brand-text/60 italic">Selecciona para empezar</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        id={`category-${cat.id}`}
                        onClick={() => navigateToCategory(cat)}
                        className="bento-card group relative h-40 overflow-hidden text-left bg-white"
                      >
                        <div className="absolute inset-0 bg-brand-accent/5 group-hover:bg-brand-accent/10 transition-colors" />
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          {cat.id === 'tacos' ? <UtensilsCrossed className="w-16 h-16" /> : cat.id === 'bebidas' ? <Beer className="w-16 h-16" /> : <PlusCircle className="w-16 h-16" />}
                        </div>
                        <div className="relative p-6 h-full flex flex-col justify-center">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="category-label text-brand-accent">Especialidad</span>
                              <h3 className="text-3xl font-black text-brand-text leading-tight">{cat.name.toUpperCase()}</h3>
                              <p className="text-xs opacity-60 mt-1">{cat.description}</p>
                            </div>
                            <div className="w-10 h-10 border-2 border-brand-text flex items-center justify-center rounded-full bg-white group-hover:bg-brand-accent group-hover:text-white transition-all">
                              <ChevronRight className="w-6 h-6" />
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {role === 'client' && currentScreen === 'menu' && (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-6 md:p-10 space-y-6 pb-40"
                >
                  <div className="flex items-end justify-between border-b-2 border-brand-text/10 pb-2">
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">{selectedCategory?.name}</h2>
                    <span className="text-[10px] font-black px-2 py-1 bg-brand-text text-white rounded uppercase">Sabor de Barrio</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {menuItems.filter(item => item.category === selectedCategory?.id).map((item) => {
                      const isOutOfStock = (item.stock ?? 0) <= 0;
                      return (
                        <div key={item.id} className={`bento-card flex flex-col bg-white overflow-hidden transition-opacity ${isOutOfStock ? 'opacity-80' : ''}`}>
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div className="mb-4">
                              <div className="flex justify-between items-start gap-4">
                                <h4 className={`font-black text-xl uppercase tracking-tight leading-tight ${isOutOfStock ? 'opacity-40' : ''}`}>{item.name}</h4>
                                {!isOutOfStock && <span className="price-tag text-xl">${item.price.toFixed(2)}</span>}
                              </div>
                              <p className="category-label mt-2">{item.description}</p>
                              {isOutOfStock && (
                                <div className="mt-4 p-2 bg-red-50 border-2 border-dashed border-red-200 rounded-lg text-center">
                                  <p className="text-[10px] font-black uppercase text-red-600 tracking-wider">Por el momento no lo tenemos</p>
                                </div>
                              )}
                            </div>
                            
                            {!isOutOfStock && (
                              <div className="flex items-center justify-between pt-4 border-t border-brand-text/5">
                                <div className="flex items-center gap-3 bg-brand-bg border-2 border-brand-text rounded-lg p-1">
                                  <button 
                                    onClick={() => updateItemQuantity(item.id, -1, item.stock)}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-white rounded transition-colors text-brand-text font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-sm min-w-[20px] text-center">
                                    {getItemQuantity(item.id)}
                                  </span>
                                  <button 
                                    onClick={() => updateItemQuantity(item.id, 1, item.stock)}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-white rounded transition-colors text-brand-text font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                                <button 
                                  id={`add-${item.id}`}
                                  onClick={() => addToCart(item)}
                                  className="bg-brand-text text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-brand-accent transition-colors shadow-[3px_3px_0px_#075985] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                                >
                                  Agregar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {role === 'client' && currentScreen === 'pedido' && (
                <motion.div
                  key="pedido"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ClientPedido />
                </motion.div>
              )}

              {/* Admin Views */}
              {role === 'admin' && (
                !isAdminAuthenticated ? (
                  <motion.div 
                    key="admin-auth" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="p-6 md:p-8 space-y-6 pb-24"
                  >
                    <div className="max-w-md mx-auto space-y-6 text-center my-6">
                      <div className="bento-card p-6 md:p-8 bg-white border-2 border-brand-text shadow-[4px_4px_0px_#2D241E] space-y-6">
                        <div className="w-16 h-16 bg-red-100 border-2 border-red-600 rounded-full flex items-center justify-center mx-auto shadow-[3px_3px_0px_#991B1B] text-red-750">
                          <Lock className="w-8 h-8" />
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black uppercase tracking-tight">Acceso Administrador</h3>
                          <p className="text-xs text-brand-text/60 italic">Introduce la contraseña de administración</p>
                        </div>

                        {/* PIN Screen Output */}
                        <div className="bg-brand-bg/50 border-2 border-brand-text p-4 rounded-xl font-mono text-center tracking-widest text-2xl font-black text-brand-text/80 shadow-[inset_1px_1px_4px_rgba(0,0,0,0.1)] relative">
                          {adminPasswordInput ? (
                            <span>{'•'.repeat(adminPasswordInput.length)}</span>
                          ) : (
                            <span className="text-sm font-sans font-bold opacity-30 italic">INGRESE PIN DE ADMIN</span>
                          )}
                        </div>

                        {adminPwdError && (
                          <p className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-lg border border-red-200 animate-shake">{adminPwdError}</p>
                        )}

                        {/* Numeric Touch Pad */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                            {[
                              ['1', '2', '3'],
                              ['4', '5', '6'],
                              ['7', '8', '9'],
                              ['C', '0', '⌫']
                            ].map((row) => 
                              row.map((k) => (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() => {
                                    if (k === 'C') handleAdminKeypadPress('CLEAR');
                                    else if (k === '⌫') handleAdminKeypadPress('DELETE');
                                    else handleAdminKeypadPress(k);
                                  }}
                                  className={`py-3.5 border-2 border-brand-text rounded-xl font-mono font-black text-sm uppercase transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                                    k === 'C' 
                                      ? 'bg-red-50 text-red-750 shadow-[2px_2px_0px_#B91C1C]' 
                                      : k === '⌫' 
                                        ? 'bg-amber-50 text-amber-750 shadow-[2px_2px_0px_#B45309]' 
                                        : 'bg-white text-brand-text shadow-[2px_2px_0px_#2D241E] hover:bg-brand-bg/45'
                                  }`}
                                >
                                  {k}
                                </button>
                              ))
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleAdminKeypadPress('OK')}
                            className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest border-2 border-brand-text rounded-xl shadow-[3px_3px_0px_#991B1B] active:translate-y-0.5 active:shadow-none transition-all"
                          >
                            <Unlock className="w-4 h-4" />
                            <span>Validar PIN ✓</span>
                          </button>
                        </div>

                        <div className="pt-2 text-[10px] text-brand-text/50 font-medium space-y-1 bg-brand-bg/20 p-2.5 rounded-lg border border-dashed border-brand-text/10">
                          <p className="font-bold text-center underline uppercase tracking-wider text-[9px] text-brand-text/70">Código Demo Admin: <span className="font-mono font-bold text-brand-accent">1986</span></p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {currentScreen === 'dashboard' && (
                      <motion.div key="admin-dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-8">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bento-card p-6 bg-white">
                              <span className="text-[10px] font-black uppercase text-brand-text opacity-40">Ventas Hoy</span>
                              <h4 className="text-3xl font-mono font-black text-brand-accent">
                                ${tickets.filter(t => t.status === 'completed' || t.status === 'paid').reduce((sum, t) => sum + t.total, 0).toFixed(2)}
                              </h4>
                            </div>
                            <div className="bento-card p-6 bg-white">
                              <span className="text-[10px] font-black uppercase opacity-40">Tickets Totales</span>
                              <h4 className="text-3xl font-mono font-black">{tickets.length}</h4>
                            </div>
                         </div>
                         <div className="bento-card p-6 bg-white">
                            <h4 className="font-black uppercase tracking-tight mb-4">Stock Crítico</h4>
                            <div className="space-y-4">
                              {menuItems.filter(i => (i.stock || 0) <= (i.minStock || 0)).map(i => (
                                <div key={i.id} className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-200">
                                  <span className="text-sm font-black uppercase">{i.name}</span>
                                  <span className="text-xs font-bold text-red-600">{i.stock} pzas</span>
                                </div>
                              ))}
                            </div>
                         </div>
                      </motion.div>
                    )}

                    {currentScreen === 'inventory' && (
                      <motion.div key="admin-inv" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                        <AdminInventory />
                      </motion.div>
                    )}

                    {currentScreen === 'tickets' && (
                      <motion.div key="admin-tickets" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                        <AdminTickets />
                      </motion.div>
                    )}

                    {currentScreen === 'products' && (
                      <motion.div key="admin-products" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                        <AdminProducts />
                      </motion.div>
                    )}
                  </>
                )
              )}

              {/* Employee View */}
              {role === 'employee' && (
                <motion.div 
                  key="employee-view" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="p-6 md:p-8 space-y-6 pb-24"
                >
                  {!isEmployeeAuthenticated ? (
                    // PASSWORD LOCK GATE
                    <div className="max-w-md mx-auto space-y-6 text-center my-6">
                      <div className="bento-card p-6 md:p-8 bg-white border-2 border-brand-text shadow-[4px_4px_0px_#2D241E] space-y-6">
                        <div className="w-16 h-16 bg-amber-100 border-2 border-amber-600 rounded-full flex items-center justify-center mx-auto shadow-[3px_3px_0px_#D97706] text-amber-700">
                          <Lock className="w-8 h-8" />
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black uppercase tracking-tight">Acceso Restringido</h3>
                          <p className="text-xs text-brand-text/60 italic">Introduce el pin de seguridad de El Barrio</p>
                        </div>

                        {/* PIN Screen Output */}
                        <div className="bg-brand-bg/50 border-2 border-brand-text p-4 rounded-xl font-mono text-center tracking-widest text-2xl font-black text-brand-text/80 shadow-[inset_1px_1px_4px_rgba(0,0,0,0.1)] relative">
                          {employeePasswordInput ? (
                            <span>{'•'.repeat(employeePasswordInput.length)}</span>
                          ) : (
                            <span className="text-sm font-sans font-bold opacity-30 italic">INGRESE PIN DE EMPLEADO</span>
                          )}
                        </div>

                        {pwdError && (
                          <p className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-lg border border-red-200 animate-shake">{pwdError}</p>
                        )}

                        {/* Numeric Touch Pad */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                            {[
                              ['1', '2', '3'],
                              ['4', '5', '6'],
                              ['7', '8', '9'],
                              ['C', '0', '⌫']
                            ].map((row, rIdx) => 
                              row.map((k) => (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() => {
                                    if (k === 'C') handleKeypadPress('CLEAR');
                                    else if (k === '⌫') handleKeypadPress('DELETE');
                                    else handleKeypadPress(k);
                                  }}
                                  className={`py-3.5 border-2 border-brand-text rounded-xl font-mono font-black text-sm uppercase transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                                    k === 'C' 
                                      ? 'bg-red-50 text-red-750 shadow-[2px_2px_0px_#B91C1C]' 
                                      : k === '⌫' 
                                        ? 'bg-amber-50 text-amber-750 shadow-[2px_2px_0px_#B45309]' 
                                        : 'bg-white text-brand-text shadow-[2px_2px_0px_#2D241E] hover:bg-brand-bg/45'
                                  }`}
                                >
                                  {k}
                                </button>
                              ))
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleKeypadPress('OK')}
                            className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs tracking-widest border-2 border-brand-text rounded-xl shadow-[3px_3px_0px_#14532D] active:translate-y-0.5 active:shadow-none transition-all"
                          >
                            <Unlock className="w-4 h-4" />
                            <span>Validar PIN ✓</span>
                          </button>
                        </div>

                        <div className="pt-2 text-[10px] text-brand-text/50 font-medium space-y-1 bg-brand-bg/20 p-2.5 rounded-lg border border-dashed border-brand-text/10">
                          <p className="font-bold text-center underline uppercase tracking-wider text-[9px] text-brand-text/70 mb-1">Pines de la Taquería:</p>
                          <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                            <div>🥩 Carlos: <span className="font-mono font-bold text-brand-accent">123</span></div>
                            <div>🥤 Sofía: <span className="font-mono font-bold text-brand-accent">456</span></div>
                            <div>📦 Miguel: <span className="font-mono font-bold text-brand-accent">789</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // EMPLOYEE WORKSPACE
                    <div className="space-y-6">
                      {/* Welcome bar with Logout */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border-2 border-brand-text shadow-[3px_3px_0px_#2D241E]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-brand-bg rounded-xl border-2 border-brand-text flex items-center justify-center text-brand-text">
                            <Users className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black uppercase leading-none">Portal de Trabajo</h3>
                            <p className="text-xs text-brand-text/50">Sesión activa de Cocina y Caja</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setIsEmployeeAuthenticated(false);
                            setEmployeeRole(null);
                            setEmployeeActiveTab('registro');
                          }}
                          className="px-4 py-2 border-2 border-red-200 hover:border-red-600 hover:bg-red-50 text-red-750 rounded-xl text-xs font-black uppercase tracking-wider transition-all self-start sm:self-center flex items-center gap-2"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Cerrar Sesión
                        </button>
                      </div>

                      {/* Employee Tabs bar */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b-2 border-brand-text/10 pb-2">
                        {[
                          { id: 'registro', label: '📋 Registro del Día' },
                          { id: 'carlos', label: '🥩 Carlos (Tacos)' },
                          { id: 'sofia', label: '🥤 Sofía (Barra)' },
                          { id: 'miguel', label: '📦 Miguel (Caja)' }
                        ].filter(tab => {
                          if (!employeeRole || employeeRole === 'all') return true;
                          if (tab.id === 'registro') return true;
                          return tab.id === employeeRole;
                        }).map((tab) => {
                          const isActive = employeeActiveTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setEmployeeActiveTab(tab.id as any)}
                              className={`py-3 px-2 border-2 border-brand-text rounded-xl font-black uppercase text-xs tracking-tight transition-all text-center ${
                                isActive 
                                  ? 'bg-brand-text text-white shadow-[2.5px_2.5px_0px_#075985]' 
                                  : 'bg-white text-brand-text/70 opacity-80 hover:opacity-100 hover:bg-brand-bg/10'
                              }`}
                            >
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* WORKSPACE DETAILED VIEWS */}

                      {/* TAB 1: REGISTRO DEL DÍA (All orders tracked) */}
                      {employeeActiveTab === 'registro' && (
                        <div className="space-y-6">
                          {/* Daily statistics row */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-brand-bg/30 p-4 rounded-xl border border-brand-text/10 text-center space-y-1">
                              <span className="text-[10px] font-black uppercase opacity-50 tracking-wider">Ventas Recaudadas</span>
                              <p className="text-2xl font-mono font-black text-brand-accent">
                                ${tickets.filter(t => t.status === 'paid' || t.status === 'completed').reduce((sum, t) => sum + t.total, 0).toFixed(2)}
                              </p>
                            </div>
                            <div className="bg-brand-bg/30 p-4 rounded-xl border border-brand-text/10 text-center space-y-1">
                              <span className="text-[10px] font-black uppercase opacity-50 tracking-wider">Tickets Totales Hoy</span>
                              <p className="text-2xl font-mono font-black">{tickets.length}</p>
                            </div>
                            <div className="bg-brand-bg/30 p-4 rounded-xl border border-brand-text/10 text-center space-y-1">
                              <span className="text-[10px] font-black uppercase opacity-50 tracking-wider">Pendientes Cocina</span>
                              <p className="text-2xl font-mono font-black text-yellow-650">
                                {tickets.filter(t => t.status === 'pending').length}
                              </p>
                            </div>
                            <div className="bg-brand-bg/30 p-4 rounded-xl border border-brand-text/10 text-center space-y-1">
                              <span className="text-[10px] font-black uppercase opacity-50 tracking-wider">Listos para Cobrar</span>
                              <p className="text-2xl font-mono font-black text-green-750">
                                {tickets.filter(t => t.status === 'completed').length}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-sm font-black uppercase tracking-wide flex items-center gap-2 text-brand-text/80">
                              <ClipboardList className="w-4 h-4 text-brand-accent" />
                              Historial de Tickets Hechos Hoy
                            </h4>

                            {/* Filters and search box */}
                            <div className="flex flex-col sm:flex-row gap-3">
                              <input
                                type="text"
                                placeholder="Buscar ticket por código (Ej: TK-5021)..."
                                value={employeeSearchTerm}
                                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                                className="flex-1 p-3 border-2 border-brand-text rounded-xl font-mono text-xs focus:outline-none focus:border-brand-accent bg-white shadow-[1px_1px_0px_#2D241E]"
                              />
                              
                              <div className="flex gap-1.5 flex-wrap">
                                {[
                                  { id: 'all', label: 'Todos' },
                                  { id: 'pending', label: '👨‍🍳 En Cocina' },
                                  { id: 'completed', label: '🧾 Listo Pago' },
                                  { id: 'paid', label: '✅ Pagado' }
                                ].map((filt) => (
                                  <button
                                    key={filt.id}
                                    onClick={() => setEmployeeStatusFilter(filt.id as any)}
                                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase border border-brand-text ${
                                      employeeStatusFilter === filt.id 
                                        ? 'bg-brand-accent text-white font-bold' 
                                        : 'bg-white hover:bg-brand-bg/10'
                                    }`}
                                  >
                                    {filt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Render orders list */}
                            {(() => {
                              const filteredTickets = tickets.filter(t => {
                                const matchesSearch = t.id.toLowerCase().includes(employeeSearchTerm.toLowerCase());
                                const matchesFilter = employeeStatusFilter === 'all' || t.status === employeeStatusFilter;
                                return matchesSearch && matchesFilter;
                              });

                              if (filteredTickets.length === 0) {
                                return (
                                  <div className="bg-white bento-card p-8 text-center text-brand-text/40 font-bold border-2 border-brand-text/10 italic text-sm">
                                    No se encontraron tickets en el registro de hoy con estos filtros.
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-4">
                                  {filteredTickets.map((t) => {
                                    const totalQty = t.items.reduce((acc, i) => acc + i.quantity, 0);
                                    return (
                                      <div key={t.id} className="bg-white bento-card p-5 border-2 border-brand-text hover:shadow-[3px_3px_0px_#2D241E] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-3 flex-wrap">
                                            <span className="font-mono text-lg font-black">{t.id}</span>
                                            <span className="text-[10px] text-brand-text/50">{t.date}</span>
                                            
                                            {/* Status Badge */}
                                            {t.status === 'paid' ? (
                                              <span className="bg-blue-100 text-blue-800 border border-blue-500 rounded px-2 py-0.5 text-[8px] font-black uppercase">
                                                Cerrado (Pagado con {t.paymentMethod})
                                              </span>
                                            ) : t.status === 'completed' ? (
                                              <span className="bg-green-100 text-green-800 border border-green-500 rounded px-2 py-0.5 text-[8px] font-black uppercase">
                                                Listo para Cobrar🧾
                                              </span>
                                            ) : (
                                              <span className="bg-yellow-100 text-yellow-800 border border-yellow-500 rounded px-2 py-0.5 text-[8px] font-black uppercase animate-pulse">
                                                Preparando en cocina 👨‍🍳
                                              </span>
                                            )}
                                          </div>

                                          <div className="text-xs space-y-0.5">
                                            <p className="font-bold">Especies: ({totalQty} piezas totales)</p>
                                            <div className="flex flex-wrap gap-2 text-[11px] font-mono opacity-80 text-brand-text/75">
                                              {t.items.map((i, idx) => (
                                                <span key={idx} className="bg-brand-bg/40 border border-brand-text/5 px-1.5 py-0.5 rounded">
                                                  {i.quantity}x {i.name}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-dashed border-brand-text/10">
                                          <div className="text-right">
                                            <p className="text-[10px] uppercase tracking-wider font-extrabold opacity-40">Monto Neto</p>
                                            <p className="text-lg font-mono font-black text-brand-price">${t.total.toFixed(2)}</p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* TAB 2: CARLOS (Tacos 🥩) */}
                      {employeeActiveTab === 'carlos' && (
                        <div className="space-y-6">
                          <div className="p-5 bg-[#FFFBEB] border-2 border-[#D97706] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <span className="bg-[#D97706] text-white text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider">🥩 Maestro Taquero</span>
                              <h4 className="text-lg font-black uppercase">Sección de Carlos</h4>
                              <p className="text-xs opacity-70 italic">Prepara al Pastor, Suadero, Bistec y Costillas. ¡Prensa de masa lista!</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs uppercase font-extrabold tracking-wider opacity-50">Tacos sin despachar</p>
                              <p className="text-3xl font-mono font-black text-[#D97706]">
                                {tickets.filter(t => t.status === 'pending' && t.items.some(i => menuItems.find(m => m.name.toLowerCase() === i.name.toLowerCase())?.category === 'tacos')).length} órdenes
                              </p>
                            </div>
                          </div>

                          {/* Carlos kitchen queue */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-black uppercase tracking-wide">Órdenes de Taco en Fuego</h4>
                            
                            {(() => {
                              // Filter orders which are pending and contain tacos
                              const tacoOrders = tickets.filter(t => 
                                t.status === 'pending' && 
                                t.items.some(i => menuItems.find(m => m.name.toLowerCase() === i.name.toLowerCase())?.category === 'tacos')
                              );

                              if (tacoOrders.length === 0) {
                                return (
                                  <div className="bento-card bg-green-50 p-8 border-2 border-green-200 text-center">
                                    <p className="font-black text-green-700 text-sm uppercase">¡No tienes tacos pendientes en parrilla! 🎉</p>
                                    <p className="text-xs text-green-600/70 mt-1">El trompo de pastor está reposando de forma impecable.</p>
                                  </div>
                                );
                              }

                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                  {tacoOrders.map(t => {
                                    const tacoItems = t.items.filter(i => 
                                      menuItems.find(m => m.name.toLowerCase() === i.name.toLowerCase())?.category === 'tacos'
                                    );
                                    
                                    // Check if all taco items in this specific ticket are prepared
                                    const allTacosReady = tacoItems.every(i => preparedItems[`${t.id}-${i.name}`]);

                                    return (
                                      <div key={t.id} className={`bento-card bg-white p-5 border-2 space-y-4 flex flex-col justify-between transition-all ${allTacosReady ? 'border-green-500 shadow-[3px_3px_0px_#14532D]' : 'border-brand-text shadow-[3px_3px_0px_#2D241E]'}`}>
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center border-b pb-2">
                                            <span className="font-mono text-base font-black text-brand-text">{t.id}</span>
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                              Fuego Activo 🔥
                                            </span>
                                          </div>

                                          <div className="space-y-2.5">
                                            {tacoItems.map((i, idx) => {
                                              const isPrepared = preparedItems[`${t.id}-${i.name}`];
                                              return (
                                                <div key={idx} className="flex justify-between items-center">
                                                  <div className="flex flex-col">
                                                    <span className={`text-sm font-bold uppercase ${isPrepared ? 'line-through text-brand-text/30' : ''}`}>
                                                      {i.quantity}x {i.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-brand-text/50">Por comensal</span>
                                                  </div>
                                                  
                                                  <button
                                                    onClick={() => togglePreparedItem(t.id, i.name)}
                                                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg border-2 transition-all ${
                                                      isPrepared 
                                                        ? 'bg-green-50 text-green-700 border-green-500 hover:bg-green-100' 
                                                        : 'bg-amber-50 text-amber-700 border-amber-400 hover:bg-amber-100'
                                                    }`}
                                                  >
                                                    {isPrepared ? 'Listo ✓' : 'Preparar'}
                                                  </button>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        <div className="pt-3 border-t border-dashed border-brand-text/10">
                                          {allTacosReady ? (
                                            <button 
                                              onClick={() => completeOrder(t.id)}
                                              className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-black uppercase text-xs tracking-wider border-2 border-brand-text shadow-[2px_2px_0px_#14532D] transition-all"
                                            >
                                              ¡Enviar a Entrega! 🌮✓
                                            </button>
                                          ) : (
                                            <button 
                                              onClick={() => {
                                                // Batch mark all taco items on this ticket as ready
                                                tacoItems.forEach(i => {
                                                  setPreparedItems(prev => ({
                                                    ...prev,
                                                    [`${t.id}-${i.name}`]: true
                                                  }));
                                                });
                                              }}
                                              className="w-full bg-brand-bg hover:bg-brand-text hover:text-white text-brand-text py-2 rounded-xl font-black uppercase text-[10px] border border-brand-text transition-all"
                                            >
                                              Marcar todos mis tacos listos
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* TAB 3: SOFÍA (Barra 🥤) */}
                      {employeeActiveTab === 'sofia' && (
                        <div className="space-y-6">
                          <div className="p-5 bg-sky-50 border-2 border-sky-600 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <span className="bg-sky-600 text-white text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider">🥤 Salsas y Sifón</span>
                              <h4 className="text-lg font-black uppercase">Sección de Sofía</h4>
                              <p className="text-xs opacity-70 italic">Administra aguas de Jamaica y Horchata, refrescos, volcanes, limones y cebollas.</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs uppercase font-extrabold tracking-wider opacity-50">Vasos por servir</p>
                              <p className="text-3xl font-mono font-black text-sky-700">
                                {tickets.filter(t => t.status === 'pending' && t.items.some(i => menuItems.find(m => m.name.toLowerCase() === i.name.toLowerCase())?.category !== 'tacos')).length} comandas
                              </p>
                            </div>
                          </div>

                          {/* Sofía beverage stack */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-black uppercase tracking-wide">Comandos de Bebidas / Guarnición</h4>

                            {(() => {
                              const barraOrders = tickets.filter(t => 
                                t.status === 'pending' && 
                                t.items.some(i => menuItems.find(m => m.name.toLowerCase() === i.name.toLowerCase())?.category !== 'tacos')
                              );

                              if (barraOrders.length === 0) {
                                return (
                                  <div className="bento-card bg-green-50 p-8 border-2 border-green-200 text-center">
                                    <p className="font-black text-green-700 text-sm uppercase">¡No tienes bebidas ni extras pendientes! 🥤✨</p>
                                    <p className="text-xs text-green-600/70 mt-1">Los barriles de agua de Horchata y Jamaica están refrigerados y al tope.</p>
                                  </div>
                                );
                              }

                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                  {barraOrders.map(t => {
                                    const barraItems = t.items.filter(i => 
                                      menuItems.find(m => m.name.toLowerCase() === i.name.toLowerCase())?.category !== 'tacos'
                                    );

                                    const allDrinksReady = barraItems.every(i => preparedItems[`${t.id}-${i.name}`]);

                                    return (
                                      <div key={t.id} className={`bento-card bg-white p-5 border-2 space-y-4 flex flex-col justify-between transition-all ${allDrinksReady ? 'border-green-500 shadow-[3px_3px_0px_#14532D]' : 'border-brand-text shadow-[3px_3px_0px_#2D241E]'}`}>
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center border-b pb-2">
                                            <span className="font-mono text-base font-black text-brand-text">{t.id}</span>
                                            <span className="text-[10px] font-bold text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                                              Planchelar ❄️
                                            </span>
                                          </div>

                                          <div className="space-y-2.5">
                                            {barraItems.map((i, idx) => {
                                              const isPrepared = preparedItems[`${t.id}-${i.name}`];
                                              return (
                                                <div key={idx} className="flex justify-between items-center">
                                                  <div className="flex flex-col">
                                                    <span className={`text-sm font-bold uppercase ${isPrepared ? 'line-through text-brand-text/30' : ''}`}>
                                                      {i.quantity}x {i.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-brand-text/50">Copa soplada con limones</span>
                                                  </div>

                                                  <button
                                                    onClick={() => togglePreparedItem(t.id, i.name)}
                                                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg border-2 transition-all ${
                                                      isPrepared 
                                                        ? 'bg-green-50 text-green-700 border-green-500 hover:bg-green-100' 
                                                        : 'bg-sky-50 text-sky-700 border-sky-400 hover:bg-sky-100'
                                                    }`}
                                                  >
                                                    {isPrepared ? 'Listo ✓' : 'Entregado'}
                                                  </button>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        <div className="pt-3 border-t border-dashed border-brand-text/10">
                                          {allDrinksReady ? (
                                            <button 
                                              onClick={() => completeOrder(t.id)}
                                              className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-black uppercase text-xs tracking-wider border-2 border-brand-text shadow-[2px_2px_0px_#14532D] transition-all"
                                            >
                                              ¡Servicio Completo! 🥤✓
                                            </button>
                                          ) : (
                                            <button 
                                              onClick={() => {
                                                // Batch mark all drinks of this ticket as ready
                                                barraItems.forEach(i => {
                                                  setPreparedItems(prev => ({
                                                    ...prev,
                                                    [`${t.id}-${i.name}`]: true
                                                  }));
                                                });
                                              }}
                                              className="w-full bg-brand-bg hover:bg-brand-text hover:text-white text-brand-text py-2 rounded-xl font-black uppercase text-[10px] border border-brand-text transition-all"
                                            >
                                              Marcar comanda lista en barra
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* TAB 4: MIGUEL (Caja 📦) */}
                      {employeeActiveTab === 'miguel' && (
                        <div className="space-y-6">
                          <div className="p-5 bg-green-55 border-2 border-green-700 bg-emerald-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <span className="bg-green-750 text-green-800 bg-green-200 border border-green-400 text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider">📦 Caja y Despajado</span>
                              <h4 className="text-lg font-black uppercase text-brand-text">Sección de Miguel</h4>
                              <p className="text-xs opacity-70 italic">Valida pagos de clientes, cierra tickets del día y calcula cambios en caja.</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs uppercase font-extrabold tracking-wider opacity-50">Por Cobrar en Fuerte</p>
                              <p className="text-3xl font-mono font-black text-green-700">
                                {tickets.filter(t => t.status === 'completed').length} tickets
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Unpaid Completed Orders Que */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-black uppercase tracking-wide">Tickets Listos para Cobrar</h4>

                              {(() => {
                                const completedTickets = tickets.filter(t => t.status === 'completed');

                                if (completedTickets.length === 0) {
                                  return (
                                    <div className="bento-card bg-brand-bg/40 p-6 border-2 border-brand-text/10 text-center text-brand-text/50">
                                      <p className="font-bold text-xs uppercase">No hay tickets terminados esperando por pagar en caja.</p>
                                      <p className="text-[10px] opacity-60 mt-1">Sigue tomando órdenes con el auténtico sabor del barrio.</p>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-4">
                                    {completedTickets.map(t => (
                                      <div key={t.id} className="bento-card p-5 bg-white border-2 border-brand-text shadow-[3px_3px_0px_#2D241E] space-y-4">
                                        <div className="flex justify-between border-b pb-2 border-dashed">
                                          <div>
                                            <span className="text-[10px] font-mono text-brand-text/50">{t.date}</span>
                                            <h4 className="text-base font-black tracking-tight">{t.id}</h4>
                                          </div>
                                          <span className="text-lg font-mono font-black text-brand-accent">${t.total.toFixed(2)}</span>
                                        </div>

                                        <div className="text-xs text-brand-text/70 space-y-1">
                                          {t.items.map((it, idx) => (
                                            <div key={idx} className="flex justify-between font-mono">
                                              <span>{it.quantity}x {it.name}</span>
                                              <span>${(it.price * it.quantity).toFixed(2)}</span>
                                            </div>
                                          ))}
                                        </div>

                                        {/* Checkout Actions for Caja */}
                                        <div className="pt-2 border-t border-brand-text/10 space-y-2">
                                          <p className="text-[9px] uppercase font-black tracking-widest text-[#D97706] italic">Seleccionar el método de pago del comensal:</p>
                                          
                                          <div className="grid grid-cols-3 gap-2">
                                            <button
                                              onClick={() => handlePayTicket(t.id, 'efectivo')}
                                              className="bg-[#FFFBEB] hover:bg-brand-text hover:text-white border border-brand-text text-brand-text p-2 rounded-lg font-extrabold text-[10px] uppercase transition-all shadow-[1.5px_1.5px_0px_#2D241E]"
                                            >
                                              💵 Efectivo
                                            </button>
                                            <button
                                              onClick={() => handlePayTicket(t.id, 'transferencia')}
                                              className="bg-[#EFF6FF] hover:bg-brand-text hover:text-white border border-brand-text text-brand-text p-2 rounded-lg font-extrabold text-[10px] uppercase transition-all shadow-[1.5px_1.5px_0px_#2D241E]"
                                            >
                                              📱 Transfer
                                            </button>
                                            <button
                                              onClick={() => handlePayTicket(t.id, 'tarjeta')}
                                              className="bg-[#F0FDF4] hover:bg-brand-text hover:text-white border border-brand-text text-brand-text p-2 rounded-lg font-extrabold text-[10px] uppercase transition-all shadow-[1.5px_1.5px_0px_#2D241E]"
                                            >
                                              💳 Tarjeta
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Paid Orders Log (Today's session audit) */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-black uppercase tracking-wide">Corte Rápido de Caja</h4>

                              <div className="bento-card p-5 bg-white border-2 border-brand-text shadow-[3px_3px_0px_#2D241E] space-y-4 font-mono text-xs">
                                <div className="text-center font-bold border-b pb-2 uppercase tracking-wide text-[10px] text-brand-text/50">
                                  --- Desglose de Fondos ---
                                </div>
                                
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex justify-between">
                                    <span>Ventas Efectivo:</span>
                                    <span className="font-bold">${tickets.filter(t => t.status === 'paid' && t.paymentMethod === 'efectivo').reduce((sum, t) => sum + t.total, 0).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Ventas Transferencia:</span>
                                    <span className="font-bold">${tickets.filter(t => t.status === 'paid' && t.paymentMethod === 'transferencia').reduce((sum, t) => sum + t.total, 0).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Ventas Tarjeta:</span>
                                    <span className="font-bold">${tickets.filter(t => t.status === 'paid' && t.paymentMethod === 'tarjeta').reduce((sum, t) => sum + t.total, 0).toFixed(2)}</span>
                                  </div>
                                </div>

                                <div className="border-t border-dashed pt-2 flex justify-between text-sm font-black uppercase text-brand-text">
                                  <span>Total Caja</span>
                                  <span className="text-brand-accent">${tickets.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.total, 0).toFixed(2)}</span>
                                </div>
                              </div>

                              <h4 className="text-sm font-black uppercase tracking-wide pt-2">Cerrados Recientes (Pagos del Día)</h4>
                              
                              {(() => {
                                const paidTickets = tickets.filter(t => t.status === 'paid').slice(0, 5);

                                if (paidTickets.length === 0) {
                                  return (
                                    <p className="text-[10px] font-bold text-center italic opacity-40 py-2">Ningún ticket liquidado aún en esta sesión.</p>
                                  );
                                }

                                return (
                                  <div className="space-y-2">
                                    {paidTickets.map(t => (
                                      <div key={t.id} className="p-3 bg-white border border-brand-text/10 rounded-xl flex justify-between items-center text-xs">
                                        <div className="flex flex-col">
                                          <span className="font-bold">{t.id}</span>
                                          <span className="text-[9px] opacity-40">Canal: {t.paymentMethod === 'efectivo' ? '💵 Efectivo' : t.paymentMethod === 'transferencia' ? '📱 Transfer' : '💳 Tarjeta'}</span>
                                        </div>
                                        <span className="font-mono font-bold text-emerald-750">${t.total.toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {role === 'client' && currentScreen === 'cart' && (
                <div className="md:hidden h-full">
                  <OrderSummary className="h-full border-l-0" />
                </div>
              )}
            </AnimatePresence>
          </main>
          
          {role === 'admin' && isAdminAuthenticated && <AdminNav />}
          {role === 'client' && <ClientNav />}
          
          {/* Quick Cart Bar for Mobile */}
          {role === 'client' && cart.length > 0 && currentScreen !== 'cart' && currentScreen !== 'pedido' && (
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-xs z-50"
            >
              <button 
                id="quick-cart"
                onClick={() => setCurrentScreen('cart')}
                className="w-full bento-card bg-brand-text text-white p-4 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-brand-accent p-2 rounded-lg border-2 border-white shadow-[2px_2px_0px_white]">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-wider font-black opacity-70">Tu pedido</p>
                    <p className="font-black uppercase tracking-tight">{totalItems} piezas</p>
                  </div>
                </div>
                <div className="text-right border-l-2 border-white/20 pl-4">
                  <p className="text-[10px] uppercase tracking-wider font-black opacity-70">Total</p>
                  <p className="text-2xl font-mono font-bold">${totalPrice.toFixed(2)}</p>
                </div>
              </button>
            </motion.div>
          )}
        </div>

        {/* Desktop Sidebar Summary */}
        <aside className="hidden md:block w-80 lg:w-96 sticky top-0 h-screen overflow-y-auto">
          {role === 'client' ? <OrderSummary /> : (
            <div className="bg-white h-full border-l-4 border-brand-text p-6 space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-brand-accent" />
                {role === 'admin' ? 'Panel Administrativo' : 'Panel Empleado'}
              </h2>
              {role === 'admin' && (
                !isAdminAuthenticated ? (
                  <div className="bg-brand-bg/40 border-2 border-dashed border-brand-text/10 p-5 rounded-2xl text-center space-y-3">
                    <Lock className="w-8 h-8 mx-auto text-brand-text/30" />
                    <div>
                      <p className="text-xs font-black uppercase">Panel Bloqueado</p>
                      <p className="text-[10px] text-brand-text/50 mt-1">Introduce el pin de administración en la pantalla principal para acceder.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AdminNav />
                    
                    <div className="pt-4 border-t-2 border-dashed border-brand-text/10 flex flex-col gap-2">
                      <div className="p-3 bg-brand-bg/30 border border-brand-text/5 rounded-xl text-center">
                        <span className="text-[9px] font-black uppercase text-[#D97706] block mb-1">👑 Sesión Activa de Admin</span>
                        <p className="text-[10px] text-brand-text/60">Tienes acceso de edición completo al menú, inventario de insumos y reportes de venta.</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setIsAdminAuthenticated(false);
                          setAdminPasswordInput('');
                        }}
                        className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-750 border border-red-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )
              )}
              
              {role === 'employee' && (
                <div className="space-y-6 pt-2">
                  {!isEmployeeAuthenticated ? (
                    <div className="bg-brand-bg/40 border-2 border-dashed border-brand-text/10 p-5 rounded-2xl text-center space-y-3">
                      <Lock className="w-8 h-8 mx-auto text-brand-text/30" />
                      <div>
                        <p className="text-xs font-black uppercase">Terminal Bloqueada</p>
                        <p className="text-[10px] text-brand-text/50 mt-1">Introduce el pin en la pantalla principal para ver comandas y personal asignado.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fadeIn">
                      {/* Active Shift list */}
                      <div className="space-y-3">
                        <span className="text-[9px] font-black uppercase tracking-wider text-brand-text/40">
                          {employeeRole === 'all' ? 'Personal de Turno Hoy (3)' : 'Mi Cuenta de Turno Activa'}
                        </span>
                        
                        <div className="space-y-2.5">
                          {(employeeRole === 'all' || employeeRole === 'carlos') && (
                            <div className="p-3.5 bg-brand-bg/30 border border-brand-text/5 rounded-xl space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase text-brand-text">🥩 Carlos</span>
                                <span className="text-[8px] bg-green-100 text-green-800 border border-green-500 rounded px-1.5 py-0.5 font-bold uppercase">En Parrilla</span>
                              </div>
                              <p className="text-[10px] text-brand-text/60">Responsable de trompos, suadero, longaniza y bistec.</p>
                            </div>
                          )}

                          {(employeeRole === 'all' || employeeRole === 'sofia') && (
                            <div className="p-3.5 bg-brand-bg/30 border border-brand-text/5 rounded-xl space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase text-brand-text">🥤 Sofía</span>
                                <span className="text-[8px] bg-green-100 text-green-800 border border-green-500 rounded px-1.5 py-0.5 font-bold uppercase">En Barra</span>
                              </div>
                              <p className="text-[10px] text-brand-text/60">Responsable de aguas frescas, refrescos, salsas y extras.</p>
                            </div>
                          )}

                          {(employeeRole === 'all' || employeeRole === 'miguel') && (
                            <div className="p-3.5 bg-brand-bg/30 border border-brand-text/5 rounded-xl space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase text-brand-text">📦 Miguel</span>
                                <span className="text-[8px] bg-green-100 text-green-800 border border-green-500 rounded px-1.5 py-0.5 font-bold uppercase">En Caja</span>
                              </div>
                              <p className="text-[10px] text-brand-text/60">Responsable de despachar pedidos, cobrar y arqueos de caja.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reminders / Notices */}
                      <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#D97706] block">📢 Recordatorios de Cocina</span>
                        <ul className="text-[10px] text-brand-text/75 space-y-1.5 list-disc pl-3">
                          <li>La masa para las tortillas de maíz azul se prensa al momento.</li>
                          <li>Limpiar plancha de acero al final del turno nocturno.</li>
                          <li>Todo pago en efectivo debe ser ingresado a la caja fuerte por Miguel.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
