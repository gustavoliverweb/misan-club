import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Autofactura } from "../../core/domain/autofactura";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#555",
  },
  section: {
    marginBottom: 20,
  },
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    color: "#555",
    width: "40%",
  },
  value: {
    width: "60%",
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  totalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
  },
  totalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
  },
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

type AutofacturaPDFProps = {
  autofactura: Omit<Autofactura, "presignedUrl">;
};

function AutofacturaPDF({ autofactura }: AutofacturaPDFProps) {
  const dateStr = autofactura.issuedAt.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Autofactura</Text>
          <Text style={styles.subtitle}>
            Ref: {autofactura.id} · Emitida el {dateStr}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emisor (Socio)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{autofactura.emisorName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ID de Socio</Text>
            <Text style={styles.value}>{autofactura.emisorId}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receptor</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Empresa</Text>
            <Text style={styles.value}>{autofactura.receptorName}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Concepto</Text>
            <Text style={styles.value}>{autofactura.concepto}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Referencia comisión</Text>
            <Text style={styles.value}>{autofactura.commissionId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Divisa</Text>
            <Text style={styles.value}>{autofactura.currency}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {autofactura.amount.toFixed(2)} {autofactura.currency}
          </Text>
        </View>

        <Text style={styles.footer}>
          Documento generado automáticamente por MisanClub ·{" "}
          {autofactura.id}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderAutofacturaPdf(
  autofactura: Omit<Autofactura, "presignedUrl">
): Promise<Buffer> {
  return renderToBuffer(<AutofacturaPDF autofactura={autofactura} />);
}
