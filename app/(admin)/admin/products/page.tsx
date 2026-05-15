import Link from "next/link";
import { Package, Plus, Pencil } from "lucide-react";
import { getAllProductsAction } from "@/app/actions/product-actions";
import { ToggleActiveButton } from "@/components/admin/toggle-active-button";

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

const CATEGORY_LABELS: Record<string, string> = {
  standard:    "Estándar",
  proprietary: "Propio (2×)",
  reduced:     "Reducido (50%)",
  membership:  "Membresía",
  service:     "Servicio",
};

export default async function AdminProductsPage() {
  const products = await getAllProductsAction();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Package size={24} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {products.length} producto{products.length !== 1 ? "s" : ""} en catálogo
            </p>
          </div>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus size={15} />
          Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
          <Package size={32} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No hay productos todavía.</p>
          <Link
            href="/admin/products/new"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
          >
            <Plus size={13} />
            Crear el primer producto
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Producto</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Categoría</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">PVP</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">P. Socio</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Plan</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">N1·N2·N3·N4·N5</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Activo</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Acc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const pvp   = parseFloat(p.precioPublico);
                const socio = parseFloat(p.precioSocio);
                const margin = pvp > 0 ? ((pvp - socio) / pvp * 100).toFixed(0) : null;

                return (
                  <tr key={p.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.nombre}</p>
                      {p.marca && <p className="text-xs text-gray-400">{p.marca}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <p>{p.categoria}</p>
                      {p.subcategoria && (
                        <p className="text-xs text-gray-400">{p.subcategoria}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {fmt.format(pvp)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-medium text-blue-600">{fmt.format(socio)}</p>
                      {margin && (
                        <p className="text-xs text-green-600">−{margin}%</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {CATEGORY_LABELS[p.commissionCategory] ?? p.commissionCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {[p.porcentajeN1, p.porcentajeN2, p.porcentajeN3, p.porcentajeN4, p.porcentajeN5]
                        .map((v) => `${(parseFloat(v) * 100).toFixed(1)}%`)
                        .join("·")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ToggleActiveButton productId={p.id} initialActive={p.active ?? false} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
                      >
                        <Pencil size={11} />
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}