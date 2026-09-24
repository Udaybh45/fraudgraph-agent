import os
import json
import random
from typing import Dict, Any, List

DATASET_DIR = os.path.dirname(__file__)

def generate_hhgoa_ieee_dataset() -> Dict[str, Any]:
    """
    Generates the IEEE-CIS HHGOA benchmark fraud dataset.
    Spans 180 days (6 months):
    - Months 1-4 (Days 0-120): Historical closed fraud cases for case memory
    - Months 5-6 (Days 121-180): Benchmark cases for evaluation & demo scenarios
    """
    random.seed(42)

    # 1. Historical Cases (Months 1-4)
    historical_cases = [
        {
            "case_id": "HIST-CASE-101",
            "case_number": "HIST-CASE-101",
            "transaction_id": "TXN-HIST-001",
            "day_offset": 14,
            "trigger_reason": "Device Farming Alert - 5 Linked Cards",
            "amount": 1850.00,
            "fraud_pattern": "Device Farming / Multi-Accounting",
            "final_risk_score": 0.89,
            "confidence_score": 0.92,
            "uncertainty_score": 0.08,
            "action": "BLOCK_TRANSACTION",
            "actions": ["BLOCK_TRANSACTION"],
            "outcome": "CONFIRMED_FRAUD",
            "final_resolution": "CONFIRMED_FRAUD",
            "entities": {
                "customer_id": "CUST-H101",
                "account_id": "ACC-H101",
                "device_id": "DEV-FARM-99",
                "ip_address": "194.26.29.11",
                "is_emulator": True,
                "is_vpn": True
            }
        },
        {
            "case_id": "HIST-CASE-102",
            "case_number": "HIST-CASE-102",
            "transaction_id": "TXN-HIST-002",
            "day_offset": 32,
            "trigger_reason": "Rapid Pass-Through Mule Ring Alert",
            "amount": 7400.00,
            "fraud_pattern": "Money Mule Pass-Through Syndicate",
            "final_risk_score": 0.94,
            "confidence_score": 0.95,
            "uncertainty_score": 0.05,
            "action": "ESCALATE_TO_FRAUD_ANALYST",
            "actions": ["ESCALATE_TO_FRAUD_ANALYST", "FILE_REGULATORY_REPORT"],
            "outcome": "CONFIRMED_FRAUD",
            "final_resolution": "CONFIRMED_FRAUD",
            "entities": {
                "customer_id": "CUST-H102",
                "account_id": "ACC-H102",
                "device_id": "DEV-CLEAN-102",
                "ip_address": "185.220.101.5",
                "is_emulator": False,
                "is_vpn": True
            }
        },
        {
            "case_id": "HIST-CASE-103",
            "case_number": "HIST-CASE-103",
            "transaction_id": "TXN-HIST-003",
            "day_offset": 58,
            "trigger_reason": "High-Value Transaction off-baseline",
            "amount": 620.00,
            "fraud_pattern": "Account Takeover",
            "final_risk_score": 0.22,
            "confidence_score": 0.88,
            "uncertainty_score": 0.12,
            "action": "ALLOW_TRANSACTION",
            "actions": ["ALLOW_TRANSACTION"],
            "outcome": "BENIGN_CUSTOMER_ACTIVITY",
            "final_resolution": "BENIGN_CUSTOMER_ACTIVITY",
            "entities": {
                "customer_id": "CUST-H103",
                "account_id": "ACC-H103",
                "device_id": "DEV-MOBILE-103",
                "ip_address": "73.189.44.12",
                "is_emulator": False,
                "is_vpn": False
            }
        },
        {
            "case_id": "HIST-CASE-104",
            "case_number": "HIST-CASE-104",
            "transaction_id": "TXN-HIST-004",
            "day_offset": 84,
            "trigger_reason": "Velocity Burst at Electronics Merchant",
            "amount": 1420.00,
            "fraud_pattern": "Card Testing & Velocity Burst",
            "final_risk_score": 0.81,
            "confidence_score": 0.85,
            "uncertainty_score": 0.15,
            "action": "BLOCK_TRANSACTION",
            "actions": ["BLOCK_TRANSACTION"],
            "outcome": "CONFIRMED_FRAUD",
            "final_resolution": "CONFIRMED_FRAUD",
            "entities": {
                "customer_id": "CUST-H104",
                "account_id": "ACC-H104",
                "device_id": "DEV-WEB-104",
                "ip_address": "45.154.255.8",
                "is_emulator": False,
                "is_vpn": True
            }
        },
        {
            "case_id": "HIST-CASE-105",
            "case_number": "HIST-CASE-105",
            "transaction_id": "TXN-HIST-005",
            "day_offset": 105,
            "trigger_reason": "Step-up Challenge Passed - Legitimate Travel",
            "amount": 950.00,
            "fraud_pattern": "Account Takeover",
            "final_risk_score": 0.18,
            "confidence_score": 0.94,
            "uncertainty_score": 0.06,
            "action": "ALLOW_TRANSACTION",
            "actions": ["ALLOW_TRANSACTION"],
            "outcome": "BENIGN_CUSTOMER_ACTIVITY",
            "final_resolution": "BENIGN_CUSTOMER_ACTIVITY",
            "entities": {
                "customer_id": "CUST-H105",
                "account_id": "ACC-H105",
                "device_id": "DEV-TABLET-105",
                "ip_address": "151.101.65.140",
                "is_emulator": False,
                "is_vpn": False
            }
        }
    ]

    # 2. Benchmark Cases (Months 5-6)
    benchmark_cases = [
        {
            "case_index": 1,
            "benchmark_id": "BENCHMARK-CASE-01",
            "title": "Scenario 1: Definite Device Farming Syndicate (Strong Evidence)",
            "transaction_id": "TXN-BM-1001",
            "day_offset": 135,
            "amount": 2850.00,
            "trigger_reason": "Device Hardware Fingerprint Collision & Emulated Environment",
            "anomaly_score": 0.88,
            "expected_scenario": "Scenario 1: Strong fraud evidence -> agent investigates -> recommends block",
            "simulated_step_up": "FAILED",
            "customer": {
                "id": "CUST-1001",
                "name": "Marcus Vance",
                "risk_score": 0.45,
                "kyc_status": "VERIFIED",
                "chargeback_count": 1
            },
            "account": {
                "id": "ACC-1001",
                "account_number": "4111-XXXX-XXXX-8921",
                "balance": 5200.00,
                "status": "ACTIVE"
            },
            "device": {
                "id": "DEV-FARM-EMU-01",
                "fingerprint": "fp_88a912bfa",
                "device_type": "EMULATOR",
                "os": "Android 9 / Bluestacks",
                "browser": "Chrome Headless 122",
                "is_emulator": True,
                "shared_with_customers": ["CUST-1001", "CUST-0892", "CUST-0441", "CUST-0912"]
            },
            "ip": {
                "id": "IP-TOR-101",
                "ip_address": "185.220.101.22",
                "country": "DE",
                "is_vpn": True,
                "is_tor": True,
                "risk_score": 0.95
            },
            "merchant": {
                "id": "MERCH-LUX-01",
                "name": "Apex Luxury Electronics",
                "category": "High-End Consumer Goods",
                "risk_tier": "HIGH"
            }
        },
        {
            "case_index": 2,
            "benchmark_id": "BENCHMARK-CASE-02",
            "title": "Scenario 2: Ambiguous Risk Resolved via Step-Up Authentication",
            "transaction_id": "TXN-BM-1002",
            "day_offset": 148,
            "amount": 850.00,
            "trigger_reason": "Unrecognized Device with Elevated Behavioral Velocity",
            "anomaly_score": 0.62,
            "expected_scenario": "Scenario 2: Uncertain evidence -> agent requests step-up authentication -> receives failed authentication -> increases confidence -> recommends block/escalation",
            "simulated_step_up": "FAILED",
            "customer": {
                "id": "CUST-1002",
                "name": "Elena Rostova",
                "risk_score": 0.20,
                "kyc_status": "VERIFIED",
                "chargeback_count": 0
            },
            "account": {
                "id": "ACC-1002",
                "account_number": "5500-XXXX-XXXX-3341",
                "balance": 3100.00,
                "status": "ACTIVE"
            },
            "device": {
                "id": "DEV-UNKNOWN-02",
                "fingerprint": "fp_221c90ff",
                "device_type": "MOBILE",
                "os": "iOS 17.4",
                "browser": "Mobile Safari",
                "is_emulator": False,
                "shared_with_customers": ["CUST-1002"]
            },
            "ip": {
                "id": "IP-COMM-02",
                "ip_address": "104.28.192.4",
                "country": "US",
                "is_vpn": True,
                "is_tor": False,
                "risk_score": 0.40
            },
            "merchant": {
                "id": "MERCH-GAME-02",
                "name": "Global Steam Credits",
                "category": "Digital Gaming & Vouchers",
                "risk_tier": "MEDIUM"
            }
        },
        {
            "case_index": 3,
            "benchmark_id": "BENCHMARK-CASE-03",
            "title": "Scenario 3: Suspicious Graph Context with Insufficient Evidence (No Automatic Block)",
            "transaction_id": "TXN-BM-1003",
            "day_offset": 165,
            "amount": 340.00,
            "trigger_reason": "Customer Travel Anomaly - New Subnet & Off-Baseline Spend",
            "anomaly_score": 0.48,
            "expected_scenario": "Scenario 3: Suspicious graph relationships but insufficient evidence -> agent gathers more evidence -> determines appropriate action without automatically blocking",
            "simulated_step_up": "PASSED",
            "customer": {
                "id": "CUST-1003",
                "name": "David Chen",
                "risk_score": 0.15,
                "kyc_status": "VERIFIED",
                "chargeback_count": 0
            },
            "account": {
                "id": "ACC-1003",
                "account_number": "4000-XXXX-XXXX-1190",
                "balance": 8900.00,
                "status": "ACTIVE"
            },
            "device": {
                "id": "DEV-MAC-03",
                "fingerprint": "fp_mac_4091a",
                "device_type": "DESKTOP",
                "os": "macOS Sonoma 14",
                "browser": "Chrome 124",
                "is_emulator": False,
                "shared_with_customers": ["CUST-1003"]
            },
            "ip": {
                "id": "IP-HOTEL-03",
                "ip_address": "172.56.21.99",
                "country": "US",
                "is_vpn": False,
                "is_tor": False,
                "risk_score": 0.25
            },
            "merchant": {
                "id": "MERCH-TRAVEL-03",
                "name": "Grand Hyatt Regency",
                "category": "Hospitality & Lodging",
                "risk_tier": "LOW"
            }
        },
        {
            "case_index": 4,
            "benchmark_id": "BENCHMARK-CASE-04",
            "title": "Scenario 4: High-Value Pass-Through Money Mule Ring",
            "transaction_id": "TXN-BM-1004",
            "day_offset": 172,
            "amount": 9200.00,
            "trigger_reason": "Rapid Pass-Through Chain Exceeding Mandatory SAR Limits",
            "anomaly_score": 0.92,
            "expected_scenario": "High-value mule chain exceeding $5,000 threshold requiring senior analyst review and FinCEN SAR filing",
            "simulated_step_up": "FAILED",
            "customer": {
                "id": "CUST-1004",
                "name": "Arthur Pendelton",
                "risk_score": 0.65,
                "kyc_status": "VERIFIED",
                "chargeback_count": 2
            },
            "account": {
                "id": "ACC-1004",
                "account_number": "4321-XXXX-XXXX-7701",
                "balance": 10500.00,
                "status": "ACTIVE"
            },
            "device": {
                "id": "DEV-WIN-04",
                "fingerprint": "fp_win_7721",
                "device_type": "DESKTOP",
                "os": "Windows 11",
                "browser": "Edge 123",
                "is_emulator": False,
                "shared_with_customers": ["CUST-1004"]
            },
            "ip": {
                "id": "IP-MULE-04",
                "ip_address": "91.240.118.50",
                "country": "NL",
                "is_vpn": True,
                "is_tor": False,
                "risk_score": 0.85
            },
            "merchant": {
                "id": "MERCH-P2P-04",
                "name": "CryptoPay Gateway Liquidity",
                "category": "Virtual Asset Service Provider",
                "risk_tier": "CRITICAL"
            }
        }
    ]

    dataset_bundle = {
        "dataset_name": "HHGOA_IEEE_Fraud_Benchmark",
        "description": "Standardized IEEE-CIS 180-day fraud dataset with historical closed cases and evaluation benchmark set",
        "historical_cases": historical_cases,
        "benchmark_cases": benchmark_cases
    }

    # Save to disk
    out_file = os.path.join(DATASET_DIR, "hhgoa_dataset.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(dataset_bundle, f, indent=2)

    return dataset_bundle

if __name__ == "__main__":
    data = generate_hhgoa_ieee_dataset()
    print(f"Generated HHGOA IEEE dataset with {len(data['historical_cases'])} historical cases and {len(data['benchmark_cases'])} benchmark cases.")
