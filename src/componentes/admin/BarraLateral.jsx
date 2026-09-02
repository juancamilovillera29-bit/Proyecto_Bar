// ============================================
// Componente: BarraLateral — Navegación admin
// ============================================
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Archive, Grid3X3,
  ChefHat, BarChart3, BookLock, Settings, LogOut,
  ChevronLeft, ChevronRight, Wine,
} from 'lucide-react';
import { useAuth } from '../../contextos/ContextoAuth.jsx';
import { useState } from 'react';

const elementosNav = [
  { ruta: '/admin/dashboard',      icono: LayoutDashboard, etiqueta: 'Dashboard' },
  { ruta: '/admin/productos',      icono: Package,         etiqueta: 'Productos' },
  { ruta: '/admin/inventario',     icono: Archive,         etiqueta: 'Inventario' },
  { ruta: '/admin/mesas',          icono: Grid3X3,         etiqueta: 'Mesas' },
  { ruta: '/admin/kds',            icono: ChefHat,         etiqueta: 'KDS' },
  { ruta: '/admin/ventas',         icono: BarChart3,       etiqueta: 'Ventas' },
  { ruta: '/admin/cierres',        icono: BookLock,        etiqueta: 'Cierres' },
  { ruta: '/admin/configuracion',  icono: Settings,        etiqueta: 'Configuración' },
];

export function BarraLateral() {
  const { cerrarSesion, usuario, modoDemo } = useAuth();
  const [colapsado, setColapsado] = useState(false);
  const navegar = useNavigate();

  async function manejarCerrarSesion() {
    await cerrarSesion();
    navegar('/login');
  }

  return (
    <aside style={{
      width: colapsado ? 'var(--sidebar-colapsado)' : 'var(--sidebar-ancho)',
      background: 'var(--negro-profundo)',
      borderRight: '1px solid var(--borde-sutil)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      transition: 'width var(--transicion-normal)',
      overflow: 'hidden',
      flexShrink: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: colapsado ? '20px 12px' : '24px 20px',
        borderBottom: '1px solid var(--borde-sutil)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 'var(--header-alto)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--dorado-puro), var(--dorado-suave))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: 'var(--sombra-dorada)',
        }}>
          <Wine size={18} color="var(--negro-profundo)" />
        </div>
        {!colapsado && (
          <div>
            <div style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--dorado-puro)', letterSpacing: '0.05em' }}>
              BORONDO
            </div>
            <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-muted)', letterSpacing: '0.1em' }}>
              BAR POS
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav style={{ flex: 1, padding: '16px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {!colapsado && (
          <div style={{ fontSize: 'var(--texto-xs)', fontWeight: 600, color: 'var(--texto-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px 12px' }}>
            Menú principal
          </div>
        )}
        {elementosNav.map(({ ruta, icono: Icono, etiqueta }) => (
          <NavLink
            key={ruta}
            to={ruta}
            title={colapsado ? etiqueta : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: colapsado ? '10px' : '10px 12px',
              borderRadius: 'var(--radio-md)',
              marginBottom: 4,
              textDecoration: 'none',
              color: isActive ? 'var(--dorado-puro)' : 'var(--texto-terciario)',
              background: isActive ? 'var(--dorado-muy-suave)' : 'transparent',
              border: isActive ? '1px solid var(--dorado-opaco)' : '1px solid transparent',
              transition: 'all var(--transicion-rapida)',
              fontWeight: isActive ? 'var(--peso-semibold)' : 'var(--peso-normal)',
              fontSize: 'var(--texto-sm)',
              justifyContent: colapsado ? 'center' : 'flex-start',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'var(--superficie-3)';
                e.currentTarget.style.color = 'var(--texto-primario)';
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.getAttribute('aria-current')) {
                e.currentTarget.style.background = '';
                e.currentTarget.style.color = '';
              }
            }}
          >
            <Icono size={18} style={{ flexShrink: 0 }} />
            {!colapsado && <span>{etiqueta}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Usuario y cerrar sesión */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--borde-sutil)' }}>
        {!colapsado && (
          <div style={{ padding: '8px 12px', marginBottom: 4 }}>
            <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-muted)' }}>Sesión activa</div>
            <div style={{ fontSize: 'var(--texto-sm)', color: 'var(--texto-secundario)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {usuario?.email || usuario?.nombre || 'Administrador'}
            </div>
          </div>
        )}
        <button
          onClick={manejarCerrarSesion}
          title={colapsado ? 'Cerrar sesión' : undefined}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: colapsado ? '10px' : '10px 12px',
            borderRadius: 'var(--radio-md)', background: 'transparent',
            border: '1px solid transparent', color: 'var(--texto-terciario)',
            fontSize: 'var(--texto-sm)', cursor: 'pointer',
            transition: 'all var(--transicion-rapida)',
            justifyContent: colapsado ? 'center' : 'flex-start',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--rojo-bg)'; e.currentTarget.style.color = 'var(--rojo-claro)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!colapsado && <span>Cerrar sesión</span>}
        </button>
      </div>

      {/* Botón colapsar */}
      <button
        onClick={() => setColapsado(c => !c)}
        style={{
          position: 'absolute', top: '50%', right: -12, transform: 'translateY(-50%)',
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--carbon-medio)', border: '1px solid var(--borde-normal)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--texto-terciario)', cursor: 'pointer',
          transition: 'all var(--transicion-rapida)', zIndex: 101,
        }}
        title={colapsado ? 'Expandir' : 'Colapsar'}
      >
        {colapsado ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
