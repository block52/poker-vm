import requests
import json
from typing import Any, Dict, Optional
from urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)


class RPCClient:
    def __init__(self, url: str):
        """
        Initialize RPC client

        Args:
            url: RPC server URL
            username: Optional username for authentication
            password: Optional password for authentication
        """
        self.url = url
        self.session = requests.Session()

        # Request ID counter
        self.id_counter = 0


    def call_json_rpc(self, method: str, params: Any = None) -> Dict:
        """
        Make a JSON-RPC call

        Args:
            method: The RPC method to call
            params: Parameters to pass to the method
        """
        # Increment request ID
        self.id_counter += 1

        # Prepare the request payload
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params if params is not None else [],
            "id": self.id_counter
        }

        try:
            # Make the request
            response = self.session.post(
                self.url,
                json=payload,
                verify=False  # Note: In production, you should verify SSL
            )

            # Check for HTTP errors
            response.raise_for_status()

            # Parse response
            result = response.json()

            # Check for RPC error
            if "error" in result:
                raise Exception(f"RPC Error: {result['error']}")

            return result["result"]

        except requests.exceptions.RequestException as e:
            raise Exception(f"HTTP Request failed: {str(e)}")
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse JSON response: {str(e)}")
        except Exception as e:
            raise Exception(f"RPC call failed: {str(e)}")
