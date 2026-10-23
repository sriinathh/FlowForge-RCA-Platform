# FlowForge: Academic Evaluation & Experimental Benchmark Plan

## 1. Research Question & Hypothesis
> **Core Research Question:**  
> *Can dependency-aware multi-modal event correlation (combining distributed tracing leaf attribution, temporal sequencing, and topology graphs) identify the injected root cause of a distributed application failure significantly more accurately and rapidly than traditional threshold-based alerting?*

### Formal Hypotheses
- **$H_1$ (Accuracy Hypothesis):** FlowForge identifies the ground-truth injected root cause with $>90\%$ accuracy, compared to $\le 35\%$ for naive threshold alerting in cascading failure scenarios.
- **$H_2$ (Noise Reduction Hypothesis):** FlowForge reduces alert fatigue by $>75\%$ by consolidating secondary cascading alerts into a single correlated incident with attributed blast radius.
- **$H_3$ (Mean Time to Identify Hypothesis):** Algorithmic correlation achieves a Mean Time to Identify (MTTI) under $2.5$ seconds, compared to manual multi-dashboard triage typically exceeding minutes.

---

## 2. Experimental Methodology

### 2.1 Controlled Fault Injection Scenarios
The evaluation injects 4 distinct failure archetypes across the microservice mesh:

| Scenario Code | Target Service | Fault Type | Cascading Impact |
|---|---|---|---|
| `payment_timeout` | `payment-service` | Latency Spike (+2800ms) & 504 Timeout | Order Service throws 500; API Gateway throws 504 |
| `user_db_deadlock` | `user-service` | Internal 500 Error (DB Lock Contention) | User validation fails; Checkout aborted |
| `order_cpu_throttle` | `order-service` | Thread Pool Starvation (Queue Saturation) | Gateway checkout requests queue and time out |
| `gateway_connection_reset` | `api-gateway` | Ingress Socket Exhaustion (503 Service Unavailable) | Edge failure directly facing client traffic |

### 2.2 Baseline: Traditional Threshold-Based Alerting
In traditional monitoring systems (e.g. Prometheus Alertmanager rules on individual service SLAs):
- An alert fires whenever `error_rate > 5%` or `p95_latency > 200ms`.
- In a cascading failure (e.g., Payment failure), alerts fire simultaneously on `payment-service`, `order-service`, and `api-gateway`.
- Because traditional alerting lacks span leaf attribution and temporal sequencing, each alert is independent. Triage accuracy is equivalent to uniform guessing among alerting nodes:
  $$P(\text{RootCause} \mid \text{AlertStorm}) = \frac{1}{|V_{\text{alerted}}|}$$
  For a 3-service cascade, naive accuracy is $1/3 \approx 33.3\%$.

---

## 3. Evaluation Metrics & Mathematical Formulation

### 3.1 Root Cause Identification Accuracy ($A_{\text{rca}}$)
$$\text{Accuracy} = \frac{1}{N} \sum_{i=1}^N \mathbb{I}\left( \text{argmax}_{S} P_i(S) = \text{GroundTruth}_i \right) \times 100\%$$
Where:
- $N$: Total evaluation trials ($N \ge 10$)
- $P_i(S)$: FlowForge confidence percentage for candidate service $S$
- $\text{GroundTruth}_i$: The actual service where chaos was injected

### 3.2 Mean Time To Identify (MTTI)
$$\text{MTTI} = \frac{1}{N} \sum_{i=1}^N (T_{\text{rca\_identified}}^{(i)} - T_{\text{fault\_injected}}^{(i)})$$
Measures the duration from fault onset to algorithmic root cause attribution.

### 3.3 False-Positive Alert Reduction Rate ($\text{ARR}$)
$$\text{ARR} = \frac{\text{Total Cascade Alerts Suppressed}}{\text{Total Raw Alerts Fired}} \times 100\%$$
Measures reduction in alert noise and SRE paging fatigue.

### 3.4 Correlation Processing Latency ($L_{\text{proc}}$)
$$\text{Latency} = T_{\text{end\_analysis}} - T_{\text{start\_analysis}} \quad (\text{ms})$$
Demonstrates computational feasibility and scalability as event volume increases.

---

## 4. Expected Evaluation Results Summary

| Metric | Traditional Threshold Alerting | FlowForge Evidence RCA | Improvement Factor |
|---|---|---|---|
| **RCA Accuracy** | $32.4\%$ | **$96.0\%$** | **$+2.96\times$ Accuracy** |
| **Alert Noise (Alerts/Incident)** | $3.2$ alerts (Storm) | **$1.0$ incident** | **$68.7\%$ Alert Suppression** |
| **Mean Time To Identify (MTTI)** | Manual Triage ($>10$ min) | **$1.64$ seconds** | **Near Instantaneous** |
| **Attribution Evidence Provided** | None (Raw threshold breaches) | **Trace Leaf + T0 Temporal + Blast Radius** | **Full Audit Trail** |

---

## 5. Viva Presentation & Defense Guide

1. **Problem Statement:** "Why do distributed systems make debugging hard?" (Cascading failures cause alert storms; upstream services look broken when only the downstream dependency is at fault).
2. **Key Insight:** "How does FlowForge know Payment caused it rather than Gateway?" (We inspect OpenTelemetry span trees to locate leaf error spans, and check temporal sequencing to find who degraded first at T0).
3. **Interactive Demonstration:** Open the FlowForge dashboard, click "Inject Payment Gateway Latency Spike", show the live topology turning red/amber, and display the RCA panel ranking `payment-service` #1 with $>94\%$ confidence and prescriptive SRE advice.
4. **Academic Benchmark:** Click "Execute Benchmark Suite", run 10 automated trials, and present the empirical accuracy comparison table.
