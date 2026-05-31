# 📚 BibliotekUZ - System Zarządzania Biblioteką

Nowoczesna aplikacja webowa typu Single Page Application (SPA) służąca do kompleksowego zarządzania zasobami bibliotecznymi, procesem wypożyczeń oraz obsługą czytelników. 

Projekt realizowany w ramach przedmiotu **Platforma .NET**.

---

## 🚀 O projekcie

BibliotekUZ to system zaprojektowany z myślą o minimalizacji ręcznej pracy bibliotekarzy. Opiera się na solidnej architekturze oddzielającej logikę biznesową (Backend) od interfejsu użytkownika (Frontend). Aplikacja automatyzuje kluczowe procesy biblioteczne, takie jak zarządzanie limitami wypożyczeń, obsługa kolejek oczekujących na niedostępne tytuły oraz automatyczne naliczanie kar za przetrzymanie książek.

Dzięki integracji z **Google Books API**, proces dodawania nowych pozycji do katalogu został maksymalnie uproszczony – wystarczy podać numer ISBN, a system sam pobierze tytuł, autora i okładkę.

---

## ✨ Główne funkcjonalności

System posiada wyraźny podział na strefy uprawnień oraz zautomatyzowaną logikę działającą w tle.

### 👤 Strefa Gościa (Niezalogowany)
* Przeglądanie pełnego katalogu książek.
* Zaawansowane wyszukiwanie i filtrowanie (po tytule, autorze, dostępności).

### 📖 Strefa Czytelnika
* **Zarządzanie wypożyczeniami:** Podgląd aktywnych wypożyczeń, historii oraz ewentualnych opłat karnych.
* **Rezerwacje:** Wypożyczanie dostępnych egzemplarzy (zabezpieczone odgórnym limitem, np. 5 sztuk na konto).
* **Kolejki oczekujących:** Możliwość zapisu do kolejki na dany tytuł, jeśli wszystkie jego fizyczne egzemplarze są aktualnie w obiegu.

### 🛡️ Strefa Administratora / Bibliotekarza
* **Zarządzanie katalogiem (Google Books API):** Błyskawiczne dodawanie nowych książek po numerze ISBN.
* **Zarządzanie egzemplarzami:** Dodawanie i usuwanie fizycznych sztuk przypisanych do danego tytułu.
* **Obsługa zwrotów:** Systemowe zatwierdzanie oddania książki (z automatyczną alokacją dla osoby z kolejki).
* **Zarządzanie użytkownikami:** Wgląd w profile czytelników oraz ręczne zarządzanie blokadami (np. po fizycznym opłaceniu kary).

### ⚙️ Logika Biznesowa (Automatyzacja)
* **Kary finansowe:** Automatyczne naliczanie opłat za każdy dzień zwłoki po przekroczeniu terminu.
* **Blokady dłużników:** System automatycznie odcina możliwość nowych wypożyczeń i rezerwacji użytkownikom z nieuregulowanymi karami.
* **Weryfikacja warunków:** Walidacja limitów wypożyczeń oraz spójności danych przy każdej akcji w systemie.

---

## 🛠️ Technologie i Narzędzia

Projekt został zrealizowany z wykorzystaniem nowoczesnego stosu technologicznego:

**Frontend:**
* **React** - Biblioteka do budowy interfejsu użytkownika.
* **Vite** - Ultraszybkie narzędzie budujące (bundler).
* **JavaScript / JSX** - Logika aplikacji klienckiej.

**Backend:**
* **C# & ASP.NET Core** - Główne środowisko uruchomieniowe i framework API.
* **Entity Framework Core** - Narzędzie ORM do komunikacji z bazą danych.
* **ASP.NET Core Identity** - Zarządzanie autoryzacją i bezpieczne haszowanie haseł (JWT).

**Baza Danych & Integracje:**
* **Relacyjna Baza Danych** (obsługiwana przez EF Core).
* **Google Books API** - Zewnętrzne źródło metadanych o książkach.

**Narzędzia:**
* **Visual Studio 2026** - Główne środowisko programistyczne (IDE).
* **GitKraken** - Zarządzanie kontrolą wersji Git.
* **GitHub Projects** - Organizacja pracy.

---

## 👨‍💻 Zespół projektowy
<div align="center">

| Frontend<br>Developer | Backend<br>Developer | Backend<br>Developer |
| :---: | :---: | :---: |
| <img src="https://github.com/Karolkzsp5.png" width="100" height="100"> | <img src="https://github.com/lukaszgrzecznik.png" width="100" height="100"> | <img src="https://github.com/7ASL.png" width="100" height="100"> |
| **Karol Kondracki** | **Łukasz Grzecznik** | **Arkadiusz Dojlido** |
| [@Karolkzsp5](https://github.com/Karolkzsp5) | [@lukaszgrzecznik](https://github.com/lukaszgrzecznik) | [@7ASL](https://github.com/7ASL) |

</div>

---

## 🚀 Uruchomienie lokalne

1. Sklonuj repozytorium na swój dysk:
   ```bash
   git clone [https://github.com/Karolkzsp5/BibliotekUZ.git](https://github.com/Karolkzsp5/BibliotekUZ.git)
