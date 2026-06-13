import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1a1a1a",
  },
  header: { marginBottom: 32 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#555" },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#888",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 4,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#555", width: "40%" },
  value: { width: "60%", textAlign: "right" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    padding: "6 4",
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "4 4",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  colName: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colUnit: { flex: 2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },
  headerText: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 13 },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 13 },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 9,
    color: "#aaa",
    textAlign: "center",
  },
});

export type PurchaseInvoiceItem = {
  nombre: string;
  quantity: number;
  unitPrice: number;
};

export type PurchaseInvoiceData = {
  id: string;
  buyerName: string;
  concepto: string;
  items: PurchaseInvoiceItem[];
  totalAmount: number;
  issuedAt: Date;
};

function PurchaseInvoicePDF({ data }: { data: PurchaseInvoiceData }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
  const dateStr = data.issuedAt.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Factura de Compra</Text>
          <Text style={styles.subtitle}>
            Ref: {data.id} · Emitida el {dateStr}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comprador</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{data.buyerName}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.colName, styles.headerText]}>Producto</Text>
            <Text style={[styles.colQty, styles.headerText]}>Cant.</Text>
            <Text style={[styles.colUnit, styles.headerText]}>P. Unitario</Text>
            <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colName}>{item.nombre}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{fmt(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{fmt(item.unitPrice * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{fmt(data.totalAmount)} EUR</Text>
        </View>

        <Text style={styles.footer}>
          Documento generado automáticamente por MisanClub · {data.id}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderPurchaseInvoicePdf(data: PurchaseInvoiceData): Promise<Buffer> {
  return renderToBuffer(<PurchaseInvoicePDF data={data} />);
}
