# Archives du football tunisien et africain

Données ouvertes et site public :

- **Ligue 1 tunisienne** : tous les classements finaux depuis 1955-56
- **Ligue des champions de la CAF** : toutes les éditions depuis 1964-65 (Coupe des clubs champions puis Ligue des champions), tous les tours, avec records et historique des records

## Structure

```
data/        CSV (séparateur ;, UTF-8)
  ref/ fact/ meta/   Ligue 1 tunisienne
  caf/               Ligue des champions CAF
docs/        site public (GitHub Pages) et API JSON (docs/api/v1)
scripts/     extraction, construction, contrôles et mise à jour hebdomadaire
```

## API JSON

Gratuite, sans clé : voir `docs/api/v1/index.json` et `docs/api/v1/caf/index.json`.

## Règles

- Ligue des champions : les matchs perdus sur tapis vert, par forfait, annulés ou arrêtés comptent dans le parcours (qui s'est qualifié) mais pas dans les statistiques de matchs et de buts.
- Un club renommé garde tout son historique sous son nom actuel (ex. TP Englebert = TP Mazembe, JE Tizi-Ouzou = JS Kabylie).
- Chaque mise à jour exécute des contrôles automatiques (champions, cumuls, poules, cohérence des classements) ; les écarts restants sont publiés, pas cachés.

## Sources

- [RSSSF – Rec.Sport.Soccer Statistics Foundation](https://www.rsssf.org/) : reprise autorisée avec mention des auteurs
- Wikipédia (CC BY-SA 4.0)

## Mise à jour

Automatique chaque lundi : nouveaux résultats, contrôles, records, puis publication.
