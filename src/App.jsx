// ============================================
// BORONDO Bar POS — Router principal
// Tres interfaces: Admin | KDS | Cliente
// ============================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProveedorAuth } from './contextos/ContextoAuth.jsx';

// Páginas de autenticación
import Login from './paginas/Login.jsx';

// Layout y páginas del admin
import LayoutAdmin     from './paginas/admin/LayoutAdmin.jsx';
import Dashboard       from './paginas/admin/Dashboard.jsx';
import Productos       from './paginas/admin/Productos.jsx';
import Inventario      from './paginas/admin/Inventario.jsx';
import Mesas           from './paginas/admin/Mesas.jsx';
import KDS             from './paginas/admin/KDS.jsx';
import Ventas          from './paginas/admin/Ventas.jsx';
import Cierres         from './paginas/admin/Cierres.jsx';
import Configuracion   from './paginas/admin/Configuracion.jsx';

// KDS standalone
import PantallaKDS from './paginas/kds/PantallaKDS.jsx';

// Interfaz del cliente (pública)
import MenuCliente       from './paginas/cliente/MenuCliente.jsx';
import SeguimientoPedido from './paginas/cliente/SeguimientoPedido.jsx';
import ConfirmarPedido   from './paginas/cliente/ConfirmarPedido.jsx';
import PaginaPago        from './paginas/cliente/PaginaPago.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorAuth>
        <Routes>
          {/* ── Autenticación ── */}
          <Route path="/login" element={<Login />} />

          {/* ── Panel Administrativo (requiere auth) ── */}
          <Route path="/admin" element={<LayoutAdmin />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard"    element={<Dashboard />} />
            <Route path="productos"    element={<Productos />} />
            <Route path="inventario"   element={<Inventario />} />
            <Route path="mesas"        element={<Mesas />} />
            <Route path="kds"          element={<KDS />} />
            <Route path="ventas"       element={<Ventas />} />
            <Route path="cierres"      element={<Cierres />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>

          {/* ── KDS Standalone (cocina) ── */}
          <Route path="/kds" element={<PantallaKDS />} />

          {/* ── Menú del Cliente (público, acceso por QR) ── */}
          <Route path="/mesa/:codigoQr"              element={<MenuCliente />} />
          <Route path="/mesa/:codigoQr/seguimiento"  element={<SeguimientoPedido />} />
          <Route path="/mesa/:codigoQr/confirmar"    element={<ConfirmarPedido />} />
          <Route path="/mesa/:codigoQr/pago"         element={<PaginaPago />} />

          {/* ── Redireccionamiento raíz ── */}
          <Route path="/"   element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*"   element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </ProveedorAuth>
    </BrowserRouter>
  );
}
