#!/usr/bin/env python
"""
Simple script to test if Swagger documentation is accessible.
Run this after starting your Django server.
"""

import requests
import sys

def test_swagger_endpoints():
    """Test if Swagger endpoints are accessible."""
    base_url = "http://localhost:8000"
    
    endpoints_to_test = [
        "/swagger/",
        "/redoc/", 
        "/swagger.json",
        "/api/v1/"
    ]
    
    print("Testing Swagger documentation endpoints...")
    print("=" * 50)
    
    for endpoint in endpoints_to_test:
        url = f"{base_url}{endpoint}"
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                print(f"✅ {endpoint} - OK (Status: {response.status_code})")
            else:
                print(f"❌ {endpoint} - Failed (Status: {response.status_code})")
        except requests.exceptions.ConnectionError:
            print(f"❌ {endpoint} - Connection failed (Is the server running?)")
        except requests.exceptions.Timeout:
            print(f"❌ {endpoint} - Timeout")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Swagger Documentation URLs:")
    print(f"📖 Swagger UI: {base_url}/swagger/")
    print(f"📖 ReDoc: {base_url}/redoc/")
    print(f"📄 OpenAPI JSON: {base_url}/swagger.json")
    print(f"📄 OpenAPI YAML: {base_url}/swagger.yaml")

if __name__ == "__main__":
    test_swagger_endpoints()