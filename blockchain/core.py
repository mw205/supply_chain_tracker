import hashlib
import time
import json

class Block:
    def __init__(self, index, timestamp, data, previous_hash, nonce=0):
        self.index = index
        self.timestamp = timestamp
        self.data = data  # Supply chain event data
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        """Calculates the hash of the block."""
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()

    def mine_block(self, difficulty):
        """
        Mines a new block by finding a hash that meets the difficulty criteria.
        A simple Proof of Work implementation.
        """
        target = '0' * difficulty
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()
        print(f"Block mined: {self.hash}")


class Blockchain:
    def __init__(self, difficulty=2): # Difficulty for Proof of Work
        self.chain = [self.create_genesis_block()]
        self.difficulty = difficulty
        self.pending_transactions = [] # In a more complex system, these would be actual transactions

    def create_genesis_block(self):
        """Creates the first block in the blockchain."""
        return Block(0, time.time(), "Genesis Block - Supply Chain Start", "0")

    def get_latest_block(self):
        """Returns the most recent block in the chain."""
        return self.chain[-1]

    def add_block(self, new_data):
        """
        Mines and adds a new block to the chain containing the new_data.
        For simplicity, new_data here will be a supply chain event.
        """
        latest_block = self.get_latest_block()
        new_block = Block(
            index=latest_block.index + 1,
            timestamp=time.time(),
            data=new_data,
            previous_hash=latest_block.hash
        )
        new_block.mine_block(self.difficulty)
        self.chain.append(new_block)
        print(f"New block added: {new_block.hash} with data: {new_data}")
        return new_block

    def is_chain_valid(self):
        """Validates the integrity of the blockchain."""
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i-1]

            # Check if the stored hash is correct
            if current_block.hash != current_block.calculate_hash():
                print(f"Data integrity compromised at block {current_block.index}.")
                return False

            # Check if the previous hash matches
            if current_block.previous_hash != previous_block.hash:
                print(f"Chain broken at block {current_block.index}: previous hash mismatch.")
                return False

            # Check if the block's hash meets the difficulty criteria (for mined blocks)
            if self.difficulty > 0 and current_block.hash[:self.difficulty] != '0' * self.difficulty:
                # Genesis block might not adhere if difficulty is applied post-creation and is > 0
                if current_block.index > 0 : # Skip genesis for this PoW check if it wasn't mined with current difficulty
                    print(f"Proof of Work invalid for block {current_block.index}.")
                    return False
        return True

# Example Usage (can be removed or moved to a test file later)
if __name__ == "__main__":
    supply_chain_bc = Blockchain(difficulty=3)
    print("Mining block 1...")
    supply_chain_bc.add_block({"event": "Product P123 Created", "productId": "P123", "location": "Factory A"})

    print("\nMining block 2...")
    supply_chain_bc.add_block({"event": "Product P123 Shipped", "productId": "P123", "from": "Factory A", "to": "Warehouse B", "carrier": "ShipCo"})

    print("\nBlockchain valid?", supply_chain_bc.is_chain_valid())

    print("\nBlockchain content:")
    for block in supply_chain_bc.chain:
        print(json.dumps({
            "index": block.index,
            "timestamp": block.timestamp,
            "data": block.data,
            "previous_hash": block.previous_hash,
            "hash": block.hash,
            "nonce": block.nonce
        }, indent=2))

    # # Example of tampering (uncomment to test immutability)
    # if len(supply_chain_bc.chain) > 1:
    #     print("\nAttempting to tamper with the blockchain...")
    #     supply_chain_bc.chain[1].data = {"event": "Product P123 Tampered", "productId": "P123"}
    #     # Recalculating hash after tampering will show a different hash, but is_chain_valid will catch previous_hash mismatch
    #     # supply_chain_bc.chain[1].hash = supply_chain_bc.chain[1].calculate_hash() # This would hide direct data change if only hash is checked
    #     print("Blockchain valid after tampering?", supply_chain_bc.is_chain_valid())