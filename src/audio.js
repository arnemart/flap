import { once } from "./utils"

let ctx
let resolveAssets
const assetsPromise = new Promise((resolve) => (resolveAssets = resolve))

export const initAudio = (a) => {
  const initAudioOnce = () => {
    ctx = new AudioContext()
    resolveAssets(a)
  }

  // Audio can only be started by a user action
  once(["keypress", "click", "touchend"], initAudioOnce)
}

let decodedAudio = {}

export const playEffect = async (effect) => {
  const assets = await assetsPromise
  if (!decodedAudio[effect]) {
    decodedAudio[effect] = await ctx.decodeAudioData(assets[effect])
  }
  const audio = ctx.createBufferSource()
  audio.buffer = decodedAudio[effect]
  audio.connect(ctx.destination)
  audio.start()
}

let currentMusic, currentMusicAudio, currentMusicGain
export const playMusic = async (music, loop = true) => {
  const assets = await assetsPromise
  if (music == currentMusic) {
    return
  }

  if (!decodedAudio[music]) {
    decodedAudio[music] = await ctx.decodeAudioData(assets[music])
  }

  if (currentMusic) {
    const prevMusicAudio = currentMusicAudio
    const prevMusicGain = currentMusicGain
    prevMusicGain.gain.setValueAtTime(1, ctx.currentTime)
    // Ramp does not work in firefox
    prevMusicGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1)
    setTimeout(() => prevMusicAudio.stop(), 1000)
  }

  const audio = ctx.createBufferSource()
  audio.buffer = decodedAudio[music]
  audio.loop = loop
  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(0.001, ctx.currentTime)
  audio.connect(gainNode)
  gainNode.connect(ctx.destination)
  currentMusic = music
  currentMusicAudio = audio
  currentMusicGain = gainNode

  audio.start()
  gainNode.gain.exponentialRampToValueAtTime(1.0, ctx.currentTime + 0.5)
}
