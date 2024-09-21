/**START CLASSES */
class Cell {
    constructor(props){
        this.id = props.id;
        this.position = props.position;
        this.contents = props.contents ?? '';
    }
}

class GameState {
    constructor(props){
        this.round = props.round;
        this.currentAction = props.currentAction;
        this.currentPlayerId = props.currentPlayer;
        this.board = props.board;
        this.players = props.players;
    }

    getPlayerShips(player_id){
        return this.board.filter((c) => { return (c.contents instanceof Ship) && c.contents.player_id == player_id});
    }
}

class Obstacle {
    constructor(props){
        this.id = props.id;
        this.type = props.type;
        this.parent_id = props.parent_id ?? null;
        this.start = null;
        this.end = null;
    }
}

class Player {
    constructor(props){
        this.id = props.id;
        this.name = props.name;
        this.score = 0;
        this.currentDirection = null;
        this.edge = props.edge;
        this.shipStash = 1;
        this.obstacleStash = 1;
    }
}

class Ship {
    constructor(props){
        this.id = props.id;
        this.image = props.image ?? '';
        this.player_id = props.player_id;
    }
}
/**END CLASSES */

/* START CONSTANTS */
const BOARD_SIZE = 16;
const GAME_STATES = {
    ADD_OBSTACLES: "Adding obstacles...",
    DEPLOY_SHIPS: "Deploying ships...",
    DECLARE_DIRECTION: "Choosing ship directions...",
    MOVE_SHIPS: "Roll the dice!",     
    OTHER_PLAYER_TURN: "Waiting for someone else..."
};
const OBSTACLE_TYPES = [

];
const DIRECTIONS = {
    "up-left": "↖️",
    "up" : "⬆️",
    "up-right":"↗️",
    "left": "⬅️",
    "cancel": "❌",
    "right": "➡️",
    "down-left":"↙️",
    "down":"⬇️",
    "down-right":"↘️",
};
const EDGES = {
    
}

const boardId = "gameBoard";
const infoId = "gameInfo";
const gameStateId = "gameStatus";
const gameMessageId = "gameMessage";
const controlsId = "gameControls";
const diceId = "gameDice";
const counterId = "counter";
const obstacleButtonId = "obstacleButton";
const shipButtonId = "shipButton";
const declareButtonId = "declareButton";
const playersId = "players";

const cellHtml = `<div class="cell" data-cell-id="[data-cell-id]">[slot]</div>`;
const controlsHtml = `<button class="controller-button" data-direction="[data-direction]">[slot]</button>`;
const playerHtml = `<div class="player-info [class]">[slot]</div>`;

/* END CONSTANTS */

/** START GAME FUNCTIONS */
let gameState = new GameState({
    round: 0,
    currentAction: null,
    currentPlayer: 1,
    board: [],
    players : [
        // new Player({
        //     id: 1,
        //     name: "James",
        //     edge: "right"
        // }),
        // new Player({
        //     id: 2,
        //     name: "Kayla",
        //     edge: "top"
        // }),
        // new Player({
        //     id: 3,
        //     name: "Rowan",
        //     edge: "left"
        // }),
        // new Player({
        //     id: 4,
        //     name: "CRAB",
        //     edge: "bottom"
        // }),
    ],
});

// Utility functions
function el(e) {
    return document.getElementById(e);
}

function replaceSlot(e,value,slot = '[slot]'){
    return e.replace(slot,value);
}

function getCellByPosition(x,y){
    return gameState.board.find((cell) => {return (cell.position.x == x && cell.position.y == y)});
}

function getCellById(id){
    return gameState.board.find((c) => { return c.id == id; });
}

function getPlayerById(id){
    return gameState.players.find((p) => { return p.id == id; });
}

function getCurrentPlayer(){
    return getPlayerById(gameState.currentPlayerId);
}

function cellCanPlaceObstacle(cell){
    if(cellIsNotEdge(cell) && cellIsEmpty(cell)){
        return true;
    }
    return false;
}

function cellCanPlaceShip(cell){
    if(cellIsEdge(cell) && cellIsEmpty(cell) && !cellIsCorner(cell) && cellIsPlayerStartEdge(cell)){
        return true;
    }
    return false;
}

function cellIsEdge(cell){
    return (cell.position.x == 0
        || cell.position.y == 0
        || cell.position.x == BOARD_SIZE - 1
        || cell.position.y == BOARD_SIZE - 1
    );
}

