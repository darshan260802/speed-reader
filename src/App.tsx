import { Button } from "@/components/ui/button"
import { useState } from "react"

export function App() {
  const [page, setPage] = useState("Home")
  return (
    <>
    {
      page === "Home" && <h1>Hello</h1>
    }
    </>
  )
}

export default App
