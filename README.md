# Katalog produktů (Expo / React Native)

TypeScriptová Expo aplikace, která načítá produkty z Fake Store API,
zobrazuje je pomocí `FlatList` a podporuje dva brandy přepínatelné za
běhu aplikace. Samostatné refaktorovací cvičení `UserProfile` se nachází
ve složce `Refactoring/` a záměrně není součástí UI katalogu produktů.

Projekt se zaměřuje na jasné rozdělení odpovědností, striktní typování,
předvídatelnou práci s asynchronním stavem a přiměřené technické
kompromisy vzhledem k rozsahu zadání.

## Spuštění projektu

Je potřeba Node.js a Expo Go, případně iOS/Android simulátor.

``` bash
npm install
npm start
```

Poté stiskněte `i` pro iOS, `a` pro Android nebo naskenujte QR kód
pomocí Expo Go.

Alternativně:

``` bash
npm run ios
npm run android
```

Kontrola TypeScriptu:

``` bash
npx tsc --noEmit
```

`Refactoring/legacy.tsx` je z kompilace záměrně vyloučen, protože jde o
původní netypovanou komponentu ponechanou pro porovnání.

## Architektura

``` text
App
 └── BrandProvider
      ├── BrandSwitcher
      └── ProductsScreen
           └── useProducts
                └── productsApi
```

  -----------------------------------------------------------------------
  Vrstva                              Odpovědnost
  ----------------------------------- -----------------------------------
  `src/config/brands.ts`              ID brandu, název, primární barva a
                                      základní URL API

  `src/context/BrandContext.tsx`      Aktivní značka a její přepínání za
                                      běhu aplikace

  `src/services/productsApi.ts`       HTTP request a validace odpovědi

  `src/hooks/useProducts.ts`          Stav produktů, refresh, postupné
                                      načítání a rušení requestů

  `src/screens`, `src/components`     Prezentační vrstva

  
## Načítání produktů

**Úvodní načítání.** Před dostupností produktů se zobrazí loading stav
přes celou obrazovku.

**Chyby a opakování requestu.** HTTP chyby, síťové chyby a neplatné
odpovědi jsou zpracovány jako chyby. Pokud zatím nejsou k dispozici
žádné produkty, zobrazí se error stav s možností Retry. Pokud selže
refresh a produkty už jsou zobrazené, seznam zůstane viditelný a zobrazí
se chybový banner.

**Pull-to-refresh.** `FlatList` používá `refreshing` a `onRefresh`.
Existující položky zůstávají během refreshování viditelné a stránkování
se po úspěšném znovunačtení resetuje.

**Postupné načítání.** Fake Store API vrací celý katalog a neposkytuje
produkční server-side pagination. Implementace proto uchovává načtenou
kolekci v paměti a postupně ji zpřístupňuje seznamu.

Tím se snižuje množství obsahu renderovaného při prvním zobrazení, ale
nesnižuje se množství přenesených dat, protože celý katalog se stále
stáhne v prvním requestu. S produkčním stránkovaným API by `loadMore`
místo toho načítal další stránku přímo z backendu.

`onEndReached` se může spustit vícekrát, proto implementace chrání před
souběžnými `loadMore` operacemi, pokusy o načtení po zobrazení všech
produktů a načítáním další stránky během jiného requestu kolekce.

## Výkon FlatList

Implementace používá:

-   `FlatList` místo `ScrollView` kvůli virtualizaci
-   stabilní `keyExtractor` založený na `product.id`
-   stabilní `renderItem` pomocí `useCallback`
-   `React.memo` pro `ProductCard`
-   `onEndReached`, `onEndReachedThreshold` a footer pro postupné
    načítání

Agresivnější optimalizace jako `getItemLayout`, vlastní `windowSize`
nebo vlastní batching hodnoty byly záměrně vynechány. Řádky produktů
nemají garantovanou pevnou výšku a další nastavení virtualizace by mělo
vycházet z profilování nad realistickými daty, ne z odhadu.

`React.memo` pomáhá omezit zbytečné renderování řádků při změně stavu
seznamu, pokud reference produktu zůstane stejná. Neodstraňuje ale
náklady na mount nových položek a data načtená po refreshi mohou
obsahovat nové reference objektů, které oprávněně způsobí nový render
karet.

## Multi-brand / white-label

`src/config/brands.ts` definuje Brand A a Brand B. Každá značka má
vlastní primární barvu UI a základní URL API. Komponenty používají
konfiguraci aktivního brandu místo brand-specific podmínek přímo v UI.

Oba brandy v tomto assessmentu používají Fake Store API, protože nebyly
poskytnuty dva samostatné backendy. API URL je přesto součástí
konfigurace každé brandy, takže konkrétní brand lze přesměrovat na jiný
endpoint bez změn v UI komponentách.

Výběr brandu je spravován pomocí jednoduchého React Contextu. Při
přepnutí brandu se příslušný produktový stav resetuje a data se znovu
načtou podle nové konfigurace. Tím se zabrání tomu, aby se stará data
předchozí brandu zobrazovala jako aktuální.

U větší white-label aplikace bych konfiguraci rozšířil například o
assets, design tokeny, typografii, API konfiguraci a feature flags. U
desítek značek by bylo možné konfiguraci externalizovat a oddělit
brand-specific assets, aby nebylo nutné všechny bramdy distribuovat v
každém bundle. White-label aplikace distribuované přes App Store nebo
Google Play by pravděpodobně používaly také build-time konfiguraci pro
bundle identifiers, ikony, splash screeny, signing a prostředí.