function cellIsNotEdge(cell){
    return (cell.position.x > 0
        && cell.position.y > 0
        && cell.position.x < BOARD_SIZE - 1
        && cell.position.y < BOARD_SIZE - 1
    );
}

function cellIsCorner(cell){
    return (
        (cell.position.x == 0 && cell.position.y == 0)
        || (cell.position.x == 0 && cell.position.y == BOARD_SIZE - 1)
        || (cell.position.x == BOARD_SIZE - 1 && cell.position.y == BOARD_SIZE - 1)
        || (cell.position.x == BOARD_SIZE - 1 && cell.position.y == 0)
    );
}

function cellIsPlayerStartEdge(cell){
    const edge = getCurrentPlayer().edge;
    switch(edge){
        case "right":
            return (cell.position.x == BOARD_SIZE - 1);
        case "left":
            return (cell.position.x == 0);
        case "top":
            return (cell.position.y == 0);
        case "bottom":
            return (cell.position.y == BOARD_SIZE - 1);
    }
}

function cellIsEmpty(cell){
    return cell.contents.length == 0;
}

function positionIsPlayerWinningEdge(position){
    const edge = getCurrentPlayer().edge;
    switch(edge){
        case "right":
            return (position.x == 0);
        case "left":
            return (position.x == BOARD_SIZE - 1);
        case "top":
            return (position.y == BOARD_SIZE - 1);
        case "bottom":
            return (position.y == 0);
    }
}

// Game setup functions
function setupBoard() {
    const playersInput = document.querySelector("nav").querySelectorAll("input");
    const startingEdges = ["right","top","left","bottom"];
    console.log("playersinput",playersInput);
    for(let i = 0; i<playersInput.length; i++){
        gameState.players.push(new Player({
            id: i + 1,
            name: playersInput[i].value.length ? playersInput[i].value : playersInput[i].dataset.name,
            edge: startingEdges[i]
        }));
    }
    document.querySelector("nav").style.display = "none";
    document.querySelector("main").classList.remove("hidden");
    el(boardId).style.gridTemplateColumns = `repeat(${BOARD_SIZE},var(--grid-cell-size))`;
    let board = [];
    // Set up each row
    for(let i=0; i < BOARD_SIZE; i++){
        // Set up each column
        for(let j=0; j < BOARD_SIZE; j++){
            board.push(new Cell({
                id: "cell_"+j+"_"+i,
                position: {
                    x: j,
                    y: i
                }
            }));
        }
    }
    gameState.board = board;
    updateBoardHtml();
    updateControlsHtml();
    updatePlayersHtml();
    el(obstacleButtonId).addEventListener("click",addingObstacles);
    el(shipButtonId).addEventListener("click",addingShips);
    el(declareButtonId).addEventListener("click",declaringDirection);
    el(counterId).addEventListener("click",rollDice);
}

function updateBoardHtml(){
    let boardHtml = ``;
    // Go over each row and add cells
    for(let i=0; i < BOARD_SIZE; i++){
        for(let j=0; j < BOARD_SIZE; j++){
            let cell = getCellByPosition(j,i);
            boardHtml += replaceSlot(
                replaceSlot(
                    cellHtml,
                    cell.id,
                    '[data-cell-id]'
                )
                ,cell.contents?.displayedHtml ?? '');
        }
    }
    el(boardId).innerHTML = boardHtml;
}

function updateControlsHtml(){
    let gameControlsHtml = ``;
    Object.keys(DIRECTIONS).forEach((direction) => {
        gameControlsHtml += replaceSlot(
            replaceSlot(
                controlsHtml,
                direction,
                '[data-direction]'
            )
            , DIRECTIONS[direction]);
    });
    el(controlsId).innerHTML = gameControlsHtml;
}

function updatePlayersHtml(){
    let playersHtml = ``;
    gameState.players.forEach((player) => {
        playersHtml += replaceSlot(replaceSlot(
            playerHtml,
            `<b>${player.name}!</b>
            <span class="ammo">
                <div>${player.shipStash} ship(s)</div>
                <div>${player.obstacleStash} obstacle(s)</div>
            </span>
            <span class="score">${player.score} point(s)</span>`
        ),(getCurrentPlayer().id == player.id) ? "--active" : "","[class]")
    })
    el(playersId).innerHTML = playersHtml;
}

// Gameplay functions
function addingObstacles(){
    if(gameState.currentAction !== null) return;
    if(getCurrentPlayer().obstacleStash < 1) return;
    updateCurrentAction(GAME_STATES.ADD_OBSTACLES);
    el(boardId).style.cursor = "pointer";
    updateHighlights('obstacle');
    el(boardId).addEventListener("click", handleAddObstacle);
}

