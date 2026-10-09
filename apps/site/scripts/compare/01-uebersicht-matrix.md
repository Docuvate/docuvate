# Vergleiche: Docuvate und Alternativen

> Seitenvorschlag: `/docs/vergleiche` (EN später: `/en/docs/comparisons`). Stand: 09.10.2026.

Es gibt gute Werkzeuge für Dokumentenablage. Hier sehen Sie ehrlich, wo Docuvate passt und wo eine Alternative besser zu Ihnen passt. Alle Vergleiche nutzen dieselben 19 Kriterien in derselben Reihenfolge ([Rubrik](./00-rubrik.md)). Unbekanntes markieren wir als „nicht verifiziert“.

**Docuvate in einem Satz:** selbst gehostete Dokumentenanalyse (OCR, Felder, Labels, Ordner, Chat pro Dokument) mit offener API, im Standard komplett lokal. Das Projekt ist jung (Version 0.1.0).

## Einzelvergleiche

| Vergleich | Kurz |
|---|---|
| [Docuvate vs. Paperless-ngx](./vs-paperless-ngx.md) | Paperless-ngx ist das bekannteste selbst gehostete Dokumentenarchiv und seit Jahren der Standard. |
| [Docuvate vs. Papra](./vs-papra.md) | Papra ist ein bewusst schlankes Dokumentenarchiv, selbst gehostet oder als Cloud-Dienst. |
| [Docuvate vs. Docspell](./vs-docspell.md) | Docspell ist ein ausgereifter Dokumenten-Organizer mit klassischem Machine Learning und starker E-Mail-Integration. |
| [Docuvate vs. Mayan EDMS](./vs-mayan-edms.md) | Mayan EDMS ist ein umfangreiches Open-Source-DMS für Organisationen mit Prozessen, Rechten und Compliance-Anforderungen. |
| [Docuvate vs. DocuWare](./vs-docuware.md) | DocuWare ist eine kommerzielle DMS- und Workflow-Plattform für Unternehmen, vor allem als Cloud-Dienst. |

Die vollständige Matrix aller Produkte in einer Tabelle entfällt. Jeder Einzelvergleich nutzt dieselbe Rubrik; Quellen stehen in den Tabellen und in [quellen.md](./quellen.md).

## Kurz: Wann was?

- **Paperless-ngx:** bewährtes Archiv mit großer Community, Office/E-Mail, Workflows, Archiv-Chat.
- **Papra:** einfachstes Archiv, auch als Cloud-Dienst, mit Mobile-App.
- **Docspell:** erprobt, stark bei E-Mail-Eingang, SSO, kein Chat.
- **Mayan EDMS:** echtes DMS mit Workflows, Aufbewahrung, feinen Rechten.
- **DocuWare:** kommerzielle Plattform mit Support, IDP und SAP-Anbindung, vor allem Cloud.
- **Docuvate:** bestätigte Felder, Labels und Ordner, Chat pro Dokument und API, alles lokal auf CPU.

## Nicht im Vergleich (bewusst)

- **Paperless-AI** (MIT) und **paperless-gpt** (MIT): Erweiterungen für Paperless-ngx, keine eigenständigen Archive. Paperless-AI ist laut README derzeit nicht gepflegt; Paperless-ngx hat inzwischen eigene KI-Funktionen.
- **Teedy** (GPL-2.0): letztes Release v1.11 vom 12.03.2023.
- **Google Drive / Dropbox:** Cloud-Speicher mit Suche, kein selbst gehostetes System; Vergleich nur sinnvoll als eigene Seite „Warum nicht einfach Drive?“ (optional, später).
- **Nanonets und ähnliche IDP-APIs:** Cloud-Extraktionsdienste für Entwickler, eher Bausteine als Archiv.
