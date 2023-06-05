// Generate a random integer from p1 to p2, or from 0 to p1 if p2 is omitted, inclusive
export const rand = (p1, p2) => {
  if (p2 == null) {
    p2 = p1
    p1 = 0
  }
  return Math.floor(Math.random() * (p2 + 1 - p1)) + p1
}

// Bind an event listener that can only be called once
export const once = (events, h) => {
  const handler = () => {
    for (const e of events) {
      document.body.removeEventListener(e, handler)
    }
    h()
  }
  for (const e of events) {
    document.body.addEventListener(e, handler)
  }
}

// Load stuff
export const load = (manifest, progressCallback = console.log) => {
  const imgs = manifest.images.map(
    (i) =>
      new Promise((resolve) => {
        const img = new Image("img")
        img.src = i
        img.addEventListener("load", () => resolve([i, img]))
      })
  )

  const sounds = manifest.sounds.map(
    (s) =>
      new Promise((resolve) => {
        fetch(s)
          .then((data) => data.arrayBuffer())
          .then((buf) => resolve([s, buf]))
      })
  )

  const allProms = [...imgs, ...sounds]
  let done = 0
  allProms.map((prom) =>
    prom.then(() => {
      done++
      progressCallback(done, allProms.length)
    })
  )
  progressCallback(0, allProms.length)

  return Promise.all(allProms).then(Object.fromEntries)
}

export const loadingScreen = (C, W, H) => (loaded, total) => {
  C.font = "14px monospace"
  C.fillStyle = "black"
  C.fillRect(0, 0, W, H)
  C.fillStyle = "white"
  C.textAlign = "center"
  C.fillText("Loading" + Array.from(Array((loaded % 4) + 1)).join("."), W / 2, 60)
  C.fillText(`${loaded}/${total}`, W / 2, 80)
}

export const fadeToBlack = (C, W, H) => {
  C.fillStyle = "rgba(0,0,0,0.3)"
  const fade = () => C.fillRect(0, 0, W, H)
  setTimeout(fade, 780)
  setTimeout(fade, 780 + 417.5)
  setTimeout(fade, 780 + 417.5 * 2)
  setTimeout(fade, 780 + 417.5 * 3)
}

export const crashScreen = (C, W, H, score) => {
  C.fillStyle = "black"
  C.fillRect(0, 0, W, H)
  C.font = "14px monospace"
  C.fillStyle = "white"
  C.textAlign = "center"
  C.fillText("You crashed!", W / 2, 60)
  C.font = "10px monospace"
  C.fillText(`You got ${score} point${score == 1 ? "" : "s"}`, W / 2, 80)
  C.fillText("Press any key", W / 2, 110)
  C.fillText("to play again", W / 2, 122)
}
