import os
import requests
import json

def handler(event, context):
    # 1. Get the secrets from environment variables (fixed variable names)
    api_key = os.environ.get("PGUpmuofb_LdL5BVyjEgArfdaKGZXdASK4_VSJ48JbVf")
    project_id = os.environ.get("c2290059-cc28-44c0-bbe8-3a2a1e1c833d")
    
    # Validate that we have the required credentials
    if not api_key or not project_id:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Missing API key or project ID"})
        }
    
    # Get user input from the event (this was missing)
    user_input = event.get('body', '')
    if isinstance(user_input, dict):
        # If body is already parsed as JSON, extract the input field
        user_input = user_input.get('input', '')
    elif user_input:
        # If body is a string, try to parse it as JSON
        try:
            user_input = json.loads(user_input).get('input', '')
        except:
            user_input = ''
    
    if not user_input:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "No input provided"})
        }
    
    # --- Get IBM Cloud IAM token ---
    token_url = "https://iam.cloud.ibm.com/identity/token"
    token_headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    token_data = {
        "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
        "apikey": api_key
    }
    
    try:
        token_response = requests.post(token_url, headers=token_headers, data=token_data)
        token_response.raise_for_status()  # Raises an HTTPError for bad responses
        access_token = token_response.json()["access_token"]
    except requests.exceptions.RequestException as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"Failed to get access token: {str(e)}"})
        }
    
    # --- Prepare the payload for IBM Watsonx ---
    model_id = "ibm/granite-13b-chat-v2"
    api_url = f"https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29"
    
    payload = {
        "model_id": model_id,
        "input": user_input,  # Use the actual user input directly
        "parameters": {
            "decoding_method": "greedy",
            "max_new_tokens": 100,
            "min_new_tokens": 1,
            "repetition_penalty": 1.0
        },
        "project_id": project_id
    }
    
    # Headers for the main API call
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    # --- Submit the request to IBM Watsonx ---
    try:
        response = requests.post(api_url, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        # Extract the generated text (adjust path based on actual API response structure)
        ai_answer = result.get("results", [{}])[0].get("generated_text", "No response generated")
        
    except requests.exceptions.RequestException as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"API request failed: {str(e)}"})
        }
    except (KeyError, IndexError) as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"Unexpected response format: {str(e)}"})
        }
    
    # Return the AI's answer
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps({"answer": ai_answer})
    }