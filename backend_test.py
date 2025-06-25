#!/usr/bin/env python3
import requests
import json
import time
import os
from dotenv import load_dotenv
import sys

# Load environment variables from frontend .env file to get the backend URL
load_dotenv("/app/frontend/.env")

# Get the backend URL from environment variables
BACKEND_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BACKEND_URL:
    print("Error: REACT_APP_BACKEND_URL not found in environment variables")
    sys.exit(1)

# Ensure the URL ends with /api
API_URL = f"{BACKEND_URL}/api"
print(f"Using API URL: {API_URL}")

# Test results tracking
test_results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "tests": []
}

def run_test(test_name, test_func):
    """Run a test and track results"""
    test_results["total"] += 1
    print(f"\n{'='*80}\nTEST: {test_name}\n{'='*80}")
    
    try:
        result = test_func()
        if result:
            test_results["passed"] += 1
            test_results["tests"].append({"name": test_name, "status": "PASSED"})
            print(f"✅ PASSED: {test_name}")
            return True
        else:
            test_results["failed"] += 1
            test_results["tests"].append({"name": test_name, "status": "FAILED"})
            print(f"❌ FAILED: {test_name}")
            return False
    except Exception as e:
        test_results["failed"] += 1
        test_results["tests"].append({"name": test_name, "status": "ERROR", "error": str(e)})
        print(f"❌ ERROR: {test_name} - {str(e)}")
        return False

def test_root_endpoint():
    """Test the root API endpoint"""
    response = requests.get(f"{API_URL}/")
    print(f"Response: {response.status_code} - {response.text}")
    
    return (
        response.status_code == 200 and
        "MedAgent API is running" in response.text
    )

def test_health_endpoint():
    """Test the health check endpoint"""
    response = requests.get(f"{API_URL}/health")
    print(f"Response: {response.status_code} - {response.text}")
    
    if response.status_code != 200:
        return False
    
    data = response.json()
    return (
        data.get("status") == "healthy" and
        data.get("database") == "connected" and
        data.get("ai_service") == "ok"
    )

def test_create_session():
    """Test creating a new chat session"""
    response = requests.post(f"{API_URL}/chat/session")
    print(f"Response: {response.status_code} - {response.text}")
    
    if response.status_code != 200:
        return False
    
    data = response.json()
    return (
        "session_id" in data and
        data.get("status") == "created"
    )

def test_get_session():
    """Test retrieving a chat session"""
    # First create a session
    create_response = requests.post(f"{API_URL}/chat/session")
    if create_response.status_code != 200:
        print("Failed to create session for test")
        return False
    
    session_id = create_response.json()["session_id"]
    
    # Now get the session
    response = requests.get(f"{API_URL}/chat/session/{session_id}")
    print(f"Response: {response.status_code} - {response.text}")
    
    if response.status_code != 200:
        return False
    
    data = response.json()
    return (
        "session" in data and
        data["session"]["session_id"] == session_id
    )

def test_profile_management():
    """Test creating and retrieving a user profile"""
    # First create a session
    create_response = requests.post(f"{API_URL}/chat/session")
    if create_response.status_code != 200:
        print("Failed to create session for test")
        return False
    
    session_id = create_response.json()["session_id"]
    
    # Create a profile
    profile_data = {
        "eta": "31-50",
        "genere": "femmina",
        "sintomo_principale": "mal di testa",
        "durata": "2-3_giorni",
        "intensita": 7,
        "sintomi_associati": ["nausea", "sensibilità alla luce"],
        "condizioni_note": ["ipertensione"],
        "familiarita": "emicrania"
    }
    
    create_profile_response = requests.post(
        f"{API_URL}/chat/profile/{session_id}",
        json=profile_data
    )
    print(f"Create Profile Response: {create_profile_response.status_code} - {create_profile_response.text}")
    
    if create_profile_response.status_code != 200:
        return False
    
    # Get the profile
    get_profile_response = requests.get(f"{API_URL}/chat/profile/{session_id}")
    print(f"Get Profile Response: {get_profile_response.status_code} - {get_profile_response.text}")
    
    if get_profile_response.status_code != 200:
        return False
    
    data = get_profile_response.json()
    profile = data.get("profile", {})
    
    return (
        profile and
        profile.get("eta") == "31-50" and
        profile.get("genere") == "femmina" and
        profile.get("sintomo_principale") == "mal di testa"
    )

def test_welcome_message():
    """Test generating a welcome message"""
    # First create a session
    create_response = requests.post(f"{API_URL}/chat/session")
    if create_response.status_code != 200:
        print("Failed to create session for test")
        return False
    
    session_id = create_response.json()["session_id"]
    
    # Create a profile
    profile_data = {
        "eta": "31-50",
        "genere": "femmina",
        "sintomo_principale": "mal di testa"
    }
    
    requests.post(
        f"{API_URL}/chat/profile/{session_id}",
        json=profile_data
    )
    
    # Get welcome message
    response = requests.post(f"{API_URL}/chat/welcome/{session_id}")
    print(f"Response: {response.status_code} - {response.text}")
    
    if response.status_code != 200:
        return False
    
    data = response.json()
    return (
        "message" in data and
        "next_questions" in data and
        "mal di testa" in data["message"]
    )

