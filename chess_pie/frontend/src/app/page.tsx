"use client"
import {useState, useEffect} from 'react'
import Btn from "./Buttons"
import PlayModal from './Play'
import { useModal } from '@/components/modalContext'

export default function Home() {
  const {modalOpen, setModalOpen} = useModal();
  useEffect(()=> {
    const handleEscape = (event:any) => {
      if (event.key === "Escape") {
        setModalOpen(false)
      }}
      window.addEventListener("keydown", handleEscape)
      return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);
  return (
  <><div className="dark:block hidden bg-headerDark h-3"></div>
  <div className="dark:h-10 h-1 w-full bg-gradient-to-b from-headerLight to-light dark:from-headerDark dark:to-dark"></div>
  <main className="grid grid-cols-2 mt-0">
  <Btn />
  </main>
  <PlayModal />
  </>);
}