function addingShips(){
    if(gameState.currentAction !== null) return;
    if(getCurrentPlayer().shipStash < 1) return;
    updateCurrentAction(GAME_STATES.DEPLOY_SHIPS);
    el(boardId).style.cursor = "pointer";
    updateHighlights('ship');
    el(boardId).addEventListener("click", handleAddShip);
}

function declaringDirection(){
    if(gameState.currentAction !== null) return;
    if(gameState.getPlayerShips(gameState.currentPlayerId).length < 1) return ;
    updateCurrentAction(GAME_STATES.DEPLOY_SHIPS);
    el(controlsId).style.display = "grid";
    el(controlsId).addEventListener("click", handleDeclareDirection);
}

function movingShips(){
    updateCurrentAction(GAME_STATES.MOVE_SHIPS);
    el(diceId).style.display = "flex";
}

function rollDice(){
    var rolled = 0;
    let interval = window.setInterval(() =>{
        rolled = Math.floor(Math.random() * 12) + 1;
        // rolled = 16; // TODO HARDCODED TO MAX REMOVE
        el(counterId).innerHTML = rolled;
        el(counterId).setAttribute("disabled",true);
    },100);
    window.setTimeout(() => {
        window.clearInterval(interval);
        el(counterId).classList.add("party-glow");
        executeMove(rolled);
    }, 1500);
}

function executeMove(steps){
    const shipCells = gameState.getPlayerShips(gameState.currentPlayerId);
    const direction = getCurrentPlayer().currentDirection;
    shipCells.forEach((cell) => {
        let destination = calculateDestination({x:cell.position.x,y:cell.position.y},direction,steps);
        // show movement path
        let originCell = cell;
        let originCellElement = document.querySelector(`[data-cell-id=${cell.id}]`);
        originCellElement.style.backgroundColor = '';
        let destinationCell = getCellByPosition(destination.x, destination.y);
        let destinationCellElement = document.querySelector(`[data-cell-id=${destinationCell.id}`);

        console.log(`${getCurrentPlayer().name} moving ship at ${cell.position.x},${cell.position.y} to ${destination.x},${destination.y} causing action: ${destination.action ?? 'none'}`);
        if(destination.action == 'boom'){
            destinationCellElement.style.backgroundColor = '';
            destinationCellElement.innerHTML = "<span>BOOM</span>";
            destinationCellElement.classList.add("boom");
            window.setTimeout(() => {
                destinationCellElement.innerHTML = "";
                destinationCellElement.classList.remove("boom");
            }, 1000);
            destinationCell.contents = '';
        } else if(destination.action == 'safe') {
            //gain a point! remove ship
            getCurrentPlayer().score = (getCurrentPlayer().score ?? 0) + 1;
            console.log("Ship safe!");
        } else {
            destinationCell.contents = originCell.contents;
            destinationCellElement.style.backgroundColor = 'deepskyblue';
        }

        originCell.contents = '';
        // calc removing everything collided with
        destination.collisions.forEach((collidedCell) => {
            collidedCell.contents = null;
            document.querySelector(`[data-cell-id=${collidedCell.id}]`).style.backgroundColor = '';
        });
    });
    window.setTimeout(() => {
        el(counterId).innerHTML = '🎲 🎲';
        el(counterId).attributes.removeNamedItem("disabled");
        el(counterId).classList.remove("party-glow");
        el(diceId).style.display = "none";
    },2000);
    updateNextPlayer();
    updateCurrentAction();
}

