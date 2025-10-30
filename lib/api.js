export async function fetchGridSquares() {
  const res = await fetch("https://scriptsandstyles.com/projects/iewa-74/graphql/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        {
          gridSquare {
            list {
              id
              x
              y
            }
          }
        }
      `
    })
  })

  const json = await res.json()
  if (!json.data || !json.data.gridSquare) {
    console.error("GraphQL returned no data or error:", json)
    return []
  }

  return json.data.gridSquare.list
}