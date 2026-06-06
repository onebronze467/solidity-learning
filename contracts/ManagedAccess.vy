# @version ^0.4.1
# @license MIT

owner: address
manager: address

@deploy
def __init__(_owner: address, _manager: address):
    self.owner = _owner
    self.manager = _manager

@internal
def _onlyOwner(_owner: address):
    assert msg.sender == _owner, "You are not the owner"

@internal
def _onlyManager(_manager: address):
    assert msg.sender == _manager, "You are not the manager"

    