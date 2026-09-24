from tools.graph_tools import (
    search_customer_history,
    get_transaction_details,
    trace_device_connections,
    trace_ip_connections,
    trace_account_relationships,
    trace_transaction_network,
    detect_fraud_patterns,
    calculate_graph_risk
)

from tools.case_tools import (
    create_case,
    update_case,
    find_similar_fraud_cases,
    retrieve_fraud_policy,
    retrieve_fraud_typology,
    update_case_memory
)

from tools.evidence_tools import (
    add_case_evidence,
    request_customer_verification,
    request_step_up_authentication
)

from tools.action_tools import (
    check_action_permission,
    recommend_next_best_action,
    request_human_approval,
    execute_simulated_action
)

ALL_TOOLS = {
    "search_customer_history": search_customer_history,
    "get_transaction_details": get_transaction_details,
    "trace_device_connections": trace_device_connections,
    "trace_ip_connections": trace_ip_connections,
    "trace_account_relationships": trace_account_relationships,
    "trace_transaction_network": trace_transaction_network,
    "detect_fraud_patterns": detect_fraud_patterns,
    "calculate_graph_risk": calculate_graph_risk,
    "find_similar_fraud_cases": find_similar_fraud_cases,
    "retrieve_fraud_policy": retrieve_fraud_policy,
    "retrieve_fraud_typology": retrieve_fraud_typology,
    "create_case": create_case,
    "update_case": update_case,
    "add_case_evidence": add_case_evidence,
    "request_customer_verification": request_customer_verification,
    "request_step_up_authentication": request_step_up_authentication,
    "check_action_permission": check_action_permission,
    "recommend_next_best_action": recommend_next_best_action,
    "request_human_approval": request_human_approval,
    "execute_simulated_action": execute_simulated_action,
    "update_case_memory": update_case_memory
}
