# Reasoning

## 1. Problem Understanding

The organiser needs to manage a shared gift pool where all participants are expected to contribute equally. In practice, participants may pay nothing, pay partially, pay their full share, or pay extra on behalf of someone else.

The application therefore needs to answer three main questions:

1. What is each person's fair share?
2. How much has each person paid and how much do they owe or should receive?
3. At the end, who should pay whom to settle the pool?

## 2. Core Model

For a pool with budget `B` and `N` participants:

`fair share = B / N`

For each participant:

`balance = total paid - fair share`

A negative balance means the participant owes money. A positive balance means the participant is owed money.

## 3. MVP Prioritisation

The implementation prioritises:

- Pool creation
- Participant management
- Payment recording
- Automatic share calculation
- Collection progress
- Balance visibility
- Settlement generation

These features directly address the organiser's repeated questions.

## 4. Data Model

Three tables are sufficient:

### pools

Stores the gift pool name and budget.

### members

Stores participants belonging to a pool.

### payments

Stores each payment separately. Keeping payments as individual records allows multiple contributions by the same person and preserves a useful payment history.

## 5. Settlement Algorithm

The settlement plan separates participants into:

- Debtors: balance < 0
- Creditors: balance > 0

A greedy matching algorithm repeatedly matches the first debtor with the first creditor using the smaller of their outstanding amounts.

This produces a simple set of transfers without requiring an unnecessarily complex optimisation algorithm.

## 6. Design Decisions

### SQLite

SQLite was chosen because it provides persistent storage without requiring an external database server. This is appropriate for a time-limited coding exercise.

### React

React allows the dashboard to be split into small components and provides quick UI iteration.

### Express

Express provides a lightweight REST API that is easy to implement and debug during the 2.5-hour constraint.

## 7. Assumptions

- All participants have equal shares.
- Payments are recorded manually by the organiser.
- A participant can make multiple payments.
- Overpayment is allowed.
- The budget is the target amount for the gift.
- The application does not process real money.

## 8. Trade-offs

Authentication and real payment gateways were intentionally not implemented because they are not necessary to demonstrate the core contribution and settlement workflow.

The MVP favours correctness and clarity over a large feature set.