Runtime switcher je pro toto zadání dostačující a umožňuje demonstrovat
tok konfigurace bez zavádění build nebo CI komplexity.

## Refactoring UserProfile

`Refactoring/legacy.tsx` obsahuje dodanou legacy implementaci a
`Refactoring/refactored.tsx` její refaktorovanou verzi.

Původní komponenta má několik problémů: netypované props a state, effect
nereagující na změnu `userId`, chybějící zpracování HTTP a síťových chyb
a žádné rušení nedokončených requestů.

Refaktorovaná implementace přidává:

-   striktní TypeScript typy pro data používaná UI
-   správné dependencies effectu a reakci na změnu `userId`
-   validaci HTTP odpovědi a dat
-   explicitní loading, success a error stavy
-   cleanup pomocí `AbortController` pro zastaralé requesty a unmount
-   ochranu před zastaralými výsledky z již nahrazených requestů
-   oddělení fetching/state logiky od prezentační vrstvy

Fetching funkce, custom hook a komponenta zůstávají v `refactored.tsx`.
Pro toto malé izolované cvičení je logické oddělení v jednom souboru
jednodušší na porovnání s původní verzí. Pokud by se datová logika
používala na více obrazovkách, přesunul bych hook a API service do
samostatných znovupoužitelných modulů.

### Ruční otestování refaktorované komponenty

Refaktorovací část není záměrně připojená k hlavnímu katalogu produktů. Pro
rychlé ruční otestování lze dočasně nahradit obsah `App.tsx` následujícím
kódem:

```tsx
import { useState } from 'react';
import { Button, SafeAreaView, Text, View } from 'react-native';

import UserProfile from './Refactoring/refactored';

export default function App() {
  const [userId, setUserId] = useState(1);

  return (
    <SafeAreaView>
      <View>
        <Text>Current userId: {userId}</Text>

        <Button
          title="User 1"
          onPress={() => setUserId(1)}
        />

        <Button
          title="User 2"
          onPress={() => setUserId(2)}
        />

        <Button
          title="Invalid user"
          onPress={() => setUserId(999999)}
        />

        <UserProfile
          userId={userId}
          onUserFetched={(user) => {
            console.log('Fetched user:', user.firstName);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
```

Tím lze ověřit úvodní načtení uživatele, reakci na změnu `userId`, ruční
refresh, error stav pro neexistujícího uživatele a callback
`onUserFetched`. Rychlým přepínáním mezi User 1 a User 2 lze také ověřit,
že starší request nepřepíše výsledek novějšího requestu.

Po otestování stačí vrátit původní `App.tsx` pro spuštění katalogu produktů.

## Produkční caching a offline podpora

Aktuální aplikace neimplementuje persistentní cache ani offline režim.

V produkci bych rozlišoval mezi cachingem a skutečnou offline podporou.

Pro caching serverových dat a revalidaci by bylo možné použít například
TanStack Query, který poskytuje deduplikaci requestů, práci se
zastaralými daty, refetching a později také server-side infinite
queries, pokud by backend podporoval pagination.

Pro persistenci menšího datasetu by bylo možné použít AsyncStorage. MMKV
je další možností v případě vyšší frekvence přístupů nebo větších
požadavků na úložiště. Persistovaný snapshot posledního úspěšně
načteného katalogu by umožnil zobrazit data při cold startu bez
připojení a následně je po obnovení konektivity revalidovat.

Skutečná offline-first aplikace by navíc vyžadovala rozhodnutí ohledně
lokálních zápisů, fronty mutací, synchronizace, řešení konfliktů a
sledování konektivity. Tyto požadavky jsou mimo rozsah tohoto read-only
katalogu.

## Tisíce dynamicky velkých položek ve FlatList

U výrazně většího seznamu bych použil server-side cursor nebo page-based pagination, aby aplikace nestahovala celý dataset najednou. Na straně UI bych následně využil virtualizaci FlatList, aby se renderovaly pouze aktuálně potřebné položky.

Následně bych aplikaci profiloval před úpravou parametrů virtualizace.
Komponenty jednotlivých řádků by měly zůstat jednoduché, je vhodné
omezit zbytečné rendery a obrázky používat s vhodnými rozměry a
optimalizovanými assets.

Protože karty mohou mít dynamickou výšku, `getItemLayout` není vhodný,
dokud jejich rozměry nejsou předvídatelné. Pokud by profilování ukázalo,
že virtualizace seznamu zůstává problémem i při výrazně větším množství
dat, zvážil bych také alternativy jako FlashList.

## Trade-offs / záměrně jednoduché řešení

-   Client-side incremental loading je použit kvůli tomu, že Fake Store
    API neposkytuje server-side pagination.
-   Není použit globální state management, protože aplikace obsahuje
    malé množství sdíleného stavu; pro aktivní značku je Context
    dostačující.
-   Výběr brandu funguje pouze za běhu aplikace a není persistován.
-   Není zaveden kompletní theme/token systém, protože zadání vyžaduje
    pouze primární barvu brandu a API konfiguraci.
-   Nastavení virtualizace `FlatList` zůstává blízko výchozím hodnotám
    místo optimalizace bez profilování.
-   Offline chování je popsáno jako produkční rozšíření místo částečné
    implementace.
-   Refactoring `UserProfile` zůstává oddělený od aplikace s katalogem
    produktů, protože jde o samostatnou část zadání.