def test_chat_message():
    """Test sending a chat message and getting AI response"""
    # First create a session
    create_response = requests.post(f"{API_URL}/chat/session")
    if create_response.status_code != 200:
        print("Failed to create session for test")
        return False
    
    session_id = create_response.json()["session_id"]
    
    # Create a profile
    profile_data = {
        "eta": "31-50",
        "genere": "femmina",
        "sintomo_principale": "mal di testa",
        "durata": "2-3_giorni",
        "intensita": 7
    }
    
    requests.post(
        f"{API_URL}/chat/profile/{session_id}",
        json=profile_data
    )
    
    # Send a message
    message_data = {
        "session_id": session_id,
        "message": "Ho un forte mal di testa da due giorni. Il dolore è costante e pulsante."
    }
    
    response = requests.post(
        f"{API_URL}/chat/message",
        json=message_data
    )
    print(f"Response: {response.status_code}")
    print(f"Response content: {response.text[:500]}...")  # Print first 500 chars
    
    if response.status_code != 200:
        return False
    
    data = response.json()
    return (
        "response" in data and
        "urgency_level" in data and
        "next_questions" in data and
        len(data["response"]) > 50  # Ensure we got a substantial response
    )

def test_chat_history():
    """Test retrieving chat history"""
    # First create a session
    create_response = requests.post(f"{API_URL}/chat/session")
    if create_response.status_code != 200:
        print("Failed to create session for test")
        return False
    
    session_id = create_response.json()["session_id"]
    
    # Send a message
    message_data = {
        "session_id": session_id,
        "message": "Ho un forte mal di testa"
    }
    
    requests.post(
        f"{API_URL}/chat/message",
        json=message_data
    )
    
    # Get chat history
    response = requests.get(f"{API_URL}/chat/history/{session_id}")
    print(f"Response: {response.status_code} - {response.text}")
    
    if response.status_code != 200:
        return False
    
    data = response.json()
    return (
        "messages" in data and
        len(data["messages"]) >= 2  # User message and AI response
    )

def test_session_summary():
    """Test getting session summary"""
    # First create a session
    create_response = requests.post(f"{API_URL}/chat/session")
    if create_response.status_code != 200:
        print("Failed to create session for test")
        return False
    
    session_id = create_response.json()["session_id"]
    
    # Create a profile
    profile_data = {
        "eta": "31-50",
        "genere": "femmina",
        "sintomo_principale": "mal di testa"
    }
    
    requests.post(
        f"{API_URL}/chat/profile/{session_id}",
        json=profile_data
    )
    
    # Send a message
    message_data = {
        "session_id": session_id,
        "message": "Ho un forte mal di testa da due giorni"
    }
    
    requests.post(
        f"{API_URL}/chat/message",
        json=message_data
    )
    
    # Get session summary
    response = requests.get(f"{API_URL}/chat/summary/{session_id}")
    print(f"Response: {response.status_code} - {response.text}")
    
    if response.status_code != 200:
        return False
    
    data = response.json()
    return (
        "session_info" in data and
        "conversation_stats" in data and
        "profile_summary" in data and
        "recommendations" in data
    )

def test_close_session():
    """Test closing a session"""
    # First create a session
    create_response = requests.post(f"{API_URL}/chat/session")
    if create_response.status_code != 200:
        print("Failed to create session for test")
        return False
    
    session_id = create_response.json()["session_id"]
    
    # Close the session
    response = requests.post(f"{API_URL}/chat/close/{session_id}")
    print(f"Response: {response.status_code} - {response.text}")
    
    if response.status_code != 200:
        return False
    
    data = response.json()
    return (
        data.get("status") == "closed" and
        data.get("session_id") == session_id
    )

def run_all_tests():
    """Run all tests in sequence"""
    print("\n\n🔍 STARTING MEDAGENT BACKEND API TESTS 🔍\n")
    
    # Basic API tests
    run_test("Root Endpoint", test_root_endpoint)
    run_test("Health Check", test_health_endpoint)
    
    # Session management
    run_test("Create Session", test_create_session)
    run_test("Get Session", test_get_session)
    
    # Profile management
    run_test("Profile Management", test_profile_management)
    
    # Chat functionality
    run_test("Welcome Message", test_welcome_message)
    run_test("Chat Message with AI", test_chat_message)
    run_test("Chat History", test_chat_history)
    
    # Session summary and closing
    run_test("Session Summary", test_session_summary)
    run_test("Close Session", test_close_session)
    
    # Print summary
    print("\n\n📊 TEST SUMMARY 📊")
    print(f"Total Tests: {test_results['total']}")
    print(f"Passed: {test_results['passed']}")
    print(f"Failed: {test_results['failed']}")
    print(f"Success Rate: {(test_results['passed'] / test_results['total']) * 100:.1f}%")
    
    # Print detailed results
    print("\nDetailed Results:")
    for test in test_results["tests"]:
        status = "✅" if test["status"] == "PASSED" else "❌"
        print(f"{status} {test['name']}")
        if test.get("error"):
            print(f"   Error: {test['error']}")
    
    return test_results["failed"] == 0

if __name__ == "__main__":
    run_all_tests()