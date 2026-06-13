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

export type SaleCommissionData = {
  txId: string;
  sellerName: string;
  productName: string;
  commissionAmount: number;
  issuedAt: Date;
};

function SaleCommissionPDF({ data }: { data: SaleCommissionData }) {
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
          <Text style={styles.title}>Justificante de Venta</Text>
          <Text style={styles.subtitle}>
            Ref: {data.txId} · Emitido el {dateStr}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendedor</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{data.sellerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Referencia</Text>
            <Text style={styles.value}>{data.txId}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Producto vendido</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Producto</Text>
            <Text style={styles.value}>{data.productName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha</Text>
            <Text style={styles.value}>{dateStr}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Comisión acreditada</Text>
          <Text style={styles.totalValue}>{fmt(data.commissionAmount)} EUR</Text>
        </View>

        <Text style={styles.footer}>
          Documento generado automáticamente por MisanClub · {data.txId}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderSaleCommissionPdf(data: SaleCommissionData): Promise<Buffer> {
  return renderToBuffer(<SaleCommissionPDF data={data} />);
}
