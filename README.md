# ChronoSynapse — Interactive Frontend

An interactive scientific explainer for **streaming memory, state estimation, and synaptic plasticity**, built around a Quantum Clock telemetry pipeline and a BDH-inspired educational memory model.

ChronoSynapse lets learners change experiment parameters and observe how two fundamentally different online memory mechanisms respond to the same A→B→A regime-switching experiment.

---

## Core Question

> How can two different mechanisms compress a stream of information into an evolving internal state — and how do they fail differently?

ChronoSynapse compares:

- **Kalman filtering** — explicit state estimation with uncertainty represented by covariance.
- **BDH-inspired synaptic memory** — dynamically changing synaptic strengths representing short-term associative memory.

The comparison is conceptual and mechanistic, not a claim that the two algorithms are mathematically equivalent.

---

## What the Learner Can Explore

The interface exposes an interactive A→B→A experiment.

### Phase A

A controlled semantic stimulus activates:

`THERMAL + NEGATIVE`

### Phase B

The semantic regime switches to:

`THERMAL + POSITIVE`

### Phase C

The original regime returns:

`THERMAL + NEGATIVE`

The learner can observe the resulting changes in:

- Kalman estimate
- Kalman uncertainty
- Kalman innovation
- Kalman innovation covariance
- Kalman gain
- Synaptic strengths σ(T,N), σ(T,P), and σ(T,M)
- Synaptic difference
- Physical clock detuning
- Recorded physical events

---

## Important Scientific Distinction

ChronoSynapse does **not** claim that Kalman filtering and BDH are the same type of model.

The Kalman branch represents an online state estimator.

**Prediction**

`x(t|t−1) = x(t−1)`

`P(t|t−1) = P(t−1) + Q`

**Kalman gain**

`K(t) = P(t|t−1) / [P(t|t−1) + R]`

**State update**

`x(t) = x(t|t−1) + K(t) × [z(t) − x(t|t−1)]`

The covariance state makes estimation uncertainty explicit.

The synaptic branch instead represents an educational abstraction of short-term synaptic plasticity, where recent activity temporarily changes connection strengths.

This project therefore compares **two forms of evolving internal state**, rather than claiming mathematical equivalence.

---

## BDH Integration

The project uses a **BDH-inspired educational abstraction** rather than an official BDH implementation or official BDH checkpoint.

The abstraction demonstrates the idea that recent activity can be written into synaptic state and subsequently influence future processing.

The controlled semantic stimulus is deliberately separated from the physical Quantum Clock telemetry.

This distinction is important:

- Physical events come from recorded Quantum Clock telemetry.
- Kalman diagnostics are computed from that telemetry during replay.
- The synaptic-memory experiment receives a controlled semantic stimulus.
- The frontend renders the backend's returned results.
- The browser does not fabricate scientific values.

---

## Data and Computation Status

| Component | Status |
|---|---|
| Quantum Clock telemetry | Recorded |
| Physical clock events | Recorded telemetry |
| Kalman diagnostics | Computed during backend replay |
| Kalman estimate | Computed |
| Kalman uncertainty | Computed |
| Synaptic memory | Computed during replay |
| A→B→A semantic stimulus | Controlled experiment |
| BDH mechanism | BDH-inspired educational abstraction |
| Charts | Rendered from backend response |
| Browser-side scientific simulation | Not used |

The public demonstration uses a reproducible replay path rather than requiring the original Quantum Clock hardware/model environment.

---

## The Kalman Golden-Ratio Hook

With the scalar Kalman configuration used by the project:

`Q = R = 10⁻⁸`

the steady-state Kalman gain converges to:

`K∞ = (√5 − 1) / 2 ≈ 0.618034`

which is:

`K∞ = 1 / φ`

where `φ` is the golden ratio.

The frontend exposes the Kalman gain so that the learner can watch this convergence rather than merely being told about it.

---

## Architecture

```text
             ┌─────────────────────────────────────────────┐
             │             React / TypeScript UI           │
             │                                             │
             │  Kalman diagnostics                         │
             │  Synaptic-memory visualization              │
             │  Detuning visualization                     │
             │  Synapse graph                              │
             │  A→B→A timeline                             │
             │  Experiment controls                        │
             └──────────────────────┬──────────────────────┘
                                    │
                                    │ HTTPS REST
                                    ▼
             ┌─────────────────────────────────────────────┐
             │              FastAPI Backend                │
             │                                             │
             │        /api/experiment/replay               │
             └──────────────────────┬──────────────────────┘
                                    │
                                    ▼
             ┌─────────────────────────────────────────────┐
             │          Replay / Scientific Engine         │
             │                                             │
             │  Recorded Quantum Clock telemetry           │
             │  Kalman diagnostics                         │
             │  BDH-inspired synaptic memory               │
             └──────────────────────┬──────────────────────┘
                                    │
                                    ▼
             ┌─────────────────────────────────────────────┐
             │              Pathway substrate              │
             │                                             │
             │       Streaming / replay processing         │
             └─────────────────────────────────────────────┘
```

