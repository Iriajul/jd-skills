"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { TailoredResume } from "@/lib/api";

// ATS-friendly: single column, standard fonts, real text, no tables/images.
const styles = StyleSheet.create({
  page: {
    paddingVertical: 40,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111111",
    lineHeight: 1.4,
  },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  contact: { fontSize: 9, color: "#444444", marginBottom: 2 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 6,
    borderBottom: "1pt solid #111111",
    paddingBottom: 2,
  },
  summary: { marginBottom: 2 },
  skills: { lineHeight: 1.5 },
  expHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  expTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  expCompany: { fontSize: 9.5, color: "#333333" },
  expDates: { fontSize: 9, color: "#666666" },
  bulletRow: { flexDirection: "row", marginTop: 2, paddingLeft: 4 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1 },
  eduRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
});

export function ResumePDF({ resume }: { resume: TailoredResume }) {
  const contactLine = [resume.email, resume.phone, resume.location, ...resume.links]
    .filter(Boolean)
    .join("  |  ");

  return (
    <Document title={`${resume.name || "Resume"} — ATS Optimized`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        {resume.name ? <Text style={styles.name}>{resume.name}</Text> : null}
        {contactLine ? <Text style={styles.contact}>{contactLine}</Text> : null}

        {/* Summary */}
        {resume.summary ? (
          <>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{resume.summary}</Text>
          </>
        ) : null}

        {/* Skills */}
        {resume.skills.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skills}>{resume.skills.join(" · ")}</Text>
          </>
        ) : null}

        {/* Experience */}
        {resume.experience.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Experience</Text>
            {resume.experience.map((exp, i) => (
              <View key={i} wrap={false}>
                <View style={styles.expHeaderRow}>
                  <Text style={styles.expTitle}>
                    {exp.title}
                    {exp.company ? `  —  ${exp.company}` : ""}
                  </Text>
                  <Text style={styles.expDates}>{exp.dates}</Text>
                </View>
                {exp.location ? <Text style={styles.expCompany}>{exp.location}</Text> : null}
                {exp.bullets.map((b, j) => (
                  <View key={j} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        ) : null}

        {/* Education */}
        {resume.education.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            {resume.education.map((ed, i) => (
              <View key={i} style={styles.eduRow}>
                <Text>
                  {ed.degree}
                  {ed.institution ? `, ${ed.institution}` : ""}
                </Text>
                <Text style={styles.expDates}>{ed.dates}</Text>
              </View>
            ))}
          </>
        ) : null}

        {/* Certifications */}
        {resume.certifications.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {resume.certifications.map((c, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{c}</Text>
              </View>
            ))}
          </>
        ) : null}
      </Page>
    </Document>
  );
}
