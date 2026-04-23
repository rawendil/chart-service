---
title: "Jeden serwis, trzy formaty — jak zbudowałem mikroserwis do generowania wykresów"
date: 2026-04-23
tags: [typescript, nodejs, microservices, charts, api]
---

## Wykres w trzech miejscach naraz

Zaczęło się od prostego wymagania: ten sam wykres słupkowy z danymi ruchu organicznego miał pojawić się w trzech miejscach — na dashboardzie frontendowym, w miesięcznym raporcie PDF dla klienta i w e-mailu z podsumowaniem tygodnia.

Brzmi niewinnie. W praktyce oznaczało to trzy osobne rozwiązania:

- Na dashboardzie: Chart.js renderowany w przeglądarce
- W PDF: skrypt Pythona generujący PNG przez matplotlib
- W e-mailu: ręczny screenshot, zapisywany gdzieś na dysku i wklejany ręcznie

Zmiana danych = trzy miejsca do aktualizacji. Zmiana koloru brandingowego = trzy miejsca. Nowy typ wykresu = trzy miejsca.

Po raz trzeci z rzędu synchronizowałem te trzy wersje i pomyślałem: to jest problem, który powinienem rozwiązać raz, porządnie. Tak zrodził się `raw-chart-service`.

## Jedna odpowiedzialność, jedno miejsce

Pierwsza decyzja była prosta: izolacja. Chciałem serwisu, który robi jedną rzecz — generuje i serwuje wykresy — i robi ją dobrze. Nie kolejnego monolitu z "modułem wykresów" zakopanym gdzieś w folderze `utils/`.

Mikroserwis oznacza, że każda aplikacja w ekosystemie wywołuje go przez HTTP i dostaje to czego potrzebuje. Jeden endpoint autoryzowany kluczem API. Niezależny deployment. Można go podmienić, skalować lub wyłączyć bez dotykania reszty systemu.

Stack wybrałem pragmatycznie: **Node.js + TypeScript + Express**. TypeScript daje bezpieczeństwo typów bez ceremonii Javy, Express jest wystarczająco prosty żeby nie wchodzić w drogę. Do persystencji — PostgreSQL, do cache'owania — Redis. Celowo nie użyłem żadnego ORM: przy tej skali SQL jest czytelniejszy i łatwiejszy do debugowania niż warstwy abstrakcji.

Jedna rzecz, z której jestem szczególnie zadowolony: serwis działa poprawnie nawet bez Redisa. Jeśli cache nie jest dostępny, odpytuje bazę danych bezpośrednio. Graceful degradation zamiast twardej zależności — coś co przy pierwszym projekcie pewnie bym pominął.

## Jeden wykres, trzy formaty

Tu zaczyna się część, z której jestem najbardziej zadowolony.

Generujesz wykres jednym requestem:

```bash
curl -X POST https://charts.example.com/api/charts/generate \
  -H "x-api-key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "chartType": "bar",
    "title": "Ruch organiczny Q1 2026",
    "data": {
      "labels": ["Styczeń", "Luty", "Marzec"],
      "datasets": [{"label": "Sesje", "data": [12400, 15800, 18200]}]
    }
  }'
```

W odpowiedzi dostajesz `data.chart_hash` — unikalny identyfikator wykresu, a także gotowe URLe do wszystkich formatów. I od tej chwili ten sam hash możesz użyć na trzy różne sposoby.

### `/json` — dla aplikacji frontendowych

`GET /api/charts/{hash}/json` zwraca pełną strukturę danych wykresu. Idealne dla SPA, które chce renderować wykres lokalnie przez Chart.js, ale trzymać dane po stronie serwera.

### `/png` — dla PDF-ów i e-maili

`GET /api/charts/{hash}/png` zwraca binarny obraz PNG. Pod spodem działa Puppeteer z headless Chrome — renderuje interaktywny wykres Chart.js i robi screenshota. Jakość jak z przeglądarki, bez żadnego zewnętrznego narzędzia po stronie klienta.

To rozwiązuje problem numer jeden z mojej listy: zamiast skryptu Pythona z matplotlib — jeden endpoint HTTP.

### `/embed` — dla dowolnej strony

`GET /api/charts/{hash}/embed` zwraca gotową stronę HTML z osadzonym wykresem. Możesz ją wrzucić jako iframe gdziekolwiek:

```html
<iframe
  src="https://charts.example.com/api/charts/a3f8c2/embed"
  width="600"
  height="400"
  frameborder="0">
</iframe>
```

Dokładnie jak embed YouTube czy Google Maps. Żadnych zależności frontendowych, żadnego JavaScript po stronie konsumenta.

---

Kluczowa obserwacja: **dane wprowadzasz raz, format wybiera konsument**. Dashboard używa `/json`, generator PDF pobiera `/png`, newsletter wkleja `/embed`. Jeden wykres, trzy miejsca — problem z początku artykułu rozwiązany.

## To nie jest prototyp

Celowo nie zatrzymałem się na "działa lokalnie". Kilka rzeczy które dodałem żeby serwis był gotowy do produkcji:

**API key auth** — każdy request musi mieć nagłówek `x-api-key`. Bez tego serwis jest użyteczny tylko wewnętrznie, a ja chciałem móc wystawić go na zewnątrz.

**Rate limiting** — domyślnie ograniczenie per IP. Ochrona przed nadużyciami bez potrzeby zewnętrznych narzędzi.

**Redis cache** — wygenerowany wykres jest cachowany. Jeśli ktoś odpytuje ten sam hash wielokrotnie (typowe przy embed), serwis nie trafia za każdym razem do bazy.

**Swagger/OpenAPI** — dokumentacja generowana automatycznie z kodu. Każdy developer może otworzyć `/api/docs` i od razu zacząć eksperymentować.

**Health checks** — endpointy `/api/health` i `/api/health/detailed` gotowe pod monitoring i orchestrację (Kubernetes, Docker Swarm, load balancery).

**Publiczne/prywatne wykresy** — domyślnie wykres jest prywatny (wymaga klucza API). Można go oznaczyć jako publiczny — wtedy embed działa bez autoryzacji, co jest dokładnie tym czego potrzebujesz przy osadzaniu na zewnętrznej stronie.

## Czego się nauczyłem

Najbardziej zaskakującą decyzją okazało się użycie Puppeteer do generowania PNG. Na początku wydawało mi się to overkill — headless Chrome do obrazka? Ale alternatywy, czyli node-canvas czy sharp z własnym renderingiem, wymagały reimplementacji logiki Chart.js od zera. Puppeteer daje pełną fidelity renderingu — wykres wygląda dokładnie tak samo jak w przeglądarce — za cenę startup time'u, który i tak jest cachowany przez Redis.

Najlepsza pojedyncza decyzja to hash zamiast sekwencyjnego ID. Wykresy są publicznie adresowalne bez ujawniania liczby rekordów w bazie i bez możliwości iteracji przez cudze wykresy. Prosty pomysł, ale miałem go dopiero po tym jak zobaczyłem co się dzieje gdy używasz `/charts/1`, `/charts/2`, `/charts/3`.

## A Ty?

Masz podobny problem z wykresami — potrzebujesz ich w kilku miejscach, w różnych formatach, z jednego źródła danych? Napisz w komentarzu albo odezwij się bezpośrednio. Chętnie porozmawiam o tym jak coś takiego mogłoby wyglądać w Twoim projekcie.
