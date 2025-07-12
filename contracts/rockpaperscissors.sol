// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RockPaperScissors {
    enum Choice { None, Rock, Paper, Scissors }

    struct GameState {
        Choice playerChoice;
        uint256 betAmount;
        bool inGame;
    }

    mapping(address => GameState) public playerGames;

    uint256 public minBet = 5 ether;
    uint256 public maxBet = 100 ether;
    address public owner;

    event GameStarted(address indexed player, uint256 betAmount);
    event PlayerChose(address indexed player, Choice choice);
    event GameResolved(address indexed player, Choice playerChoice, Choice botChoice, string result, uint256 payout);
    event Draw(address indexed player, Choice playerChoice, Choice botChoice);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this.");
        _;
    }

    modifier onlyInGame() {
        require(playerGames[msg.sender].inGame, "You are not in an active game.");
        _;
    }

    modifier onlyNotInGame() {
        require(!playerGames[msg.sender].inGame, "You are already in a game.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}
    fallback() external payable {}

    function fundContract() public payable {}
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function startGame() public payable onlyNotInGame {
        require(msg.value >= minBet, "Minimum bet is 5 ZTC.");
        require(msg.value <= maxBet, "Maximum bet is 100 ZTC.");

        playerGames[msg.sender] = GameState({
            playerChoice: Choice.None,
            betAmount: msg.value,
            inGame: true
        });

        emit GameStarted(msg.sender, msg.value);
    }

    function makeChoice(Choice _playerChoice) public payable onlyInGame {
        require(_playerChoice != Choice.None, "Invalid choice.");
        require(playerGames[msg.sender].playerChoice == Choice.None, "Already chose.");
        require(msg.value == 0, "No extra payment needed.");

        playerGames[msg.sender].playerChoice = _playerChoice;
        emit PlayerChose(msg.sender, _playerChoice);

        _resolveGame(msg.sender);
    }

    function _resolveGame(address _player) internal {
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            _player,
            block.number
        ))) % 3;

        Choice botChoice = Choice(randomNumber + 1); // Rock=1, Paper=2, Scissors=3
        Choice playerChoice = playerGames[_player].playerChoice;
        uint256 bet = playerGames[_player].betAmount;
        string memory result;
        uint256 payout = 0;

        if (playerChoice == botChoice) {
            playerGames[_player].playerChoice = Choice.None;
            result = "Draw";
            emit Draw(_player, playerChoice, botChoice);
        } else if (
            (playerChoice == Choice.Rock && botChoice == Choice.Scissors) ||
            (playerChoice == Choice.Paper && botChoice == Choice.Rock) ||
            (playerChoice == Choice.Scissors && botChoice == Choice.Paper)
        ) {
            result = "Win";
            payout = bet * 2;
            require(address(this).balance >= payout, "Contract has insufficient funds.");
            (bool success, ) = payable(_player).call{value: payout}("");
            require(success, "Transfer failed.");
            playerGames[_player] = GameState(Choice.None, 0, false);
        } else {
            result = "Lose";
            playerGames[_player] = GameState(Choice.None, 0, false);
        }

        emit GameResolved(_player, playerChoice, botChoice, result, payout);
    }

    function withdraw() public onlyOwner {
        (bool success, ) = payable(owner).call{value: address(this).balance}("");
        require(success, "Withdraw failed.");
    }
}
