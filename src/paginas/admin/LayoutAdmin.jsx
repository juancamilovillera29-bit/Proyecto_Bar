// ============================================
// Layout: Admin — Shell con sidebar y outlet
// ============================================
import { Outlet, Navigate } from 'react-router-dom';
import { BarraLateral } from '../../componentes/admin/BarraLateral.jsx';
import { BannerNotificaciones } from '../../componentes/admin/BannerNotificaciones.jsx';
import { useAuth } from '../../contextos/ContextoAuth.jsx';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';

export default function LayoutAdmin() {
  const { estaAutenticado, cargando } = useAuth();

  if (cargando) return <CargandoSpinner mensaje="Verificando sesión..." tamano="grande" />;
  if (!estaAutenticado) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--negro-base)' }}>
      <BarraLateral />
      <main style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
      }}>
        <Outlet />
      </main>
      {/* Notificaciones flotantes — visibles en todo el panel admin */}
      <BannerNotificaciones />
    </div>
  );
}

