# Workflows

## 9-stage report lifecycle

| Stage | Status                | Trigger                                               |
| ----- | --------------------- | ----------------------------------------------------- |
| 1     | `pending_validation`  | Citizen submits report                                |
| 2     | `community_validated` | Vote threshold + government verification              |
| 3     | `bidding_open`        | Government approves and opens bidding                 |
| 4     | `bid_awarded`         | Winning bid selected (40-30-30 scoring)               |
| 5     | `funded`              | Escrow funded by government                           |
| 6     | `in_progress`         | Contractor begins milestones                          |
| 7     | `verification`        | Citizen + government verify milestone                 |
| 8     | `payment_released`    | Escrow disburses milestone payment                    |
| 9     | `completed`           | All milestones paid + final acceptance                |

`WorkflowGuardService` blocks non-sequential transitions. Status display is centralized in `src/utils/workflowStatusDisplay.ts`.

## Bidding scoring (Kenya PPADA-compliant)

```
total_score = 0.40 * technical_score
            + 0.30 * price_score
            + 0.30 * experience_score
            + agpo_bonus  (if AGPO-reserved tender)
```

## Milestone enforcement

Milestones progress through `pending → in_progress → submitted → verified → paid` and are strictly sequential — no skipping allowed.

## Auto-triggers

- LPO PDF generated on bid acceptance
- Notifications fan-out via `notifications` table on every lifecycle transition
- Realtime subscriptions push updates to all relevant role dashboards

See `mem://workflow/*` for detailed business rules.
