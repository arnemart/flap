import manifest from "./assets.json"
import { load, loadingScreen, fadeToBlack, crashScreen, once, rand } from "./utils"
import { initAudio, playEffect, playMusic } from "./audio"

// Handle small displays
const setScale = () => {
  const factor = Math.min(window.innerWidth / 455, window.innerHeight / 711)
  if (factor < 1) {
    document.querySelector(".game__console").style.transform = `scale(${factor})`
  }
}
window.addEventListener("resize", setScale)
window.addEventListener("rotate", setScale)
setScale()

// Set up canvas
const W = 128
const H = 154

const canvas = document.querySelector("#canvas")
canvas.setAttribute("width", W)
canvas.setAttribute("height", H)
const C = canvas.getContext("2d")
C.imageSmoothingEnabled = false

const btn = document.querySelector(".game__console__btn--btn")

// Load and go
load(manifest, loadingScreen(C, W, H)).then((assets) => {
  initAudio(assets)

  C.drawImage(assets["splash.png"], 0, 0)

  once(["keypress", "click"], () => {
    startGame(assets)
  })
})

const startGame = (assets) => {
  playMusic("music.mp3")
  C.font = "14px monospace"
  C.textAlign = "right"
  C.fillStyle = "#002351"

  let frame = 0
  let prevTime
  let lastFlap = 0

  // Birb position, speed and acceleration
  let y = 10
  let speedY = 0
  const accY = 0.07

  // Background scroll position, speed and acceleration
  let x = 0
  let speedX = 1
  const accX = 0.0004

  let running = true
  let paused = false

  let score = 0

  let pipes = []
  const addPipe = () => {
    pipes = pipes.filter((p) => p.x >= x - W)
    pipes.push({
      x: x + W + rand(100),
      y: rand(40, H - 40),
      cleared: false,
    })
  }
  addPipe()

  const crash = () => {
    running = false
    playEffect(`explosion_${rand(1, 2)}.mp3`)
    playMusic("stinger.mp3", false)
    fadeToBlack(C, W, H)
    setTimeout(() => {
      crashScreen(C, W, H, score)
      once(["click", "keypress"], () => startGame(assets))
    }, 2450)
  }

  const pause = () => {
    if (paused) {
      paused = false
      prevTime = null
      requestAnimationFrame(gameLoop)
    } else {
      paused = true
    }
  }

  // Handle keyboarb events
  let flapHeldDown = false
  let flapHeldDownPrev = false

  document.body.addEventListener("keydown", (e) => (flapHeldDown = e.key == " "))
  document.body.addEventListener("keyup", (e) => {
    switch (e.key) {
      case " ":
        if (paused) {
          pause()
        } else {
          flapHeldDown = false
        }
        break
      case "Escape":
        pause()
        break
    }
  })

  // Handle mouse/touch events
  btn.addEventListener("mousedown", () => (flapHeldDown = true))
  btn.addEventListener("touchstart", () => (flapHeldDown = true))
  btn.addEventListener("mouseup", () => (flapHeldDown = false))
  btn.addEventListener("touchend", () => (flapHeldDown = false))

  const gameLoop = (time) => {
    // Set up time for first run through game loop
    if (!prevTime) {
      prevTime = time
      window.requestAnimationFrame(gameLoop)
      return
    }

    // Adjust for different frame rates
    const fpsFactor = (time - prevTime) / (1000 / 60)

    prevTime = time

    // Adjust vertical position and speed (birb height)
    y += speedY * fpsFactor
    speedY += accY * fpsFactor

    // Adjust horizontal position and speed (background scroll)
    x += speedX * fpsFactor
    speedX += accX * fpsFactor

    // Flap if flap button is held down during this frame
    // Don't flap continously if flap is held down continuously
    if (flapHeldDown && !flapHeldDownPrev) {
      speedY = Math.max(-3.5, speedY - 2.5)
      playEffect("flap.m4a")
      lastFlap = time
    }

    if (flapHeldDown) {
      flapHeldDownPrev = true
    } else {
      flapHeldDownPrev = false
    }

    // Handle scoring
    const nextPipe = pipes.filter((p) => !p.cleared)[0]
    if (!nextPipe.cleared && x > nextPipe.x) {
      nextPipe.cleared = true
      score++
      playEffect("point_1.mp3")
      addPipe()
    }

    // Handle crashing
    if (
      // Too far up or down
      y > H * 2 ||
      y < -(H * 2) ||
      // Inside pipe horizontally
      (x < nextPipe.x &&
        x > nextPipe.x - 50 &&
        // Inside pipe vertically
        (y < nextPipe.y - 40 || y > nextPipe.y + 8))
    ) {
      crash()
      return
    }

    // Render background
    const bgpos = -Math.floor((x * 0.75) % (W * 4))
    C.drawImage(assets["bg.png"], bgpos, 0)
    C.drawImage(assets["bg.png"], bgpos + W * 4, 0)

    // Render pipe
    for (const pipe of pipes) {
      const pipeX = Math.floor(pipe.x - x)
      C.drawImage(assets["stalagtipe.png"], pipeX, pipe.y - H - 36)
      C.drawImage(assets["stalagmipe.png"], pipeX, pipe.y + 36)
    }

    // Render birb
    const flapping = time - lastFlap < 250 && Math.floor(frame / 3) % 2 == 0
    C.drawImage(assets[`birb${flapping ? "2" : "1"}.png`], 20, Math.floor(y))

    // Render score
    C.fillText(score, W - 5, 15)

    // Render FPS
    // C.fillText(`${(60 / fpsFactor).toFixed(2)}fps`, W - 5, H - 5)

    // Go to next frame
    if (running && !paused) {
      frame++
      window.requestAnimationFrame(gameLoop)
    }
  }

  // Start game loop
  window.requestAnimationFrame(gameLoop)
}
