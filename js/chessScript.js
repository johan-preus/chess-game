var board = null;
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
const tableBody = document.querySelector('#pgnTable tbody')


function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'

  updateStatus()
  updateTable()
  oneMoveCapture()
  updateStatus()
  updateTable()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  $status.html(status)
  $fen.html(game.fen())
  // $pgn.html(game.pgn())
}

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}
board = Chessboard('myBoard', config)

updateStatus()


class MoveObj {
  constructor(move, moveEval, id){
    this.move = move;
    this.eval = moveEval;
    this.id = id;
  }
}



function updateTable(){
  const pgnArr = game.pgn().split(' ')
  const move = pgnArr[pgnArr.length - 1];
  if(game.turn() === 'b'){
    // white just moved
    const row = document.createElement('tr');
    tableBody.appendChild(row);
    const head = document.createElement('th');

    //this stops working with 2 digit numbers
    head.innerHTML = pgnArr[pgnArr.length - 2][0]; 

    const data = document.createElement('td');
    data.innerHTML = move;
    row.appendChild(head);
    row.appendChild(data);
  } else {
    // black just moved
    const row = tableBody.lastChild;
    const data = document.createElement('td');
    data.innerHTML = move;
    row.appendChild(data);
  }
}

function clearTable(){
  while (tableBody.firstChild){
    tableBody.removeChild(tableBody.firstChild);
  }
}

function evaluate(chessGame) {
  const fenStr = chessGame.fen().slice(0, chessGame.fen().indexOf(' '));
  let num = 0;
  if(game.in_draw()){
    num = 0;
    return num;
  }
  if(chessGame.in_checkmate()){
    if(chessGame.turn() === 'b'){
      num += 10000;
      return num;
    } else {
      num -= 10000;
      return num;
    }
  }
  for (let char of fenStr){
    switch(char){
      case 'P':
        num += 1;
        break;
      case 'B': 
      case 'N':
        num += 3;
        break;
      case 'R':
        num += 5;
        break;
      case 'Q':
        num += 9;
        break;
      case 'p':
        num -= 1;
        break;
      case 'b':
      case 'n':
        num -= 3;
        break;
      case 'r':
        num -= 5;
        break;
      case 'q':
        num -= 9;
        break;
      default:
        break;
    }
  }
  return num;
}

function getMoves(){
  const moves = game.moves();
  // const evalArr = [];
  let arr = [];
  for(i = 0; i < moves.length; i++){
    const chess = new Chess();
    chess.load_pgn(game.pgn());
    chess.move(moves[i]);
    const evaluation = evaluate(chess);
    // evalArr.push(evaluation);
    const move = new MoveObj(moves[i], evaluation, i)
    arr.push(move);
  }
  // if(game.turn() === 'w'){
  //   arr = arr.filter(m => m.eval === Math.max(...evalArr))
  // } else {
  //   arr = arr.filter(m => m.eval === Math.min(...evalArr))
  // }
  // return arr[Math.floor(Math.random() * arr.length)].move
  return arr;
}

// make a reducer function maybe???
function moveAndResponse() {
  class TwoMoveObj extends MoveObj{
    constructor(move, moveEval, id, secondMove){
      super(move, moveEval, id)
      this.secondMove = secondMove;
    }
  }
  const arr = getMoves();
  const newArr = [];
  for(i = 0; i < arr.length; i++){
    const chess = new Chess();
    chess.load_pgn(game.pgn());
    chess.move(arr[i].move);
    const moves = chess.moves();
    for(j = 0; j < moves.length; j++){
      const chess = new Chess();
      chess.load_pgn(game.pgn());
      chess.move(arr[i].move);
      chess.move(moves[j]);
      const evaluation = evaluate(chess);
      const move = new TwoMoveObj(arr[i].move, evaluation, j, moves[j])
      newArr.push(move);
    }
  }
  console.log(newArr)
}

function bestMove(arr){
  const evalArr = [];
  for(i = 0; i < arr.length; i++){
    evalArr.push(arr[i].eval)
  }
  if(game.turn() === 'w'){
    arr = arr.filter(m => m.eval === Math.max(...evalArr))
  } else {
    arr = arr.filter(m => m.eval === Math.min(...evalArr))
  }
  return arr[Math.floor(Math.random() * arr.length)].move
}

function oneMoveCapture() {
  const moves = game.moves();
  if(moves.length === 0){
    return;
  } 
  game.move(bestMove(getMoves()))
  $status.html(status)
  $fen.html(game.fen())
  $pgn.html(game.pgn())
  config.position = (game.fen())
  board = Chessboard('myBoard', config)
}

function randomMove(chessGame) {
  const moves = chessGame.moves();
  if(moves.length === 0){
    return;
  } 
  const move = moves[Math.floor(Math.random() * moves.length)]
  chessGame.move(move)
  config.position = (chessGame.fen())
  // board = Chessboard('myBoard', config)
}



// while (!game.game_over() && game.turn() === 'b') {
//   const moves = game.moves()
//   const move = moves[Math.floor(Math.random() * moves.length)]
//   game.move(move)
// }