function calculateDestination(originCell,direction,steps){
    var position = {x: originCell.x, y:originCell.y};
    let destination = {...position, action: null, collisions: []};
    for(let i=0; i<steps; i++){
        if(!destination.action){
            switch (direction) {
                case "up":
                    position = position.y - 1;
                    break;
                case "down":
                    position.y = position.y + 1;
                    break;
                case "left":
                    position.x = position.x - 1;
                    break;
                case "right":
                    position.x = position.x + 1;
                    break;
                case "up-left":
                    position.y = position.y - 1;
                    position.x = position.x - 1;
                    break;
                case"up-right":
                    position.y = position.y - 1;
                    position.x = position.x + 1;
                    break;
                case "down-left":
                    position.y = position.y + 1;
                    position.x = position.x - 1;
                    break;
                case "down-right":
                    position.y = position.y + 1;
                    position.x = position.x + 1;
                    break;
                default:
                    break;
            }
            let collisions = checkForCollisions(position,direction);
            if(collisions){
                switch(collisions){
                    case 'ship':
                    case 'rock':
                        // handle ship or rock collision
                        destination = {
                            x: position.x,
                            y: position.y,
                            action: 'boom',
                            collisions: destination.collisions
                        };
                        break;
                    case 'snake':
                        // handle snake collision
                        // set new origin to the end of the snake
                        let snake = getCellByPosition(position.x,position.y).contents;
                        destination = {
                            x: snake.end.x,
                            y: snake.end.y,
                            action: null,
                            collisions: destination.collisions.push(snake)
                        };
                        break;
                    case 'ladder':
                        // handle ladder collision
                        // set new origin to the other end of the ladder
                        let ladder = getCellByPosition(position.x,position.y).contents;
                        let newPos = {x: ladder.start.x,y:ladder.start.y};
                        if(position.x == ladder.start.x && position.y == ladder.start.y){
                            newPos = {x: ladder.end.x,y:ladder.end.y};
                        }
                        destination = {
                            x: newPos.x,
                            y: newPos.y,
                            action: null,
                            collisions: destination.collisions.push(ladder)
                        };
                        break;
                    case 'edge':
                        destination = getEdgeAction(position,direction,destination);
                        break;
                }
            } else {
                destination = {
                    x: position.x,
                    y: position.y,
                    action: null,
                    collisions: destination.collisions
                }
            }
        }
    }
    return destination;
}

function checkForCollisions(position, direction){
    const cell = getCellByPosition(position.x,position.y);
    if(!cell){
        // hit the edge of the board
        return 'edge';
    }
    showNavigationAnimation(cell);
    const contents = cell.contents;
    if(contents != ''){
        if((contents instanceof Ship) && contents.player_id != gameState.currentPlayerId){
            // collided with an enemy ship
            return 'ship';
        } else if((contents instanceof Obstacle) && contents.type == 'rock'){
            // hit a rock
            return 'rock';
        } else if((contents instanceof Obstacle) && contents.type == 'snake'){
            // hit the start of a worm
            return 'snake';
        } else if ((contents instanceof Obstacle) && contents.type == 'ladder'){
            // hit either end of a ladder
            return 'ladder';
        }
    }

    return false;
}

function showNavigationAnimation(cell){
    let cellElement = document.querySelector(`[data-cell-id=cell_${cell.position.x}_${cell.position.y}`);
    cellElement.classList.add("goto");
    window.setTimeout(() => { cellElement.classList.remove("goto"),1000});    
}

function normalisePosition(position){
    if(position.x < 0){
        position.x = 0;
    } else if (position.x > BOARD_SIZE - 1){
        position.x = BOARD_SIZE - 1;
    }
    if(position.y < 0){
        position.y = 0;
    } else if (position.y > BOARD_SIZE - 1){
        position.y = BOARD_SIZE - 1;
    }
    return position;
}

// Decide whether we bonk, safe, or teleport
function getEdgeAction(position,direction,destination){
    let action;
    let startEdge = getCurrentPlayer().edge;
    // check if position is at own edge ('bonk')
    // check if position is at winning edge ('safe')
    // check if position is in transit to the other side of board ('teleport')
    switch(startEdge){
        case 'left':
            if(position.x <= 0){
                action = 'bonk';
            } else if(position.x >= BOARD_SIZE - 1){
                action = 'safe';
            } else {
                action = 'teleport';
            }
            break;
        case 'right':
            if(position.x >= BOARD_SIZE - 1){
                action = 'bonk';
            } else if(position.x <= 0){
                action = 'safe';
            } else {
                action = 'teleport';
            }
            break;
        case 'up':
            if(position.y <= 0){
                action = 'bonk';
            } else if(position.y >= BOARD_SIZE){
                action = 'safe';
            } else {
                action = 'teleport';
            }
            break;
        case 'down':
            if(position.y >= BOARD_SIZE){
                action = 'bonk';
            } else if(position.y <= 0){
                action = 'safe';
            } else {
                action = 'teleport';
            }
            break;
    }

    // check if we're exactly in a winning edge
    if(positionIsPlayerWinningEdge(position)){
        action = 'safe';
    }

    position = normalisePosition(position);
    switch(action){
        case 'bonk':
            // handle hitting own edge
            // sets action to bonk, which stops us in our tracks
            destination = {
                x: position.x,
                y: position.y,
                action: 'bonk',
                collisions: destination.collisions
            };
            break;
        case 'teleport':
            // handle jumping from one side to the other !recursively
            position = calculateNewTeleportPosition(position,direction);
            destination = {
                x: position.x,
                y: position.y,
                action: null,
                collisions: destination.collisions
            };
            break;
        case 'safe':
            // handle a ship successfully reaching the other side
            destination = {
                x: position.x,
                y: position.y,
                action: 'safe',
                collisions: destination.collisions
            };
            break;
    }
    return destination;
}

