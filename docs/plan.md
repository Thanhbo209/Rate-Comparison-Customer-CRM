Absolutely. I'll stick to the uploaded specification and reorganize its proposed functionality into a clean **MVP roadmap**, assuming the implementation starts with **Next.js + TypeScript**. The source itself proposes four MVP stages; I'm preserving that structure while making the boundaries clearer. FWD_Rate_Comparison_Customer_CR…

# FWD Rate Comparison & Customer CRM

## Product goal

A **Freight Forwarder Sales Platform** that connects the entire workflow:

```text
Customer
   ↓
Shipment Inquiry
   ↓
Rate Check / RFQ
   ↓
Ask Multiple Agents
   ↓
Normalize Charges
   ↓
Compare Total Cost + Service
   ↓
Select Buying Option
   ↓
Calculate Selling Rate + GP
   ↓
Quotation
   ↓
Follow-up
   ↓
Won / Lost
   ↓
Historical Data & Analytics
```

The goal is explicitly **not just to create a better-looking rate spreadsheet**, but to connect rate comparison, customer history, pricing, quotation, and sales follow-up. FWD_Rate_Comparison_Customer_CR…

---

# MVP 1 — Core Rate Comparison

### Goal

Build the **core engine** that solves the most important problem:

> "Given one shipment request and multiple agent quotations, what is the real total cost and which option is best?"

This is the foundation of the entire product.

---

## 1. Basic Organization / User

Since we're thinking about a larger product rather than only a private tool, start with the basic application user structure.

```text
Organization
 └── Users
```

For the first MVP:

- User authentication
- Basic user profile
- Basic organization/company
- User belongs to organization
- Basic role

The original specification defines Sales, Sales Manager and Admin roles. FWD_Rate_Comparison_Customer_CR…

---

## 2. Customer

Basic Customer database:

- Create customer
- Edit customer
- View customer
- Search customer
- Customer company information
- Active / inactive
- Sales owner

Don't build the entire CRM yet.

---

## 3. Agent

Basic Agent database:

- Agent company
- Country
- Address
- Website
- Contacts
- Supported routes
- Supported modes

The specification defines the Agent database separately from customers. FWD_Rate_Comparison_Customer_CR…

---

# 4. Rate Check / RFQ

This is the **main MVP feature**.

Sales creates:

```text
Rate Check
├── Customer
├── Contact
├── Mode
├── Routing
├── Cargo
├── Equipment
├── Commercial
└── Timeline
```

Supported modes:

- Ocean FCL
- Ocean LCL
- Air
- Trucking

Shipment information includes:

- Place of Receipt
- POL
- POD
- Final Destination
- Commodity
- Package
- Weight
- CBM
- DG / Non-DG
- Equipment
- Quantity
- Incoterm
- Currency
- Cargo Ready Date
- Requested ETD
- Requirements

These fields come directly from the Rate Check specification. FWD_Rate_Comparison_Customer_CR…

---

# 5. Multiple Agent Quotes

One RFQ:

```text
                 RFQ
                  │
       ┌──────────┼──────────┐
       ↓          ↓          ↓
    Agent A    Agent B    Agent C
       │          │          │
      Quote      Quote      Quote
```

Each quote contains:

### Main Freight

- Ocean/Air/Truck freight
- Basis
- Currency

### Origin charges

- THC
- DOC
- Seal
- Handling
- Customs
- Trucking
- VGM
- etc.

### Destination charges

- DTHC
- D/O
- Handling
- Customs
- Delivery

### Other charges

- ENS/AMS/ISF
- Telex release
- Peak season
- Bunker
- Security
- etc.

### Service

- Carrier/Airline
- Vessel/Flight
- Routing
- Direct/Transshipment
- Transit time

### Commercial

- Validity
- Payment term
- Free time
- Cancellation/amendment notes

The source explicitly requires multiple Agent Quotes under one Rate Check. FWD_Rate_Comparison_Customer_CR…

---

# 6. Charge Master

This is one of the most important pieces of the system.

Different agents may call the same charge different things.

Example:

```text
"THC"
"Terminal Handling"
"Terminal Handling Charge"
```

should map to:

```text
THC
```

Build:

```text
ChargeCode
ChargeAlias
Unit
```

Standard units include:

- Per container
- Per BL
- Per shipment
- Per W/M
- Per kg
- Per CBM
- Percentage

The specification explicitly calls for standardized charge codes and aliases. FWD_Rate_Comparison_Customer_CR…

---

# 7. Currency Conversion

