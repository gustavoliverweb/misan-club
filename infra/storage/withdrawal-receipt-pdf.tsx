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
  statusBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fff8e1",
    borderWidth: 1,
    borderColor: "#ffe082",
  },
  statusText: { fontSize: 10, color: "#7a6100" },
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

export type WithdrawalReceiptData = {
  txId: string;
  memberName: string;
  amount: number;
  requestedAt: Date;
};

function WithdrawalReceiptPDF({ data }: { data: WithdrawalReceiptData }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
  const dateStr = data.requestedAt.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Solicitud de Retiro</Text>
          <Text style={styles.subtitle}>
            Ref: {data.txId} · Solicitado el {dateStr}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Socio</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{data.memberName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Referencia</Text>
            <Text style={styles.value}>{data.txId}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Importe solicitado</Text>
          <Text style={styles.totalValue}>{fmt(data.amount)} EUR</Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusText}>
            Estado: Pendiente de procesamiento. Los retiros se acreditan en los primeros
            días hábiles del mes siguiente a la solicitud.
          </Text>
        </View>

        <Text style={styles.footer}>
          Documento generado automáticamente por MisanClub · {data.txId}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderWithdrawalReceiptPdf(data: WithdrawalReceiptData): Promise<Buffer> {
  return renderToBuffer(<WithdrawalReceiptPDF data={data} />);
}