---

## Frontend Technology

- React
- TypeScript
- TanStack Router
- React Query
- Recharts
- Vite
- Scientific typed data contracts

The frontend is intentionally separated from the scientific backend.

---

## Backend

The frontend communicates with the ChronoSynapse backend through:

```text
/api/experiment/replay
```

The backend is responsible for the experiment computation and returns the observations consumed by the interface.

The frontend therefore does not contain a second implementation of the scientific experiment.

---

## API Configuration

The backend URL is configured through:

```text
VITE_SCIENCE_API_URL
```

Example:

```env
VITE_SCIENCE_API_URL=https://your-backend.example.com
```

Do not include `/api` in the environment variable.

The frontend appends the API route itself.

For local development, the fallback API address is:

```text
http://127.0.0.1:8000
```

---

## Running Locally

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```env
VITE_SCIENCE_API_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

The frontend requires a running ChronoSynapse backend.

Start the backend separately according to its repository instructions.

---

## Production Deployment

The frontend is designed to be deployed independently from the backend.

For a production deployment, configure:

```env
VITE_SCIENCE_API_URL=https://your-production-backend.example.com
```

Because Vite embeds environment variables during the build, changing the environment variable requires a new frontend deployment/build.

---

## Interaction Model

The experiment controls allow the learner to change:

- Learning rate η
- Synaptic decay u
- Phase duration
- Experiment scenario

The backend recomputes the replay and returns the resulting trajectory.

This makes the learner's intervention meaningful: changing the parameters changes the resulting synaptic-memory trajectory.

---

## Reproducibility

The default experiment uses a deterministic recorded-replay pathway.

A typical A→B→A run produces 60 observations when the phase duration is 20 ticks.

The interface displays the returned observation count and latest scientific values.

This makes the central demonstration reproducible without requiring the original physical clock environment.

---

## What Is Actually Live?

The public demo should be understood as a **live interactive replay**, not a live physical atomic clock.

The browser:

1. Sends experiment parameters to the backend.
2. Backend executes the replay.
3. Backend returns the resulting trajectory.
4. Frontend renders the returned observations.
5. Learner changes parameters.
6. The experiment is recomputed.

The underlying physical Quantum Clock telemetry is recorded data.

---

## Research Basis

The project draws on research concerning:

- Dragon Hatchling and brain-inspired sequence processing.
- Short-term synaptic plasticity as working memory.
- Hebbian plasticity and rapid learning.
- Fast weights and linear-transformer connections.

Primary references include:

1. Kosowski et al. (2025),  
   *The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain.*

2. Kozachkov et al. (2022),  
   *Robust and brain-like working memory through short-term synaptic plasticity.*

3. Duan et al. (2023),  
   *Hebbian and Gradient-based Plasticity Enables Robust Memory and Rapid Learning in RNNs.*

Additional research sources and provenance records are maintained with the project documentation.

---

## Limitations

This project deliberately distinguishes demonstration from scientific overclaiming.

### BDH implementation

The synaptic component is a **BDH-inspired educational abstraction**. It should not be interpreted as the official Dragon Hatchling architecture or as a reproduction of an official BDH model checkpoint.

### Physical telemetry

The public replay uses recorded Quantum Clock telemetry rather than a live physical clock.

### Semantic stimulus

The synaptic branch is driven by a controlled semantic A→B→A stimulus. It does not claim that the raw physical clock encoder directly produces the semantic synaptic states.

### Model comparison

Kalman filtering and synaptic plasticity have different mathematical objectives and representations. The comparison concerns their behavior as evolving online internal states, not equivalence.

---

## Provenance

The project separates:

- original project code,
- recorded Quantum Clock telemetry,
- computed replay results,
- controlled experimental stimulus,
- third-party libraries,
- research publications,
- frontend assets.

Third-party software remains subject to its respective licenses.

Pathway is used as a project dependency/runtime and retains its own licensing terms.

Recorded telemetry, model checkpoints, and other inherited project assets should not be assumed to inherit this repository's software license.

---

## AI Assistance and Technical Ownership

AI-assisted development was used during implementation for activities including:

- code scaffolding,
- debugging,
- documentation drafting,
- interface integration,
- experiment implementation support.

The resulting architecture, scientific claims, experiment design, validation, deployment, and technical decisions are project-owned and should be understood and defensible by the project team.

---

## License

The frontend source code is released under the MIT License.

Third-party dependencies, fonts, icons, images, and other external assets retain their respective licenses.

See `LICENSE`.

---

## Related Repository

ChronoSynapse uses a separate backend repository containing the scientific replay engine, FastAPI service, Pathway integration, recorded telemetry, and experiment implementation.

The frontend and backend are intentionally maintained as separate deployable projects.

---

## Project Status

The frontend is an interactive research/education artifact for the DataForge 2026 Pathway track.

The primary objective is not to present a generic AI dashboard, but to make a difficult technical concept observable:

> **Streaming information can be compressed into evolving internal state, but different memory mechanisms retain, adapt, and interfere in fundamentally different ways.**