Support multiple currencies:

```text
USD
VND
EUR
...
```

For every charge:

```text
Original Currency
Original Value
Exchange Rate
Converted Currency
Converted Value
```

Important:

> Keep the original value for auditability.

The specification explicitly requires retaining both original and converted values. FWD_Rate_Comparison_Customer_CR…

---

# 8. Total Buying Cost

Normalize:

```text
Origin Cost
+
Main Freight
+
Destination Cost
+
Other Cost
=
Total Buying Cost
```

Then:

```text
Agent A → $2,045
Agent B → $2,070
Agent C → $2,010
```

---

# 9. Missing Charge Detection

The system checks:

```text
Expected charge
        ↓
Present?
        ↓
 ┌──────┴──────┐
 YES           NO
 │              │
OK          Warning
```

Also detect:

- Subject to
- Not Confirmed
- Missing required information

**Critical rule:**

```text
Not confirmed ≠ $0
```

The specification explicitly states that the system must not silently assume missing charges are zero. FWD_Rate_Comparison_Customer_CR…

---

# 10. Rate Comparison

The comparison screen should show:

| | Agent A | Agent B | Agent C |
|---|---:|---:|---:|
| Total Cost | $2,045 | $2,070 | $2,010 |
| Transit | 29 days | 35 days | 31 days |
| Routing | Direct | T/S | Direct |
| Free Time | 14 days | 7 days | 10 days |
| Validity | 20/10 | 18/10 | 30/10 |
| Payment | 15 days | Prepaid | 30 days |

Then:

- Best Price
- Best Service
- Best Overall
- Charge breakdown
- Missing-charge warnings
- Manual selection

The source explicitly says the scoring system should **assist**, not force, the Sales decision. FWD_Rate_Comparison_Customer_CR…

---

## MVP 1 outcome

At the end of MVP 1, you should be able to do:

```text
Customer
   ↓
Create RFQ
   ↓
Add 3 Agents
   ↓
Enter 3 Quotes
   ↓
Normalize Charges
   ↓
Convert Currency
   ↓
Detect Missing Charges
   ↓
Compare Total Cost
   ↓
Select Buying Option
```

**This is the first real product.**

---

# MVP 2 — Sales Pricing + CRM

### Goal

Turn the rate-comparison engine into an actual **Sales workflow**.

The source describes MVP 2 as Contacts, Logistics Profile, Activity/Follow-up, Selling Rate, GP, Quotation and Won/Lost. FWD_Rate_Comparison_Customer_CR…

---

# 1. Full Customer CRM

Customer profile:

```text
Customer
├── Company Information
├── Contacts
├── Logistics Profile
├── Activities
├── Follow-ups
├── Opportunities
├── Rate Checks
├── Quotations
├── Rate History
└── Notes
```

The customer becomes the central relationship object. FWD_Rate_Comparison_Customer_CR…

---

# 2. Customer Contacts

Store:

- Name
- Position
- Department
- Phone
- Email
- Zalo
- WhatsApp
- LinkedIn
- Notes
- Main Contact
- Decision Maker
- Working Contact
- Influencer

Contacts can then be selected when creating an RFQ or quotation. FWD_Rate_Comparison_Customer_CR…

---

# 3. Customer Logistics Profile

Store recurring customer preferences:

```text
Commodity
POL / POR
POD
Equipment
Volume
Incoterm
Preferred Carrier
Service Requirement
Payment Preference
Target Rate
```

Then when Sales creates an RFQ:

```text
Select Customer
      ↓
Load customer's usual information
      ↓
Sales modifies it for this shipment
```

The shipment modification should **not automatically change the master customer profile**. FWD_Rate_Comparison_Customer_CR…

---

# 4. Sales Activity

Timeline:

```text
Oct 01 — Call
Oct 03 — Email
Oct 05 — Meeting
Oct 06 — RFQ
Oct 07 — Quotation
Oct 09 — Follow-up
```

Supported activities:

- Call
- Email
- Meeting
- Visit
- Zalo
- WhatsApp
- Note

FWD_Rate_Comparison_Customer_CR…

---

# 5. Follow-up

Statuses:

```text
Upcoming
Today
Overdue
Completed
```

Follow-up can belong to:

- Customer
- Contact
- Quotation
- Opportunity

FWD_Rate_Comparison_Customer_CR…

---

# 6. Selling Rate & GP

After selecting:

```text
Buying Option
      ↓
Pricing
```

Support:

- Markup %
- Target Profit
- Target Margin
- Manual Sell

