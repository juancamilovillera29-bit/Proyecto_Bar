// ============================================
// Página: KDS Admin — Vista integrada en admin
// Redirige al componente PantallaKDS
// ============================================
import PantallaKDS from '../kds/PantallaKDS.jsx';

export default function KDS() {
  return <PantallaKDS modoAdmin={true} />;
}
