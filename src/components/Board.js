import React, { useState } from "react";
import { LinkedListNode, SinglyLinkedList } from "./LinkedList";
import "./Board.css";

const BOARD_SIZE = 10;

const Board = () => {
  const [board, setBoard] = useState(createBoard(BOARD_SIZE));
  const [snakeCells, setSnakeCells] = useState(new Set([44]));
  const [snake, setSnake] = useState(new SinglyLinkedList(44));

  return (
    <div className="board">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="row">
          {row.map((cellValue, cellIndex) => (
            <div
              key={cellIndex}
              className={`cell ${
                snakeCells.has(cellValue) ? "cell-green" : ""
              }`}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
};

const createBoard = (BOARD_SIZE) => {
  let counter = 1;
  const board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const currentRow = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      currentRow.push(counter++);
    }
    board.push(currentRow);
  }
  return board;
};

export default Board;