Calculate:

```text
Revenue
Cost
Gross Profit
GP Margin
```

Warnings:

```text
Selling < Cost
       ↓
    WARNING
```

and:

```text
GP < Company Threshold
       ↓
    WARNING
```

FWD_Rate_Comparison_Customer_CR…

---

# 7. Quotation

Create quotation from selected buying/selling rate.

Quotation contains:

- Customer
- Contact
- Lane
- Commodity
- Equipment
- Service
- Rate
- Surcharge
- Validity
- Remarks

Statuses:

```text
Draft
Sent
Pending
Won
Lost
Expired
Cancelled
```

Also maintain quotation versions when the price changes. FWD_Rate_Comparison_Customer_CR…

---

# 8. Won / Lost

When quotation ends:

```text
Won
```

or:

```text
Lost
```

Lost reasons:

- Price too high
- Incumbent forwarder
- Transit time
- Free time
- Payment term
- No shipment / postponed
- Competitor
- Other

FWD_Rate_Comparison_Customer_CR…

---

# MVP 2 outcome

Now the workflow becomes:

```text
Customer
   ↓
Contact
   ↓
RFQ
   ↓
Agent Quotes
   ↓
Comparison
   ↓
Buying Rate
   ↓
Selling Rate
   ↓
GP
   ↓
Quotation
   ↓
Follow-up
   ↓
Won / Lost
```

At this point you have a **real Sales product**, not merely a rate calculator.

---

# MVP 3 — Intelligence & Analytics

### Goal

Use accumulated data to help Sales and managers make better decisions.

The source lists historical rate, agent ranking, lane/customer reports, opportunities and expiry alerts for this stage. FWD_Rate_Comparison_Customer_CR…

---

# 1. Historical Rate Database

Store:

```text
Lane
Agent
Carrier
Equipment
Rate
Date
Validity
Currency
```

Search by:

- POL/POD
- Mode
- Equipment
- Agent
- Carrier
- Commodity
- Date

Also distinguish:

```text
VALID
EXPIRED
```

Expired historical rates must not be treated as current rates. FWD_Rate_Comparison_Customer_CR…

---

# 2. Agent Performance

Track:

- Response speed
- Rate competitiveness
- Service quality
- Claim handling
- Quote-to-win contribution
- Selected rate count
- Performance by lane

FWD_Rate_Comparison_Customer_CR…

---

# 3. Customer Insights

For each customer:

```text
Top Routes
Average Volume
Average GP
GP Margin
Win Rate
Preferred Carrier
Best Agent
Rate Sensitivity
```

FWD_Rate_Comparison_Customer_CR…

---

# 4. Opportunities

Track:

```text
Opportunity
├── Customer
├── Lane
├── Estimated Volume
├── Shipment Frequency
├── Target GP
├── Potential Monthly GP
├── Potential Annual GP
└── Stage
```

Stages:

```text
New
Qualified
Quoting
Negotiating
Won
Lost
On Hold
```

FWD_Rate_Comparison_Customer_CR…

---

# 5. Dashboard

Now the dashboard becomes useful because there is real data behind it.

### Sales

- Open Rate Checks
- Awaiting Agent
- Expiring Rates
- Quotes Sent
- Won/Lost
- Today's Follow-ups

### Manager

- Sales performance
- Customer performance
- Agent performance
- Lane performance
- Revenue
- GP
- Win/Loss

The specification defines these reporting categories explicitly. FWD_Rate_Comparison_Customer_CR…

---

# 6. Alerts

Examples:

```text
Rate expires tomorrow
        ↓
      Alert

Follow-up overdue
        ↓
      Alert

Missing charge
        ↓
      Alert

Quotation expires soon
        ↓
      Alert

Selling below cost
        ↓
      Alert
```

The source lists these alert types directly. FWD_Rate_Comparison_Customer_CR…

---

# MVP 3 outcome

Now your system starts becoming a **decision-support platform**:

```text
Historical Data
      +
Current Rates
      +
Agent Performance
      +
Customer History
      +
Sales Results
      ↓
Intelligence
```

---

# MVP 4 — Automation & AI

### Goal

Remove repetitive manual data entry.

The source explicitly puts Excel/PDF/screenshot/email import, AI extraction, charge mapping and advanced recommendations here. FWD_Rate_Comparison_Customer_CR…

---

# 1. Upload Agent Rate

Instead of:

```text
PDF
 ↓
Human reads
 ↓
Human types 30 fields
```

you get:

