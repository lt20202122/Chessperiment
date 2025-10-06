"use client"
import Board from "./Board"
import {useState} from 'react'

export default function Game () {
    const [boardStyle, setBoardStyle] = useState("v2")
    return <Board boardStyle={boardStyle} setBoardStyle={setBoardStyle}/>
}