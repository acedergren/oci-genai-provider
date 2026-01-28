# Backend Requirements: RAG + Reranking Demo

## Context

An **advanced RAG demo** combining semantic similarity search with semantic reranking. Two-stage pipeline:
1. **Stage 1**: Retrieve candidate documents using embeddings (broad search)
2. **Stage 2**: Rerank candidates for precision (narrow down to best matches)

Demonstrates how reranking can improve relevance accuracy compared to embedding similarity alone.

---

## Core Functionality

### Two-Stage Retrieval Pipeline

**Purpose**: Find the most relevant documents by combining embeddings with reranking for higher precision

### Stage 1: Initial Retrieval

**What happens**:
1. Generate embeddings for all documents
2. Generate embedding for query
3. Calculate cosine similarity scores
4. Retrieve top-K candidates (e.g., K=5)

**Data I need**:
- Document collection
- Query text
- Threshold for top-K selection

**Output**:
- K candidate documents with similarity scores
- List passes to Stage 2

---

### Stage 2: Semantic Reranking

**What happens**:
1. Take the K candidates from Stage 1
2. Apply semantic reranking model to these candidates
3. Get refined relevance scores
4. Return top-N reranked results (e.g., N=3)

**Data I need**:
- Candidates from Stage 1
- Reranking model configuration
- Top-N selection threshold

**Output**:
- Final reranked list with new relevance scores
- Better precision than embedding similarity alone

---

## Comparing the Two Stages

**Current implementation**: Displays both Stage 1 and Stage 2 results side-by-side

**What I need to show**:
1. Initial retrieval results with similarity percentages
2. Reranked results with relevance scores
3. Comparison showing how reranking changed the ranking

**Questions**:
- Should I show all K initial results, or just the final N reranked?
- How should scores from Stage 1 and Stage 2 be displayed (both, just reranked, ratio)?
- Should there be visual indicators showing which documents moved up/down in ranking?

---

## Embedding & Reranking Models

**Current usage**:
- **Embedding model**: `cohere.embed-multilingual-v3.0` (1024 dimensions)
- **Reranking model**: `cohere.rerank-v3.5`

**Need to define**:
- Are these the best choices for the demo?
- Should models be configurable (CLI args or env vars)?
- Are there alternative reranking models?
- What are the trade-offs between different models?

**Questions**:
- Which embedding and reranking model combinations are recommended?
- Should both stages use the same or different models?
- Are there performance characteristics to consider (latency, cost)?

---

## Configuration Parameters

**Need to define**:
- K = Number of candidates to retrieve in Stage 1 (currently hardcoded, e.g., K=5)
- N = Number of results to return after reranking (currently hardcoded, e.g., N=3)

**Questions**:
- Should K and N be configurable via CLI args?
- What are good defaults?
- How do K and N affect result quality and performance?
- Is there an optimal K/N ratio?

---

## Data Input/Output

### Input

**Same as basic RAG demo**:
- Document collection (hardcoded or file-based?)
- Query string
- Configuration parameters (K, N, models)

### Output

**Two-stage display**:
- **Stage 1 Results**: Top-K documents with embedding similarity scores
- **Stage 2 Results**: Reranked documents with final relevance scores
- **Comparison**: How ranking changed between stages

**Questions**:
- Should output show full pipeline progression or just final results?
- Should intermediate scores be shown or hidden?
- What format (table, JSON, structured text)?

---

## Performance & Trade-offs

**Key insight**: Reranking improves precision but costs more (two API calls vs. one)

**Need to clarify**:
- Latency difference between embedding-only vs. embedding+reranking?
- Cost difference?
- When is reranking worth it (collection size, precision requirements)?
- Should the demo show timing information?

**Questions**:
- Should I display execution time for each stage?
- Should I show cost estimates?
- Should there be guidance on when to use reranking?

---

## Uncertainties

- [ ] **Model selection** — Are there other embedding or reranking models to test?
- [ ] **K and N values** — What are optimal values for demonstration?
- [ ] **Configuration** — Should K, N, and models be CLI-configurable?
- [ ] **Output format** — How detailed should the pipeline visualization be?
- [ ] **Performance display** — Should timing and cost be shown?
- [ ] **Threshold tuning** — Should there be configurable thresholds for ranking changes?
- [ ] **Batch queries** — Should the demo support multiple queries for comparison?
- [ ] **Score normalization** — Are Stage 1 and Stage 2 scores comparable directly?

---

## Questions for Backend

1. **Model Combination** — What's the recommended embedding + reranking model pair for optimal results?

2. **Batch Reranking** — What's the most efficient way to rerank K candidates? Can I pass them all at once to `rerank()`?

3. **K & N Tuning** — For a demo, what are good default values for K (initial retrieval) and N (final results)?

4. **Score Interpretation** — How should I interpret scores from Stage 1 vs. Stage 2? Are they on the same scale?

5. **Performance Characteristics** — What's the typical latency difference between embedding-only and embedding+reranking for a typical collection size?

6. **Cost Impact** — Does reranking add significant cost? Should this be factored into demo guidance?

7. **Alternative Approaches** — Are there other ways to combine retrieval and reranking that might be more efficient?

8. **Configuration Flexibility** — Should K and N be adjustable for experimentation, or fixed for the demo?

---

## Discussion Log

*Awaiting backend feedback.*

---

## Notes

This demo shows a powerful pattern: use embeddings for broad retrieval, then rerank for precision. It's a practical approach for improving search quality without needing massive document collections. Focus on clarity in showing the two stages and their impact on ranking.
