// Builds a "<Name> Call — Script Follow-Along" docx, a JSON manifest (for
// the web player), and a plain CSV timestamp summary from one JSON spec file.
//
// Usage: node build_followalong.js spec.json out.docx out.manifest.json [out.csv]
//
// Spec shape:
// {
//   "name": "PersonName",
//   "mp3": "filename.mp3",
//   "duration": "H:MM:SS",
//   "transcriptionNote": "...",
//   "caution": "..." (optional, empty string if none),
//   "findings": ["...", "..."],
//   "rows": [["0:00–0:32", "Greeting", "..."], ...]
// }

const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle,
} = require("docx");

const [, , specPath, docxOut, manifestOut, csvOut] = process.argv;
if (!specPath || !docxOut || !manifestOut) {
  console.error("Usage: node build_followalong.js spec.json out.docx out.manifest.json [out.csv]");
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const PAGE = { width: 12240, height: 15840 }; // US Letter, DXA

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: "1F2937" })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 26, color: "1F2937" })],
  });
}
function meta(label, value) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: label + ": ", bold: true, size: 21 }),
      new TextRun({ text: String(value), size: 21 }),
    ],
  });
}
function body(text) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, size: 21 })],
  });
}
function caution(text) {
  return new Paragraph({
    spacing: { before: 100, after: 200 },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: "B45309" } },
    indent: { left: 200 },
    children: [
      new TextRun({ text: "CAUTION — ", bold: true, size: 21, color: "B45309" }),
      new TextRun({ text, size: 21, color: "78350F" }),
    ],
  });
}
function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 21 })],
  });
}
function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: "1F2937" },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF" })] })],
  });
}
function cell(text, width, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, bold: opts.bold || false })] })],
  });
}

const colWidths = [1400, 2200, 5800];
const timelineTable = new Table({
  width: { size: colWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: colWidths,
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell("Timestamp", colWidths[0]),
        headerCell("Section", colWidths[1]),
        headerCell("What Happens / Key Line", colWidths[2]),
      ],
    }),
    ...spec.rows.map(([ts, section, desc]) =>
      new TableRow({
        children: [cell(ts, colWidths[0], { bold: true }), cell(section, colWidths[1]), cell(desc, colWidths[2])],
      })
    ),
  ],
});

let skippedTable = null;
if (Array.isArray(spec.skippedSections) && spec.skippedSections.length) {
  const skColWidths = [2600, 6800];
  skippedTable = new Table({
    width: { size: skColWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: skColWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [headerCell("Script Section", skColWidths[0]), headerCell("What Happened On This Call", skColWidths[1])],
      }),
      ...spec.skippedSections.map(([section, status]) =>
        new TableRow({ children: [cell(section, skColWidths[0], { bold: true }), cell(status, skColWidths[1])] })
      ),
    ],
  });
}

const children = [
  h1(`${spec.name} Call — Script Follow-Along`),
  meta("Source file", spec.mp3),
  meta("Duration", spec.duration),
  meta("Transcription", spec.transcriptionNote || ""),
  body("Purpose: Follow this document alongside the recording (or its transcript) to see which part of the call is happening at any given moment, and to spot where it runs long, deviates, or hits friction."),
];
if (spec.caution) children.push(caution(spec.caution));
children.push(h2("Summary of Findings"));
(spec.findings || []).forEach((f) => children.push(bullet(f)));
children.push(h2("Call Timeline"), timelineTable);
if (skippedTable) {
  children.push(h2("Script Coverage Checklist (Skipped / Missing vs. Base Script)"), skippedTable);
}
if (Array.isArray(spec.recommendations) && spec.recommendations.length) {
  children.push(h2("Biggest Recommendations"));
  spec.recommendations.forEach((rec) => children.push(bullet(rec)));
}

const doc = new Document({
  sections: [
    {
      properties: { page: { size: PAGE, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      children,
    },
  ],
});

const TS_RE = /^\s*(\d{1,2}(?::\d{2}){1,2})/;
function parseSeconds(text) {
  const m = TS_RE.exec(text);
  if (!m) return null;
  const parts = m[1].split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(docxOut, buf);
  const manifest = {
    name: spec.name,
    mp3: spec.mp3,
    srt: spec.srt || `${spec.name}.srt`,
    docx: docxOut.split("/").pop(),
    rows: spec.rows.map(([ts, section, desc]) => ({ ts, seconds: parseSeconds(ts), section, desc })),
    skippedSections: (spec.skippedSections || []).map(([section, status]) => ({ section, status })),
    findings: spec.findings || [],
    recommendations: spec.recommendations || [],
    height: spec.height || "",
    weight: spec.weight || "",
    saleClosed: spec.saleClosed === true,
    primaryObjection: spec.primaryObjection || "",
    secondaryObjection: spec.secondaryObjection || "",
    followUpPriority: typeof spec.followUpPriority === "number" ? spec.followUpPriority : null,
    followUpDate: spec.followUpDate || "",
    followUpEventDate: spec.followUpEventDate || "",
    followUpProcess: spec.followUpProcess || "",
    followUpMessage: spec.followUpMessage || "",
  };
  fs.writeFileSync(manifestOut, JSON.stringify(manifest, null, 2));

  let csvNote = "";
  if (csvOut) {
    const csvEscape = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const csvLines = [
      "Timestamp,Section,What Happens / Key Line",
      ...spec.rows.map(([ts, section, desc]) => [ts, section, desc].map(csvEscape).join(",")),
    ];
    fs.writeFileSync(csvOut, csvLines.join("\n") + "\n");
    csvNote = ` and ${csvOut}`;
  }

  console.log(`wrote ${docxOut} (${buf.length} bytes), ${manifestOut}${csvNote}`);
});
