# GateRunner
A production-style data science project modeling real-world airport connection risk using probabilistic timing distributions.


![Main Screenshot](gaterunner.png)

GateRunner is a data-driven application that predicts whether a passenger can safely make a flight connection.


## Problem

Passengers often misjudge whether their connection time is sufficient, especially in unfamiliar airports.  
GateRunner estimates the real time required for a connection using operational airport timing models.

## Methodology

The model decomposes connection time into:

- aircraft deplaning time
- terminal transfer time
- security processing time
- operational buffer

Each component uses statistical timing ranges (p50 / p90).

If an airport is not configured, the system uses a generic airport profile to estimate timings.

## Output

Connections are classified as:

- SAFE
- TIGHT
- RISKY

## Run locally

