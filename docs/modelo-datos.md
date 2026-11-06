# Modelo de datos

> Responsable: Daniel Méndez · Work item: CLENA-27 (T-06). Este diagrama es el punto de partida; se actualiza con cada migración.

```mermaid
erDiagram
  USER ||--o{ REFRESH_TOKEN : tiene
  USER ||--o| READER : "es (si es lector)"
  READER ||--o{ LOAN : recibe
  USER ||--o{ LOAN : "registra (personal)"
  WORK ||--o{ COPY : tiene
  WORK }o--o{ AUTHOR : "escrita por"
  WORK }o--o{ SUBJECT : trata
  ROOM ||--o{ SECTION : contiene
  SECTION ||--o{ SHELF : contiene
  SHELF ||--o{ COPY : ubica
  COPY ||--o{ LOAN : "se presta en"
  LOAN ||--o{ NOTIFICATION : genera
  READER ||--o{ AVAILABILITY_ALERT : pide
  WORK ||--o{ AVAILABILITY_ALERT : sobre
  FAQ_NODE ||--o{ FAQ_NODE : "hijos"
  USER ||--o{ HELP_REQUEST : atiende
  USER ||--o{ IMPORT_JOB : ejecuta

  USER {
    uuid id PK
    string email UK
    string passwordHash
    string fullName
    enum role "ADMIN | STAFF | READER"
    bool active
    int failedLogins
    datetime lockedUntil
    datetime createdAt
  }
  REFRESH_TOKEN {
    uuid id PK
    uuid userId FK
    string tokenHash
    uuid familyId
    datetime expiresAt
    datetime revokedAt
  }
  READER {
    uuid id PK
    uuid userId FK "nulo si no tiene cuenta"
    string fullName
    string documentId "opcional"
    string email "opcional"
    string phone "opcional"
    string privacyVersion
    datetime consentAt
    datetime anonymizedAt
  }
  WORK {
    uuid id PK
    string title
    string subtitle
    int year
    string publisher
    string isbn UK "opcional"
    enum materialType "LIBRO | REVISTA | DOCUMENTO | MAPA | OTRO"
    enum format "FISICO | DIGITAL | AMBOS"
    string digitalUrl
    string searchText "normalizado, índice trigram"
    datetime deletedAt
  }
  AUTHOR {
    uuid id PK
    string name
    string normalizedName UK
  }
  SUBJECT {
    uuid id PK
    string name
    string normalizedName UK
  }
  ROOM {
    uuid id PK
    string name
    string mapSvg "opcional (HU-19)"
  }
  SECTION {
    uuid id PK
    uuid roomId FK
    string name
  }
  SHELF {
    uuid id PK
    uuid sectionId FK
    string code
    string mapElementId "opcional (HU-19)"
  }
  COPY {
    uuid id PK
    uuid workId FK
    uuid shelfId FK
    string inventoryCode UK
    enum status "DISPONIBLE | PRESTADO | REPARACION | BAJA"
  }
  LOAN {
    uuid id PK
    uuid copyId FK
    uuid readerId FK
    uuid staffId FK
    datetime loanedAt
    datetime dueAt
    datetime returnedAt
  }
  NOTIFICATION {
    uuid id PK
    uuid loanId FK
    enum type "POR_VENCER | VENCIDO | DISPONIBLE"
    datetime sentAt
    string error
  }
  AVAILABILITY_ALERT {
    uuid id PK
    uuid readerId FK
    uuid workId FK
    datetime createdAt
    datetime notifiedAt
  }
  FAQ_NODE {
    uuid id PK
    uuid parentId FK
    string question
    string answer
    int order
    bool active
    int views
    int helpfulCount
  }
  HELP_REQUEST {
    uuid id PK
    string shortCode
    string location
    string reason
    enum status "ABIERTA | EN_CAMINO | ATENDIDA | EXPIRADA"
    uuid attendedById FK
    datetime createdAt
    datetime updatedAt
  }
  SEARCH_LOG {
    uuid id PK
    string normalizedQuery
    int resultCount
    datetime createdAt
  }
  IMPORT_JOB {
    uuid id PK
    uuid userId FK
    string fileName
    int created
    int updated
    int failed
    json errors
    datetime createdAt
  }
```

## Reglas e índices

| Regla | Cómo se garantiza |
|---|---|
| Un ejemplar solo tiene un préstamo activo | Índice único parcial `LOAN(copyId) WHERE returnedAt IS NULL` + regla de dominio |
| No duplicar autores ni temas | Único en `normalizedName` |
| Código de inventario único | Único en `COPY.inventoryCode` |
| Recordatorio único por préstamo y tipo | Único `NOTIFICATION(loanId, type)` |
| Búsqueda rápida y tolerante | Índice GIN `gin_trgm_ops` sobre `WORK.searchText`, `AUTHOR.normalizedName`, `SUBJECT.normalizedName` |
| Borrado lógico de obras | `WORK.deletedAt`; la búsqueda pública filtra `deletedAt IS NULL` |
| Eliminación de cuenta (Ley 1581) | Se borran o anonimizan los datos de `USER` y `READER`; se conservan los préstamos sin datos personales |
| Sin datos personales en analítica | `SEARCH_LOG` no guarda usuario ni IP |
