# @version ^0.3.0
# @license MIT

INIT_REWARD: constant(uint256) = 1 * 10 ** 18

interface IMyToken:
    def transfer(_amount: uint256, _to: address): nonpayable
    def transferFrom(_owner: address, _to:address, _amount: uint256): nonpayable
    def mint(_amount: uint256, _to: address): nonpayable

event Staked:
    _owner: indexed(address)
    _amount: uint256

event Withdraw:
    _amount: uint256
    _to: indexed(address)

staked: public(HashMap[address, uint256])
totalStaked: public(uint256)

stakingToken: IMyToken

rewardPerBlock : uint256
lastClaimedBlock: HashMap[address, uint256]
# owner: address
# manager: address

@external
def __init__(_stakingToken: IMyToken):
    self.stakingToken = _stakingToken
    self.rewardPerBlock = self.INIT_REWARD
    ManagedAccess.__init__(msg.sender, msg.sender)

# @internal
# def onlyOwner(_owner: address):
#     assert msg.sender == _owner, "You are not authorized"

# @internal
# def onlyManager(_manager: address):
#     assert msg.sender == _manager, "You are not authorized to manage this contract"

@external
def setRewardPerBlock(_amount: uint256):
    ManagedAccess.onlyManager(self.manager)
    self.rewardPerBlock = _amount

@internal
def updateReward(_to: address):
    if staked[_to] > 0:
    blocks: uint256 = block.number - self.lastClaimedBlock[_to]
    reward: uint256 = blocks * self.rewardPerBlock * self.staked[_to] // self.totalStaked
    extcall self.stakingToken.mint(reward, _to)

    self.lastClaimedBlock[_to] = block.number



@external
def stake(_amount: uint256): :
    assert _amount > 0, "cannot stake 0 tokens"
    self.stakingToken.transferFrom(msg.sender, self, _amount)
    self.staked[msg.sender] += _amount
    self.totalStaked += _amount

    log Staked(msg.sender, _amount)

@external
def withdraw(_amount: uint256):
    assert self.staked[msg.sender] >= _amount, "Insufficient staked tokens"
    self.stakingToken.transfer(_amount, msg.sender)
    self.staked[msg.sender] -= _amount
    self.totalStaked -= _amount

    log Withdraw(_amount, msg.sender)