function calculateNewTeleportPosition(position,direction){
    if(direction.includes('left') && position.x == 0){
        position.x = BOARD_SIZE - 1;
    }
    if(direction.includes('right') && position.x == BOARD_SIZE - 1){
        position.x = 0;
    }
    if(direction.includes('up') && position.y == 0){
        position.y = BOARD_SIZE - 1;
    }
    if(direction.includes('down') && position.y == BOARD_SIZE - 1){
        position.y = 0;
    }
    return position;
}

function handleAddObstacle(e){
    let clickedId = e.target.dataset.cellId;
    if(!clickedId) return; // didn't click a cell

    let cell = getCellById(clickedId);
    if(cellCanPlaceObstacle(cell)){
        cell.contents = new Obstacle({
            id: clickedId + '_obstacle',
            type: 'rock',
            parent_id: clickedId
        });
        e.target.style.backgroundColor = "red";
        // e.target.innerText = "ROCK";
        el(boardId).style.cursor = "";
        el(boardId).removeEventListener("click", handleAddObstacle);
        getCurrentPlayer().obstacleStash--;
        updateHighlights();
        updateGameMessage();
        updateCurrentAction();
    } else {
        updateGameMessage("pls put the obstacle into an empty space in the middle");
    }
}

function handleAddShip(e){
    let clickedId = e.target.dataset.cellId;
    if(!clickedId) return; // didn't click a cell

    let cell = getCellById(clickedId);
    if(cellCanPlaceShip(cell)){
        cell.contents = new Ship({
            id: clickedId + '_obstacle',
            image: '',
            player_id: gameState.currentPlayerId
        });
        e.target.style.backgroundColor = "deepskyblue";
        el(boardId).style.cursor = "";
        el(boardId).removeEventListener("click", handleAddShip);
        getCurrentPlayer().shipStash--;
        updateHighlights();
        updateGameMessage();
        updateCurrentAction();
    } else {
        updateGameMessage("pls deploy your ship at an edge without anything in it");
    }
}

function handleDeclareDirection(e){
    let clickedDirection = e.target.dataset.direction;
    if(!clickedDirection) return; // didn't click a direction
    el(controlsId).removeEventListener("click", handleDeclareDirection);
    el(controlsId).style.display = "none";
    updateHighlights();
    updateGameMessage();
    updateCurrentAction();
    if(clickedDirection == "cancel"){
        return;
    } else{
        getPlayerById(gameState.currentPlayerId).currentDirection = clickedDirection;
        movingShips();
    }
}

function updateCurrentAction(newState = null){
    // if can enter newState, then do. otherwise don't
    gameState.currentAction = newState;
    el(gameStateId).innerHTML = gameState.currentAction;
    updatePlayersHtml();
}

function updateGameMessage(message = null){
    el(gameMessageId).innerHTML = message;
}

function updateNextPlayer(){
    let ids = gameState.players.map((p) => { return p.id; });
    let position = ids.indexOf(gameState.currentPlayerId);
    if(position == (ids.length - 1)){
        gameState.currentPlayerId = 1;
    } else {
        gameState.currentPlayerId++;
    }
    updateGameMessage(`${getCurrentPlayer().name}, it's your turn!`);
}

function updateHighlights(context = null){
    let cells = document.querySelectorAll('.cell');
    cells.forEach((cellElement) => {
        cellElement.classList.remove('highlighted');
        if(context){
            let cell = getCellById(cellElement.dataset.cellId);
            switch (context) {
                case 'obstacle':
                    if(cellCanPlaceObstacle(cell)){
                        cellElement.classList.add('highlighted');
                    }
                    break;
                case 'ship':
                    if(cellCanPlaceShip(cell)){
                        cellElement.classList.add('highlighted');
                    }
                    break;
                default:
                    break;
            }
        }
    });
}

/** END GAME FUNCTIONS */

function start() {
    el("start").addEventListener("click",setupBoard);
}

window.onload = () => {
    start();
}