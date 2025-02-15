#!/usr/bin/env python3 

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from typing import Tuple, Dict

class ECDHKeyExchange:
    def __init__(self):
        """Initialize with SECP256K1 curve, commonly used in blockchain applications"""
        self.curve = ec.SECP256K1()
        
    def generate_keypair(self) -> Tuple[ec.EllipticCurvePrivateKey, ec.EllipticCurvePublicKey]:
        """
        Generate a new ECDH keypair.
        
        Returns:
            Tuple containing (private_key, public_key)
        """
        private_key = ec.generate_private_key(self.curve)
        public_key = private_key.public_key()
        return private_key, public_key
    
    def serialize_public_key(self, public_key: ec.EllipticCurvePublicKey) -> bytes:
        """
        Serialize a public key to bytes for network transmission.
        
        Args:
            public_key: The public key to serialize
            
        Returns:
            bytes: Serialized public key
        """
        return public_key.public_bytes(
            encoding=ec.Encoding.X962,
            format=ec.PublicFormat.CompressedPoint
        )
    
    def deserialize_public_key(self, key_bytes: bytes) -> ec.EllipticCurvePublicKey:
        """
        Deserialize a public key from bytes.
        
        Args:
            key_bytes: Serialized public key bytes
            
        Returns:
            EllipticCurvePublicKey: Deserialized public key
        """
        return ec.EllipticCurvePublicKey.from_encoded_point(self.curve, key_bytes)
    
    def derive_shared_secret(self, 
                           private_key: ec.EllipticCurvePrivateKey,
                           peer_public_key: ec.EllipticCurvePublicKey) -> bytes:
        """
        Derive the shared secret using ECDH.
        
        Args:
            private_key: Local private key
            peer_public_key: Peer's public key
            
        Returns:
            bytes: Derived shared secret
        """
        # Perform the ECDH key exchange
        shared_key = private_key.exchange(ec.ECDH(), peer_public_key)
        
        # Derive final shared secret using HKDF
        derived_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'poker_game_shared_secret'
        ).derive(shared_key)
        
        return derived_key

class PokerPlayer:
    def __init__(self, player_id: str):
        """
        Initialize a poker player with ECDH capabilities.
        
        Args:
            player_id: Unique identifier for the player
        """
        self.player_id = player_id
        self.ecdh = ECDHKeyExchange()
        self.private_key, self.public_key = self.ecdh.generate_keypair()
        
    def get_public_key_bytes(self) -> bytes:
        """Get serialized public key to share with other players"""
        return self.ecdh.serialize_public_key(self.public_key)
    
    def compute_shared_secret(self, other_players_keys: Dict[str, bytes]) -> bytes:
        """
        Compute the shared secret using all players' public keys.
        
        Args:
            other_players_keys: Dict mapping player IDs to their serialized public keys
            
        Returns:
            bytes: Final shared secret combining all players' contributions
        """
        # Initialize shared secret with a dummy value
        final_secret = b'\x00' * 32
        
        # Combine shared secrets from all players
        for player_id, key_bytes in other_players_keys.items():
            if player_id != self.player_id:
                peer_public_key = self.ecdh.deserialize_public_key(key_bytes)
                shared_secret = self.ecdh.derive_shared_secret(self.private_key, peer_public_key)
                # XOR combine the secrets
                final_secret = bytes(a ^ b for a, b in zip(final_secret, shared_secret))
        
        return final_secret

def demo_key_exchange():
    # Example usage with three players
    player1 = PokerPlayer("player1")
    player2 = PokerPlayer("player2")
    player3 = PokerPlayer("player3")
    
    # Collect public keys
    public_keys = {
        "player1": player1.get_public_key_bytes(),
        "player2": player2.get_public_key_bytes(),
        "player3": player3.get_public_key_bytes()
    }
    
    # Each player computes the shared secret
    secret1 = player1.compute_shared_secret(public_keys)
    secret2 = player2.compute_shared_secret(public_keys)
    secret3 = player3.compute_shared_secret(public_keys)
    
    # Verify all players derived the same secret
    assert secret1 == secret2 == secret3
    return secret1.hex()

if __name__ == "__main__":
    shared_secret = demo_key_exchange()
    print(f"Derived shared secret: {shared_secret}")