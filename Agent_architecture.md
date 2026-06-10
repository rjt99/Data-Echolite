                        ┌─────────────────┐
  All file types ──────►│ Ingestion Agent  │
                        └────────┬────────┘
                                 │ routes by type
           ┌──────────┬──────────┼──────────┬──────────┐
           ▼          ▼          ▼          ▼          ▼
     [Doc Parser] [Vision]  [Video]   [Table]   [Text]
      Agent       Agent     Agent     Agent     Agent
           │          │          │          │          │
           └──────────┴──────────┴──────────┴──────────┘
                                 │
                                 ▼
                    ┌─────────────────────┐
                    │ Chunking & Embedding │
                    │       Agent          │
                    └──────────┬──────────┘
                               │ stores to vector DB
                               ▼
                    ┌─────────────────────┐
                    │ Entity & Fact        │
                    │ Extraction Agent     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Cross-Document       │◄── This is the core
                    │ Mapping Agent        │    innovation
                    └──────────┬──────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
             [Conflict]  [Gap]      [Knowledge
             Resolver]   Finder]    Graph Agent]
                    │          │          │
                    └──────────┴──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
             [Query Agent]      [Insight Synthesis
                                      Agent]
                                         │
                                         ▼
                                  [Report Agent]