```text
PDF / Excel / Screenshot
          ↓
      AI / OCR
          ↓
   Structured Rate
          ↓
 Charge Normalization
          ↓
 Validation
          ↓
 Human Confirmation
          ↓
 Agent Quote
```

---

# 2. AI Rate Extraction

Extract:

- POL
- POD
- Equipment
- Freight
- Local charges
- Carrier
- Validity
- Transit time
- Free time
- Remarks

Then map the extracted charge names into the company's Charge Master. FWD_Rate_Comparison_Customer_CR…

---

# 3. Confidence & Validation

Example:

```text
THC
$180
Confidence: 98%     ✓

DOC
$50
Confidence: 96%     ✓

DTHC
?
Confidence: 51%     ⚠ Review
```

The Sales user confirms before the data becomes official.

That's important because the specification explicitly requires low-confidence fields to be reviewed and prevents AI from automatically overwriting confirmed data. FWD_Rate_Comparison_Customer_CR…

---

# 4. Advanced Recommendations

Eventually:

```text
Current RFQ
    ↓
Historical Rates
    +
Agent Performance
    +
Customer Requirements
    +
Current Quotes
    +
Pricing Rules
    ↓
Recommended Buying Option
```

But Sales should still be able to override the recommendation and provide a reason. FWD_Rate_Comparison_Customer_CR…

---

# Final roadmap

```text
┌──────────────────────────────────────────────┐
│ MVP 1 — CORE RATE COMPARISON                 │
│                                              │
│ Organization / Users                         │
│ Customer                                     │
│ Agent                                        │
│ Rate Check / RFQ                             │
│ Multiple Agent Quotes                        │
│ Charge Master                                │
│ Currency Conversion                          │
│ Total Cost                                   │
│ Missing Charge Detection                     │
│ Rate Comparison                              │
│ Select Buying Option                         │
└──────────────────────┬───────────────────────┘
                       ↓
┌──────────────────────────────────────────────┐
│ MVP 2 — SALES CRM + PRICING                 │
│                                              │
│ Customer Contacts                            │
│ Logistics Profile                            │
│ Activities                                   │
│ Follow-ups                                   │
│ Opportunities                                │
│ Selling Rate                                 │
│ GP / Margin                                  │
│ Quotations                                   │
│ Won / Lost                                   │
└──────────────────────┬───────────────────────┘
                       ↓
┌──────────────────────────────────────────────┐
│ MVP 3 — INTELLIGENCE                         │
│                                              │
│ Historical Rates                             │
│ Agent Performance                            │
│ Customer Insights                            │
│ Opportunities Analytics                      │
│ Lane Analytics                               │
│ Sales Reports                                │
│ GP / Revenue Reports                         │
│ Alerts                                       │
└──────────────────────┬───────────────────────┘
                       ↓
┌──────────────────────────────────────────────┐
│ MVP 4 — AI + AUTOMATION                      │
│                                              │
│ Excel Import                                 │
│ PDF Import                                   │
│ Screenshot Import                            │
│ Email/Rate Extraction                        │
│ OCR                                          │
│ AI Charge Mapping                            │
│ Confidence Checking                          │
│ Human Confirmation                           │
│ Advanced Recommendations                     │
└──────────────────────────────────────────────┘
```

## Tech foundation

Start the whole thing with:

```text
Next.js
TypeScript
React
Tailwind CSS
shadcn/ui
PostgreSQL
Prisma
```

Then add infrastructure **only when the MVP requires it**:

```text
MVP 1
Next.js + PostgreSQL + Prisma

MVP 2
+ Authentication
+ Organization / RBAC
+ File storage

MVP 3
+ Background jobs
+ Caching
+ Analytics

MVP 4
+ AI API
+ OCR / document processing
+ Queue/workers
+ Object storage
```

### The key boundary

I would **not** start implementing MVP 1 by building the Dashboard.

Start with the **domain**:

```text
Customer
Agent
RateCheck
AgentQuote
AgentQuoteCharge
ChargeCode
Currency
```

Then implement the core calculation:

```text
Agent Quotes
      ↓
Normalize Charges
      ↓
Convert Currency
      ↓
Calculate Total Cost
      ↓
Detect Missing Charges
      ↓
Compare Agents
      ↓
Select Buying Option
```

If this engine is correct, everything else—CRM, quotation, analytics and eventually AI—can build on top of it. The source's own "must-have" list confirms that these are the core functions that make the first version genuinely useful. FWD_Rate_Comparison_Customer_CR…