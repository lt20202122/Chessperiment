"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const styles = ["v1", "v2"]

export default function BoardStyle() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className=""> 
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value || "Select board style..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[200px] p-0 shadow-black bg-[hsl(0,0%,90%)]" style={{
        boxShadow: "5px 5px 10px hsl(0,0%,15%), 10px 10px 20px hsl(0,0%,15%)"
      }}>
        <Command>
          <CommandInput placeholder="Search style..." />
          <CommandList>
            <CommandEmpty>No style found.</CommandEmpty>
            <CommandGroup>
              {styles.map((style) => (
                <CommandItem
                  className="hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                  key={style}
                  value={style}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === style ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {style}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
