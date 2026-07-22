import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from '../../lib/constants';

export default function AdminOrders() {
  const { orders } = useStore();

  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <Header title="Sifariş Tarixçəsi" subtitle={`${orders.length} ümumi sifariş`} showUser />

      <div className="p-6">
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">Sifariş ID</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">Masa</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">Ofisant</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">Məhsullar</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">Məbləğ</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">Tarix</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-text-secondary">
                    {order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-text-primary">#{order.tableNumber}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{order.waiterName}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {order.items.map((item) => (
                        <span key={item.id} className="text-xs bg-surface-secondary text-text-secondary px-2 py-0.5 rounded-full">
                          {item.menuItemName} ×{item.quantity}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-text-primary">{order.totalAmount} ₼</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${ORDER_STATUS_STYLES[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">
                    {new Date(order.createdAt).toLocaleString('az-AZ')}
                  </td>
                </tr>
              ))}
              {sortedOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">Hələ sifariş yoxdur</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
