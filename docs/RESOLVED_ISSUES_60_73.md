# Resolved Issues (#60 - #73)

This release resolves the 14 open GitHub issues across the VMS suite:

- **#60**: Fix single female visitor headcount showing `Men: 1, Women: 1` by fixing falsy fallback in display components and adding gender selection handlers.
- **#61 & #70**: Resolve `duplicate key value violates unique constraint "registrations_pass_code_key"` by adding a collision-resistant 6-digit candidate generation loop.
- **#62**: Fix scheduled arrival date picker lock by removing `max={validUntil}` constraint.
- **#63 & #64**: Ensure QR code is only generated and displayed for approved visits, not pending or rejected requests.
- **#65**: Provide direct Approve and Reject buttons with remarks modal on visitor details view.
- **#66**: Resolve >10s page latency by removing N+1 queries in registration vehicles and adding database indexes.
- **#67**: Prevent advance visitor invites from being auto-rejected by restricting timeout cleanup to spot registrations (`registration_type = 'SPOT'`).
- **#68 & #69**: Resolve Temporal Dead Zone crash `ReferenceError: Cannot access 'parsedValidForm' before initialization`.
- **#71 & #72**: Enforce vehicle type selection as mandatory whenever a plate number is entered, and set default vehicle type to `Select`.
- **#73**: Synchronize all 11 vehicle dropdown types in host re-invite modal to match security guard terminal.
