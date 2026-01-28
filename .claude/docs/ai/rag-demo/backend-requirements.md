# Backend Requirements: RAG Demo

## Context

A **Retrieval-Augmented Generation (RAG) demo** that retrieves relevant documents from a collection based on semantic similarity. Users provide a query, the system finds the most relevant documents, and displays similarity scores. Simple, straightforward document retrieval for demonstration purposes.

---

## Core Functionality

### Document Collection & Retrieval

**Purpose**: Find relevant documents based on semantic similarity to a user query

**Data I need to handle**:

1. **Document Collection**
   - List of documents (text content)
   - Optional: document metadata (ID, title, source, etc.)
   - Optional: pre-computed embeddings or compute on demand

2. **Query Input**
   - User's search query (plain text)
   - Optional: query parameters (e.g., number of results to return)

3. **Embedding Model**
   - Which embedding model to use (currently hardcoded)
   - Model dimensions/specifications
   - Whether to use different models for documents vs. query

4. **Similarity Scores**
   - Ranking of documents by relevance (highest to lowest)
   - Similarity score for each document (percentage or 0-1 range)

**Actions**:
- **Load documents** → Generate embeddings for all documents
- **Accept query** → Generate embedding for query
- **Calculate similarity** → Cosine similarity between query and each document embedding
- **Rank & display** → Show documents sorted by relevance score

**States**:
- **Loading**: Reading and embedding documents
- **Ready**: Documents indexed, ready for queries
- **Processing query**: Computing similarity
- **Displaying results**: Show ranked document list with scores
- **Error**: Missing documents, invalid query, API error

---

## Embedding Model Selection

**Current implementation**: Hardcoded to use one model

**Need from backend**:
- List of available embedding models
- Model specifications (dimensions, language support, use cases)
- Performance characteristics (speed, accuracy, cost)

**Available models**:
- `cohere.embed-multilingual-v3.0` — 1024 dimensions, supports 100+ languages
- `cohere.embed-english-v3.0` — 1024 dimensions, English optimized
- `cohere.embed-english-light-v3.0` — 384 dimensions, faster/lighter

**Questions**:
- Should the embedding model be selectable via CLI arg or env var?
- Are there model compatibility requirements (e.g., certain models only work with certain documents)?
- Should the demo support switching between models for comparison?

---

## Similarity Calculation

**How it works**:
1. Generate embedding for each document
2. Generate embedding for the query
3. Calculate cosine similarity between query embedding and each document embedding
4. Rank documents by similarity score
5. Display with percentage or score

**Need to define**:
- Similarity score format (percentage 0-100%, decimal 0.0-1.0, other?)
- Ranking order (highest first, lowest first?)
- How many results to show by default?
- Should there be a similarity threshold below which results are hidden?

---

## Data Input/Output

### Input

**Format**:
- Document collection (hardcoded in script or loaded from file?)
- Query string (CLI arg or stdin?)

**Questions**:
- Should documents come from a file (JSON, CSV, text)?
- Should the demo support dynamic document loading?
- Can queries come from a file for batch processing?

### Output

**Format**:
- List of documents with similarity scores
- Ordering by relevance
- Display format (table, JSON, plain text?)

**Questions**:
- Should output be human-readable or machine-readable?
- Should there be a flag for different output formats?
- Should full document content be shown or just metadata?

---

## Uncertainties

- [ ] **Embedding model selection** — Should this be hardcoded or configurable?
- [ ] **Similarity threshold** — Should there be a minimum relevance score to show results?
- [ ] **Result count** — Default number of results? Configurable?
- [ ] **Document source** — Hardcoded in script, file input, or dynamic?
- [ ] **Embedding computation** — Should embeddings be cached/stored, or always computed fresh?
- [ ] **Score format** — Percentage, decimal, or both?
- [ ] **Batch processing** — Should the demo support multiple queries in one run?
- [ ] **Performance requirements** — Are there limits on document collection size?

---

## Questions for Backend

1. **Embedding Model Discoverability** — Is there an endpoint to list available embedding models and their specifications?

2. **Model Recommendations** — Which embedding model is best for different use cases (multilingual vs. English, speed vs. accuracy)?

3. **Batch Embeddings** — What's the recommended way to handle embedding many documents? Should I use `embedMany()` and batch them?

4. **Similarity Scoring** — What similarity score format should I expect (0-1 decimal, 0-100 percentage)?

5. **Threshold & Filtering** — Should there be a configurable minimum similarity threshold, or show all results?

6. **Embedding Reuse** — Can embeddings be cached/stored, or should they be computed fresh each run?

7. **Large Collections** — Are there limits on document collection size? Performance characteristics?

8. **Output Format** — Should results be JSON, table, or custom format?

---

## Discussion Log

*Awaiting backend feedback.*

---

## Notes

This is a demonstration of semantic search fundamentals. Keep the implementation straightforward—generate embeddings, calculate similarity, rank results. The focus is on showing how embeddings enable semantic retrieval, not on building a production search engine.
