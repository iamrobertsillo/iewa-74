import Image from "next/image";
import { fetchGridSquares } from "@/lib/api"

export default async function HomePage() {
  const squares = await fetchGridSquares()

  return (
    <div className="grid grid-cols-10 gap-2 p-4">
      {squares.map((square: { id: number; x: number; y: number }) => (
        <div key={square.id} className="border p-2">
          <p>({square.x}, {square.y})</p>
        </div>
      ))}
    </div>
  )
}
