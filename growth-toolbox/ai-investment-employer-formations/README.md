# AI-investeringar och arbetsgivarföretag

Fristående, färdigbyggt datavisualiseringscase i HTML, CSS och JavaScript. Diagrammet använder en lokalt inkluderad Chart.js 4.5.1-distribution. Paketet kan öppnas direkt via en lokal webbserver och därefter integreras i den befintliga portföljens filstruktur.

## Metodval

Den ursprungliga frågan efterfrågade alla faktiskt startade företag. Census BFS skiljer mellan ansökningar, prognoser och observerade arbetsgivarföretag. Caset använder den ojusterade serien `BF_BF4Q`: företag som uppstår från en ansökan och får sin första löneskatt inom fyra kvartal. Serien slutar 2022 i den senaste Census-filen, därför används 2015–2022 och inga prognoser.

Årsvärdena är summan av de tolv månatliga ansökningskohorterna. Det är därför inte ett mått på exakt vilka företag som började betala lön under respektive kalenderår. Den publika frågan och definitionen är ändrade för att återspegla detta.

Stanford-serien är USA:s privata AI-investeringar, figur 4.2.11 i AI Index 2026, baserat på Quid. Den publika CSV-filen anger miljarder USD men ingen uttrycklig inflationsjustering. Caset beskriver därför beloppen som USD enligt källan och upplyser om att ingen inflationsjustering anges.

Index: `värde år t / värde 2015 × 100`.

## Filer

- `index.html` — semantisk sida, svensk text, tabell och källor.
- `styles.css` — responsiv design i portföljens etablerade beige/blå formspråk.
- `script.js` — Chart.js-konfiguration, tooltips och tabellrader.
- `data/*.csv` — bearbetad årsdata och index, redo för nedladdning.
- `vendor/chart.umd.min.js` — Chart.js 4.5.1.
- `sources/` — källfiler och metodanteckningar för revision.

## Integration

Flytta mappen till den befintliga portföljen eller anpassa HTML-sektionerna till dess struktur. Återanvänd sajtens riktiga header, footer, typsnitt och CSS-variabler. Behåll diagramkonfigurationen, benämningarna, källorna och den tillgängliga tabellen.

Starta lokalt från denna mapp med exempelvis `python3 -m http.server 8000` och öppna `http://localhost:8000`.

## Källor

- Stanford HAI, AI Index 2026: https://hai.stanford.edu/ai-index/2026-ai-index-report
- Stanford public data, Figure 4.2.11: https://drive.google.com/uc?export=download&id=15nqxRFDA4bTCiToicLsCjVyDY28FAnv9
- Census BFS CSV: https://www.census.gov/econ/bfs/csv/bfs_monthly.csv
- Census definitions and methodology: https://www.census.gov/econ/bfs/about_the_data.html

Data hämtad 15 september 2026.
