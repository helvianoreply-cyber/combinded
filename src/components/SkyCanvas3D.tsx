import React, { useEffect, useRef } from 'react'

interface SkyCanvas3DProps {
  scrollProgress: number // 0 to 1
  manualTimeOverride?: number | null // 0 to 1 or null for auto
}

export const SkyCanvas3D: React.FC<SkyCanvas3DProps> = ({ scrollProgress, manualTimeOverride }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const mouseRef = useRef<{
    x: number
    y: number
    targetX: number
    targetY: number
    prevX: number
    prevY: number
    vx: number
    vy: number
  }>({
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5,
    prevX: 0.5,
    prevY: 0.5,
    vx: 0,
    vy: 0,
  })

  // Shooting stars array
  const shootingStarsRef = useRef<Array<{ x: number; y: number; length: number; speed: number; angle: number; opacity: number }>>([])

  // Starfield with realistic spectral classes
  const starsRef = useRef<Array<{ x: number; y: number; z: number; size: number; baseAlpha: number; twinkleSpeed: number; phase: number; r: number; g: number; b: number }>>([])

  // Photorealistic Volumetric Clouds
  const cloudsRef = useRef<Array<{ x: number; y: number; scale: number; speed: number; opacity: number; puffs: Array<{ ox: number; oy: number; r: number; alphaMult: number }> }>>([])

  // Grass blades across the entire green mountain slopes & ridges
  const mountainGrassRef = useRef<Array<{
    x: number
    yOffset: number
    height: number
    width: number
    lean: number
    bendSpeed: number
    phase: number
    shade: number
    flowerType: number
  }>>([])

  // Foreground swaying grass blades with natural wind wave physics
  const grassBladesRef = useRef<Array<{ x: number; height: number; width: number; lean: number; bendSpeed: number; phase: number; flowerType: number }>>([])

  // Dancing fireflies above grass at night
  const firefliesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; phase: number; size: number }>>([])

  // Interactive Cursor-Reactive Sakura Petals
  const sakuraPetalsRef = useRef<Array<{
    x: number
    y: number
    z: number
    vx: number
    vy: number
    rotation: number
    rotSpeed: number
    flip: number
    flipSpeed: number
    size: number
    opacity: number
  }>>([])

  // Animated 3D Fluttering Butterflies
  const butterfliesRef = useRef<Array<{
    x: number
    y: number
    z: number
    targetX: number
    targetY: number
    vx: number
    vy: number
    flapPhase: number
    flapSpeed: number
    scale: number
    type: number // 1: Monarch Orange, 2: Sakura Pink, 3: Azure Blue, 4: Mint
  }>>([])

  // Pre-computed mountain ridges and forest trees
  const terrainRef = useRef<{
    peaks: Array<{ x: number; y: number; snow: boolean }>
    midRidge: number[]
    trees: Array<{ x: number; h: number; type: number; shade: number }>
  }>({ peaks: [], midRidge: [], trees: [] })

  const effectiveProgress = manualTimeOverride !== undefined && manualTimeOverride !== null ? manualTimeOverride : scrollProgress
  const progressRef = useRef(effectiveProgress)
  useEffect(() => {
    progressRef.current = effectiveProgress
  }, [effectiveProgress])

  // Initialize all graphical entities
  useEffect(() => {
    // 1. 240 Spectral Stars
    const spectralPalette: Array<[number, number, number]> = [
      [255, 255, 255],
      [195, 225, 255],
      [255, 248, 220],
      [254, 215, 165],
      [255, 175, 150],
    ]
    const stars: Array<{ x: number; y: number; z: number; size: number; baseAlpha: number; twinkleSpeed: number; phase: number; r: number; g: number; b: number }> = []
    for (let i = 0; i < 240; i++) {
      const col = spectralPalette[Math.floor(Math.random() * spectralPalette.length)]
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.82,
        z: Math.random() * 0.85 + 0.15,
        size: Math.random() * 2.0 + 0.4,
        baseAlpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 2.8 + 1.2,
        phase: Math.random() * Math.PI * 2,
        r: col[0],
        g: col[1],
        b: col[2],
      })
    }
    starsRef.current = stars

    // 2. 18 Photorealistic Volumetric Clouds
    const clouds: Array<{ x: number; y: number; scale: number; speed: number; opacity: number; puffs: Array<{ ox: number; oy: number; r: number; alphaMult: number }> }> = []
    for (let i = 0; i < 18; i++) {
      const baseScale = Math.random() * 0.65 + 0.75
      const puffCount = Math.floor(Math.random() * 8) + 8
      const puffs: Array<{ ox: number; oy: number; r: number; alphaMult: number }> = []
      
      puffs.push({ ox: 0, oy: 0, r: 52, alphaMult: 1.0 })
      
      for (let j = 0; j < puffCount; j++) {
        puffs.push({
          ox: (Math.random() - 0.5) * 110,
          oy: (Math.random() - 0.45) * 40,
          r: Math.random() * 36 + 22,
          alphaMult: Math.random() * 0.45 + 0.55,
        })
      }

      clouds.push({
        x: Math.random() * 1.6 - 0.3,
        y: Math.random() * 0.5 + 0.03,
        scale: baseScale,
        speed: (Math.random() * 0.00018 + 0.0001) * (i % 2 === 0 ? 1 : 0.85),
        opacity: Math.random() * 0.35 + 0.6,
        puffs,
      })
    }
    cloudsRef.current = clouds

    // 3. Pre-generate Realistic Mountain Terrain with Multiple Ridge Layers & Detailed Trees
    const peaks: Array<{ x: number; y: number; snow: boolean }> = []
    const peakCount = 80
    for (let i = 0; i <= peakCount; i++) {
      const x = i / peakCount
      // More natural jagged peaks with multiple harmonics
      const y = Math.sin(x * 10) * 32
        + Math.cos(x * 18.5) * 18
        + Math.sin(x * 37 + 0.7) * 9
        + Math.cos(x * 55) * 4
        + Math.sin(x * 80 + 2.1) * 2.5
      peaks.push({ x, y, snow: y < -14 })
    }

    // Multiple ridgeline layers for depth
    const midRidge: number[] = []
    for (let i = 0; i <= 120; i++) {
      midRidge.push(
        Math.sin(i * 0.065 + 1.2) * 24
        + Math.cos(i * 0.18) * 14
        + Math.sin(i * 0.35 + 0.5) * 6
        + Math.cos(i * 0.7) * 3
      )
    }

    // Detailed trees with more variety: 1=pine, 2=deciduous round, 3=tall pine, 4=bush
    const trees: Array<{ x: number; h: number; type: number; shade: number }> = []
    for (let i = 0; i < 120; i++) {
      trees.push({
        x: Math.random(),
        h: Math.random() * 24 + 12,
        type: Math.random() < 0.4 ? 1 : Math.random() < 0.6 ? 2 : Math.random() < 0.8 ? 3 : 4,
        shade: Math.random() * 0.3 + 0.7,
      })
    }
    terrainRef.current = { peaks, midRidge, trees }

    // 4. Grass blades covering all slopes and ridges of the Green Mountain
    const mtnGrass: Array<{
      x: number
      yOffset: number
      height: number
      width: number
      lean: number
      bendSpeed: number
      phase: number
      shade: number
      flowerType: number
    }> = []
    for (let i = 0; i < 280; i++) {
      mtnGrass.push({
        x: Math.random(),
        yOffset: Math.random() * 65, // Distributed down the slope of the green mountain
        height: Math.random() * 18 + 10,
        width: Math.random() * 1.8 + 1.0,
        lean: (Math.random() - 0.5) * 12,
        bendSpeed: Math.random() * 2 + 1.4,
        phase: Math.random() * Math.PI * 2,
        shade: Math.random() * 0.35 + 0.75,
        flowerType: Math.random() < 0.1 ? (Math.random() < 0.5 ? 1 : 2) : 0,
      })
    }
    mountainGrassRef.current = mtnGrass

    // 5. 380 Realistic Swaying Grass Blades on Foreground Meadows with Wildflower Accents
    const grassBlades: Array<{ x: number; height: number; width: number; lean: number; bendSpeed: number; phase: number; flowerType: number }> = []
    for (let i = 0; i < 380; i++) {
      grassBlades.push({
        x: Math.random(),
        height: Math.random() * 30 + 16,
        width: Math.random() * 2.4 + 1.2,
        lean: (Math.random() - 0.5) * 15,
        bendSpeed: Math.random() * 2 + 1.6,
        phase: Math.random() * Math.PI * 2,
        flowerType: Math.random() < 0.1 ? (Math.random() < 0.5 ? 1 : 2) : 0,
      })
    }
    grassBladesRef.current = grassBlades

    // 6. 135 Interactive Cursor-Reactive Sakura Petals (Dynamic Flow & Multi-Depth)
    const petals: Array<{
      x: number
      y: number
      z: number
      vx: number
      vy: number
      rotation: number
      rotSpeed: number
      flip: number
      flipSpeed: number
      size: number
      opacity: number
    }> = []
    for (let i = 0; i < 135; i++) {
      petals.push({
        x: Math.random(),
        y: Math.random(),
        z: Math.random() * 0.85 + 0.15,
        vx: Math.random() * 0.0012 + 0.0004,
        vy: Math.random() * 0.0014 + 0.0006,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.035,
        flip: Math.random() * Math.PI * 2,
        flipSpeed: Math.random() * 0.045 + 0.02,
        size: Math.random() * 7 + 6,
        opacity: Math.random() * 0.4 + 0.6,
      })
    }
    sakuraPetalsRef.current = petals

    // 7. 6 Animated 3D Fluttering Butterflies
    const butterflies: Array<{
      x: number
      y: number
      z: number
      targetX: number
      targetY: number
      vx: number
      vy: number
      flapPhase: number
      flapSpeed: number
      scale: number
      type: number
    }> = []
    for (let i = 0; i < 6; i++) {
      butterflies.push({
        x: Math.random() * 0.8 + 0.1,
        y: Math.random() * 0.5 + 0.3,
        z: Math.random() * 0.6 + 0.4,
        targetX: Math.random() * 0.8 + 0.1,
        targetY: Math.random() * 0.5 + 0.3,
        vx: 0,
        vy: 0,
        flapPhase: Math.random() * Math.PI * 2,
        flapSpeed: Math.random() * 0.15 + 0.25,
        scale: Math.random() * 0.35 + 0.75,
        type: (i % 4) + 1, // 1: Monarch Orange, 2: Sakura Pink, 3: Azure Blue, 4: Mint
      })
    }
    butterfliesRef.current = butterflies

    // 8. 38 Bioluminescent Fireflies
    const fireflies: Array<{ x: number; y: number; vx: number; vy: number; phase: number; size: number }> = []
    for (let i = 0; i < 38; i++) {
      fireflies.push({
        x: Math.random(),
        y: 0.7 + Math.random() * 0.26,
        vx: (Math.random() - 0.5) * 0.0014,
        vy: (Math.random() - 0.5) * 0.0014,
        phase: Math.random() * Math.PI * 2,
        size: Math.random() * 2.2 + 1.5,
      })
    }
    firefliesRef.current = fireflies

    const handleMouseMove = (e: MouseEvent) => {
      const curX = e.clientX / window.innerWidth
      const curY = e.clientY / window.innerHeight
      mouseRef.current.vx = curX - mouseRef.current.targetX
      mouseRef.current.vy = curY - mouseRef.current.targetY
      mouseRef.current.targetX = curX
      mouseRef.current.targetY = curY
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    let lastTime = performance.now()
    let time = 0

    const render = (now?: number) => {
      const currentNow = typeof now === 'number' ? now : performance.now()
      const dt = Math.min(Math.max((currentNow - lastTime) / 1000, 0.001), 0.1)
      lastTime = currentNow
      time += dt

      // Mouse Parallax & Velocity Tracking
      mouseRef.current.prevX = mouseRef.current.x
      mouseRef.current.prevY = mouseRef.current.y
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08

      const mouseParallaxX = (mouseRef.current.x - 0.5) * 45
      const mouseParallaxY = (mouseRef.current.y - 0.5) * 30

      // Cursor pixel coordinates for petal collision / repulsion
      const mousePxX = mouseRef.current.x * width
      const mousePxY = mouseRef.current.y * height
      const mouseVelX = (mouseRef.current.x - mouseRef.current.prevX) * width
      const mouseVelY = (mouseRef.current.y - mouseRef.current.prevY) * height

      // Progress: 0.0 (Morning Sky Blue) to 1.0 (Cosmic Midnight)
      const p = Math.max(0, Math.min(1, progressRef.current))

      // =========================================================
      // 1. COLOR PALETTE INTERPOLATION
      // =========================================================
      let skyZenith: [number, number, number]
      let skyMid: [number, number, number]
      let skyHorizon: [number, number, number]
      let hazeColor: [number, number, number]
      let sunAlpha = 1
      let moonAlpha = 0
      let starsAlpha = 0
      let cloudLitColor: [number, number, number]
      let cloudShadColor: [number, number, number]
      let mountainCol1: [number, number, number]
      let mountainCol2: [number, number, number]
      let grassBaseCol: [number, number, number]
      let grassTipCol: [number, number, number]

      if (p < 0.33) {
        // --- MORNING SKY BLUE TO RADIANT DAYLIGHT ---
        const t = p / 0.33
        skyZenith = lerpColor([10, 120, 220], [22, 135, 230], t)
        skyMid = lerpColor([75, 190, 250], [242, 165, 180], t)
        skyHorizon = lerpColor([255, 244, 210], [255, 215, 170], t)
        hazeColor = lerpColor([235, 248, 255], [255, 235, 215], t)

        sunAlpha = 1
        moonAlpha = 0
        starsAlpha = Math.max(0, (1 - t * 4) * 0.1)

        cloudLitColor = [255, 255, 255]
        cloudShadColor = lerpColor([190, 215, 235], [215, 190, 200], t)

        mountainCol1 = lerpColor([90, 155, 190], [120, 125, 150], t)
        mountainCol2 = lerpColor([35, 125, 65], [48, 145, 75], t) // Lush Green Mountain

        grassBaseCol = lerpColor([16, 92, 45], [22, 85, 42], t)
        grassTipCol = lerpColor([34, 197, 94], [74, 222, 128], t)
      } else if (p < 0.66) {
        // --- DAYLIGHT TO EVENING SUNSET PINK & DUSK ---
        const t = (p - 0.33) / 0.33
        skyZenith = lerpColor([22, 135, 230], [36, 16, 62], t)
        skyMid = lerpColor([242, 165, 180], [192, 68, 118], t)
        skyHorizon = lerpColor([255, 215, 170], [246, 168, 158], t)
        hazeColor = lerpColor([255, 235, 215], [242, 145, 165], t)

        sunAlpha = 1 - t * 0.75
        moonAlpha = t * 0.45
        starsAlpha = t * 0.45

        cloudLitColor = lerpColor([255, 242, 228], [255, 188, 198], t)
        cloudShadColor = lerpColor([215, 190, 200], [138, 78, 112], t)

        mountainCol1 = lerpColor([120, 125, 150], [68, 32, 68], t)
        mountainCol2 = lerpColor([48, 145, 75], [58, 62, 38], t)

        grassBaseCol = lerpColor([22, 85, 42], [48, 32, 22], t)
        grassTipCol = lerpColor([74, 222, 128], [145, 98, 48], t)
      } else {
        // --- SUNSET PINK TO DEEP COSMIC MIDNIGHT ---
        const t = (p - 0.66) / 0.34
        skyZenith = lerpColor([36, 16, 62], [8, 4, 18], t)
        skyMid = lerpColor([192, 68, 118], [25, 10, 44], t)
        skyHorizon = lerpColor([246, 168, 158], [15, 6, 30], t)
        hazeColor = lerpColor([242, 145, 165], [32, 16, 48], t)

        sunAlpha = Math.max(0, 0.25 * (1 - t * 3))
        moonAlpha = 0.45 + t * 0.55
        starsAlpha = 0.45 + t * 0.55

        cloudLitColor = lerpColor([255, 188, 198], [98, 78, 128], t)
        cloudShadColor = lerpColor([138, 78, 112], [36, 20, 52], t)

        mountainCol1 = lerpColor([68, 32, 68], [15, 8, 24], t)
        mountainCol2 = lerpColor([58, 62, 38], [12, 28, 18], t)

        grassBaseCol = lerpColor([48, 32, 22], [6, 18, 12], t)
        grassTipCol = lerpColor([145, 98, 48], [16, 45, 28], t)
      }

      // =========================================================
      // 2. RENDER PHYSICAL SKY GRADIENT
      // =========================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height)
      skyGrad.addColorStop(0, `rgb(${skyZenith[0]}, ${skyZenith[1]}, ${skyZenith[2]})`)
      skyGrad.addColorStop(0.38, `rgb(${skyMid[0]}, ${skyMid[1]}, ${skyMid[2]})`)
      skyGrad.addColorStop(0.82, `rgb(${skyHorizon[0]}, ${skyHorizon[1]}, ${skyHorizon[2]})`)
      skyGrad.addColorStop(1, `rgb(${hazeColor[0]}, ${hazeColor[1]}, ${hazeColor[2]})`)
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, width, height)

      // =========================================================
      // 3. CINEMATIC SUN (With Real-Life Flare & God Rays)
      // =========================================================
      if (sunAlpha > 0.01) {
        const sunX = width * (0.76 - p * 0.48) + mouseParallaxX * 0.35
        const sunY = height * (0.18 + p * 0.65) + mouseParallaxY * 0.35
        const sunRadius = Math.max(26, 44 - p * 12)

        // God Rays
        if (p < 0.6) {
          ctx.save()
          const rayCount = 10
          for (let i = 0; i < rayCount; i++) {
            const angle = (i * Math.PI) / (rayCount / 2) + time * 0.015
            const rayLength = height * 0.65
            const rayGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, rayLength)
            rayGrad.addColorStop(0, `rgba(255, 248, 215, ${0.2 * sunAlpha * (1 - p * 0.85)})`)
            rayGrad.addColorStop(0.5, `rgba(254, 215, 160, ${0.08 * sunAlpha * (1 - p * 0.85)})`)
            rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')

            ctx.fillStyle = rayGrad
            ctx.beginPath()
            ctx.moveTo(sunX, sunY)
            ctx.arc(sunX, sunY, rayLength, angle - 0.07, angle + 0.07)
            ctx.closePath()
            ctx.fill()
          }
          ctx.restore()
        }

        // Anamorphic Flare Streak
        const flareWidth = width * (0.5 - p * 0.15)
        const flareGrad = ctx.createLinearGradient(sunX - flareWidth, sunY, sunX + flareWidth, sunY)
        flareGrad.addColorStop(0, 'rgba(255, 255, 255, 0)')
        flareGrad.addColorStop(0.5, `rgba(255, 250, 225, ${0.4 * sunAlpha})`)
        flareGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = flareGrad
        ctx.fillRect(sunX - flareWidth, sunY - 2.5, flareWidth * 2, 5)

        // Corona Glow
        const outerGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 6)
        outerGlow.addColorStop(0, `rgba(255, 250, 230, ${0.92 * sunAlpha})`)
        outerGlow.addColorStop(0.25, `rgba(254, 220, 150, ${0.55 * sunAlpha})`)
        outerGlow.addColorStop(0.65, `rgba(246, 168, 158, ${0.22 * sunAlpha})`)
        outerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = outerGlow
        ctx.beginPath()
        ctx.arc(sunX, sunY, sunRadius * 6, 0, Math.PI * 2)
        ctx.fill()

        // Pure Sun Disk
        ctx.fillStyle = `rgba(255, 255, 252, ${sunAlpha})`
        ctx.beginPath()
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      // =========================================================
      // 4. PHOTOREALISTIC MOON (Craters, Halo, Crescent)
      // =========================================================
      if (moonAlpha > 0.05) {
        const moonProgress = Math.max(0, (p - 0.4) / 0.6)
        const moonX = width * (0.84 - moonProgress * 0.16) + mouseParallaxX * 0.25
        const moonY = height * (0.82 - moonProgress * 0.64) + mouseParallaxY * 0.25
        const moonRadius = 28

        const moonHalo = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonRadius * 4.2)
        moonHalo.addColorStop(0, `rgba(215, 235, 255, ${0.58 * moonAlpha})`)
        moonHalo.addColorStop(0.5, `rgba(160, 190, 245, ${0.2 * moonAlpha})`)
        moonHalo.addColorStop(1, 'rgba(160, 190, 245, 0)')
        ctx.fillStyle = moonHalo
        ctx.beginPath()
        ctx.arc(moonX, moonY, moonRadius * 4.2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(248, 252, 255, ${0.95 * moonAlpha})`
        ctx.beginPath()
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(175, 192, 215, ${0.38 * moonAlpha})`
        ctx.beginPath()
        ctx.arc(moonX - 7, moonY - 6, 7, 0, Math.PI * 2)
        ctx.arc(moonX + 6, moonY + 5, 8, 0, Math.PI * 2)
        ctx.arc(moonX - 5, moonY + 8, 5, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(${skyZenith[0]}, ${skyZenith[1]}, ${skyZenith[2]}, ${0.88 * moonAlpha})`
        ctx.beginPath()
        ctx.arc(moonX + 8, moonY - 4, moonRadius * 0.92, 0, Math.PI * 2)
        ctx.fill()
      }

      // =========================================================
      // 5. STELLAR NEBULA & 3D SPECTRAL STARS
      // =========================================================
      if (starsAlpha > 0.05) {
        ctx.save()

        if (p > 0.68) {
          const nebulaAlpha = (p - 0.68) / 0.32
          const nebulaGrad = ctx.createLinearGradient(width * 0.15, 0, width * 0.85, height * 0.65)
          nebulaGrad.addColorStop(0, 'rgba(147, 51, 234, 0)')
          nebulaGrad.addColorStop(0.3, `rgba(168, 85, 247, ${0.14 * nebulaAlpha})`)
          nebulaGrad.addColorStop(0.6, `rgba(96, 165, 250, ${0.12 * nebulaAlpha})`)
          nebulaGrad.addColorStop(1, 'rgba(236, 72, 153, 0)')
          ctx.fillStyle = nebulaGrad
          ctx.fillRect(0, 0, width, height * 0.7)
        }

        for (let i = 0; i < starsRef.current.length; i++) {
          const star = starsRef.current[i]
          const twinkle = (Math.sin(time * star.twinkleSpeed + star.phase) + 1) * 0.5
          const alpha = star.baseAlpha * starsAlpha * (0.4 + twinkle * 0.6)

          const starX = star.x * width + mouseParallaxX * star.z * 0.5
          const starY = star.y * height + mouseParallaxY * star.z * 0.5

          ctx.fillStyle = `rgba(${star.r}, ${star.g}, ${star.b}, ${alpha})`
          ctx.beginPath()
          ctx.arc(starX, starY, star.size * star.z, 0, Math.PI * 2)
          ctx.fill()

          if (star.size > 1.3 && twinkle > 0.65) {
            ctx.strokeStyle = `rgba(${star.r}, ${star.g}, ${star.b}, ${alpha * 0.75})`
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(starX - 4.5, starY)
            ctx.lineTo(starX + 4.5, starY)
            ctx.moveTo(starX, starY - 4.5)
            ctx.lineTo(starX + 4.5, starY)
            ctx.stroke()
          }
        }
        ctx.restore()
      }

      // =========================================================
      // 6. SHOOTING STARS / METEORS
      // =========================================================
      if (p > 0.65 && Math.random() < 0.016 && shootingStarsRef.current.length < 3) {
        shootingStarsRef.current.push({
          x: Math.random() * width * 0.8 + width * 0.1,
          y: Math.random() * height * 0.35,
          length: Math.random() * 95 + 60,
          speed: Math.random() * 14 + 10,
          angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
          opacity: 1,
        })
      }

      for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
        const s = shootingStarsRef.current[i]
        const tailX = s.x - Math.cos(s.angle) * s.length
        const tailY = s.y - Math.sin(s.angle) * s.length

        const starGrad = ctx.createLinearGradient(s.x, s.y, tailX, tailY)
        starGrad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`)
        starGrad.addColorStop(0.3, `rgba(254, 215, 170, ${s.opacity * 0.8})`)
        starGrad.addColorStop(1, 'rgba(254, 215, 170, 0)')

        ctx.strokeStyle = starGrad
        ctx.lineWidth = 1.8
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(tailX, tailY)
        ctx.stroke()

        s.x += Math.cos(s.angle) * s.speed
        s.y += Math.sin(s.angle) * s.speed
        s.opacity -= 0.02

        if (s.opacity <= 0 || s.x > width || s.y > height) {
          shootingStarsRef.current.splice(i, 1)
        }
      }

      // =========================================================
      // 7. PHOTOREALISTIC VOLUMETRIC CLOUDS
      // =========================================================
      ctx.save()
      for (let i = 0; i < cloudsRef.current.length; i++) {
        const cloud = cloudsRef.current[i]
        cloud.x += cloud.speed
        if (cloud.x > 1.35) cloud.x = -0.35

        const cx = cloud.x * width + mouseParallaxX * cloud.scale * 0.4
        const cy = cloud.y * height + mouseParallaxY * cloud.scale * 0.4

        const cloudAlpha = cloud.opacity * (0.45 + (1 - p * 0.3) * 0.55)
        renderPhotorealisticCloud(ctx, cx, cy, cloud.scale, cloudLitColor, cloudShadColor, cloudAlpha, cloud.puffs)
      }
      ctx.restore()

      // =========================================================
      // 8. PHOTOREALISTIC ALPINE MOUNTAIN PEAKS & GREEN MOUNTAIN GRASS SLOPES
      // =========================================================
      renderPhotorealisticMountains(
        ctx,
        width,
        height,
        time,
        terrainRef.current,
        mountainGrassRef.current,
        mouseParallaxX,
        mountainCol1,
        mountainCol2,
        grassBaseCol,
        grassTipCol,
        p
      )

      // =========================================================
      // 9. ROLLING MEADOW HILLS & SWAYING FOREGROUND GRASS
      // =========================================================
      renderPhotorealisticMeadow(ctx, width, height, time, p, mouseParallaxX, grassBaseCol, grassTipCol, grassBladesRef.current)

      // =========================================================
      // 10. INTERACTIVE CURSOR-REACTIVE SAKURA PETALS ENGINE
      // =========================================================
      renderReactiveSakuraPetals(
        ctx,
        width,
        height,
        time,
        p,
        mousePxX,
        mousePxY,
        mouseVelX,
        mouseVelY,
        sakuraPetalsRef.current
      )

      // =========================================================
      // 11. ANIMATED 3D FLUTTERING BUTTERFLIES
      // =========================================================
      renderAnimatedButterflies(ctx, width, height, time, p, mouseParallaxX, mouseParallaxY, butterfliesRef.current)

      // =========================================================
      // 12. BIOLUMINESCENT FIREFLIES AT NIGHT
      // =========================================================
      if (p > 0.5) {
        const fireflyAlpha = Math.min(1, (p - 0.5) / 0.5)
        ctx.save()
        for (let i = 0; i < firefliesRef.current.length; i++) {
          const f = firefliesRef.current[i]
          f.x += f.vx + Math.sin(time * 2.2 + f.phase) * 0.0007
          f.y += f.vy + Math.cos(time * 2.2 + f.phase) * 0.0007

          if (f.x < 0) f.x = 1
          if (f.x > 1) f.x = 0
          if (f.y < 0.7) f.y = 0.95
          if (f.y > 0.98) f.y = 0.72

          const fx = f.x * width + mouseParallaxX * 0.25
          const fy = f.y * height
          const glow = (Math.sin(time * 3.5 + f.phase) + 1) * 0.5
          const alpha = glow * fireflyAlpha * 0.9

          const flyGlow = ctx.createRadialGradient(fx, fy, 0, fx, fy, f.size * 4)
          flyGlow.addColorStop(0, `rgba(187, 247, 208, ${alpha})`)
          flyGlow.addColorStop(0.4, `rgba(134, 239, 172, ${alpha * 0.65})`)
          flyGlow.addColorStop(1, 'rgba(134, 239, 172, 0)')

          ctx.fillStyle = flyGlow
          ctx.beginPath()
          ctx.arc(fx, fy, f.size * 4, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = `rgba(255, 255, 245, ${alpha})`
          ctx.beginPath()
          ctx.arc(fx, fy, f.size * 0.85, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="sky-canvas-3d"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    />
  )
}

// =========================================================
// GRAPHICAL & SIMULATION HELPERS
// =========================================================

function lerpColor(c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ]
}

function renderPhotorealisticCloud(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  sunlitColor: [number, number, number],
  shadowColor: [number, number, number],
  alpha: number,
  puffs: Array<{ ox: number; oy: number; r: number; alphaMult: number }>
) {
  if (alpha <= 0.01) return

  for (let i = 0; i < puffs.length; i++) {
    const p = puffs[i]
    const px = cx + p.ox * scale
    const py = cy + (p.oy + 9) * scale
    const pr = p.r * scale

    const shadGrad = ctx.createRadialGradient(px, py, 0, px, py, pr)
    shadGrad.addColorStop(0, `rgba(${shadowColor[0]}, ${shadowColor[1]}, ${shadowColor[2]}, ${alpha * p.alphaMult * 0.7})`)
    shadGrad.addColorStop(0.7, `rgba(${shadowColor[0]}, ${shadowColor[1]}, ${shadowColor[2]}, ${alpha * p.alphaMult * 0.28})`)
    shadGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.fillStyle = shadGrad
    ctx.beginPath()
    ctx.arc(px, py, pr, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < puffs.length; i++) {
    const p = puffs[i]
    const px = cx + p.ox * scale
    const py = cy + (p.oy - 5) * scale
    const pr = p.r * scale

    const litGrad = ctx.createRadialGradient(px - pr * 0.2, py - pr * 0.2, 0, px, py, pr)
    litGrad.addColorStop(0, `rgba(${sunlitColor[0]}, ${sunlitColor[1]}, ${sunlitColor[2]}, ${alpha * p.alphaMult * 0.88})`)
    litGrad.addColorStop(0.65, `rgba(${sunlitColor[0]}, ${sunlitColor[1]}, ${sunlitColor[2]}, ${alpha * p.alphaMult * 0.42})`)
    litGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.fillStyle = litGrad
    ctx.beginPath()
    ctx.arc(px, py, pr, 0, Math.PI * 2)
    ctx.fill()
  }
}

function renderPhotorealisticMountains(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  terrain: {
    peaks: Array<{ x: number; y: number; snow: boolean }>
    midRidge: number[]
    trees: Array<{ x: number; h: number; type: number; shade: number }>
  },
  mountainGrass: Array<{
    x: number
    yOffset: number
    height: number
    width: number
    lean: number
    bendSpeed: number
    phase: number
    shade: number
    flowerType: number
  }>,
  parallaxX: number,
  mCol1: [number, number, number],
  mCol2: [number, number, number],
  grassBaseCol: [number, number, number],
  grassTipCol: [number, number, number],
  progress: number
) {
  // ── Layer 0: Distant atmospheric haze band ──
  const hazeY = height * 0.74
  const hazeGrad = ctx.createLinearGradient(0, hazeY - 30, 0, hazeY + 25)
  hazeGrad.addColorStop(0, 'rgba(180, 200, 230, 0)')
  hazeGrad.addColorStop(0.5, `rgba(180, 200, 230, ${progress < 0.5 ? 0.18 : 0.06})`)
  hazeGrad.addColorStop(1, 'rgba(180, 200, 230, 0)')
  ctx.fillStyle = hazeGrad
  ctx.fillRect(0, hazeY - 30, width, 55)

  // ── Layer 1: Distant Alpine Mountain Peaks with rock texturing ──
  ctx.save()
  const baseH1 = height * 0.78
  
  // Main mountain fill with vertical gradient for depth
  const mtnGrad1 = ctx.createLinearGradient(0, baseH1 - 45, 0, baseH1 + 55)
  mtnGrad1.addColorStop(0, `rgb(${mCol1[0]}, ${mCol1[1]}, ${mCol1[2]})`)
  mtnGrad1.addColorStop(0.6, `rgb(${Math.max(0, mCol1[0] - 15)}, ${Math.max(0, mCol1[1] - 10)}, ${Math.max(0, mCol1[2] - 8)})`)
  mtnGrad1.addColorStop(1, `rgb(${Math.max(0, mCol1[0] - 25)}, ${Math.max(0, mCol1[1] - 18)}, ${Math.max(0, mCol1[2] - 12)})`)
  ctx.fillStyle = mtnGrad1
  
  ctx.beginPath()
  ctx.moveTo(0, height)
  for (let i = 0; i < terrain.peaks.length; i++) {
    const pk = terrain.peaks[i]
    const x = pk.x * width
    const y = baseH1 + pk.y + parallaxX * 0.008
    ctx.lineTo(x, y)
  }
  ctx.lineTo(width, height)
  ctx.closePath()
  ctx.fill()

  // Rock face texture lines on steep mountain slopes
  ctx.save()
  ctx.globalAlpha = progress < 0.5 ? 0.12 : 0.06
  ctx.strokeStyle = `rgb(${Math.max(0, mCol1[0] - 35)}, ${Math.max(0, mCol1[1] - 28)}, ${Math.max(0, mCol1[2] - 20)})`
  ctx.lineWidth = 0.6
  for (let i = 1; i < terrain.peaks.length - 1; i++) {
    const pk = terrain.peaks[i]
    const x = pk.x * width
    const y = baseH1 + pk.y + parallaxX * 0.008
    // Draw subtle rock striations from peak downward
    if (pk.y < -5) {
      for (let j = 0; j < 3; j++) {
        const ox = (Math.random() - 0.5) * 16
        ctx.beginPath()
        ctx.moveTo(x + ox, y + 2)
        ctx.lineTo(x + ox + (Math.random() - 0.5) * 10, y + 18 + Math.random() * 14)
        ctx.stroke()
      }
    }
  }
  ctx.restore()

  // Realistic snow caps with soft edges
  if (progress < 0.75) {
    ctx.save()
    const snowAlpha = progress < 0.35 ? 0.55 : 0.3
    for (let i = 1; i < terrain.peaks.length - 1; i++) {
      const pk = terrain.peaks[i]
      if (pk.snow) {
        const x = pk.x * width
        const y = baseH1 + pk.y + parallaxX * 0.008
        
        // Soft snow gradient instead of flat triangle
        const snowGrad = ctx.createLinearGradient(x, y - 4, x, y + 20)
        snowGrad.addColorStop(0, `rgba(255, 255, 255, ${snowAlpha})`)
        snowGrad.addColorStop(0.5, `rgba(240, 248, 255, ${snowAlpha * 0.7})`)
        snowGrad.addColorStop(1, `rgba(220, 235, 250, 0)`)
        ctx.fillStyle = snowGrad
        
        // Organic snow shape (wider, softer)
        ctx.beginPath()
        ctx.moveTo(x - 2, y - 2)
        ctx.quadraticCurveTo(x - 16, y + 6, x - 18, y + 18)
        ctx.lineTo(x + 18, y + 18)
        ctx.quadraticCurveTo(x + 16, y + 6, x + 2, y - 2)
        ctx.closePath()
        ctx.fill()
      }
    }
    ctx.restore()
  }
  ctx.restore()

  // ── Layer 2: Midground Rolling Green Mountain with depth gradient ──
  ctx.save()
  const baseH2 = height * 0.83
  const mtnGrad = ctx.createLinearGradient(0, baseH2 - 50, 0, height)
  mtnGrad.addColorStop(0, `rgb(${mCol2[0]}, ${mCol2[1]}, ${mCol2[2]})`)
  mtnGrad.addColorStop(0.3, `rgb(${grassBaseCol[0]}, ${grassBaseCol[1]}, ${grassBaseCol[2]})`)
  mtnGrad.addColorStop(0.7, `rgb(${Math.max(0, grassBaseCol[0] - 8)}, ${Math.max(0, grassBaseCol[1] - 5)}, ${Math.max(0, grassBaseCol[2] - 8)})`)
  mtnGrad.addColorStop(1, `rgb(${Math.max(0, grassBaseCol[0] - 18)}, ${Math.max(0, grassBaseCol[1] - 15)}, ${Math.max(0, grassBaseCol[2] - 18)})`)
  ctx.fillStyle = mtnGrad

  ctx.beginPath()
  ctx.moveTo(0, height)
  const step2 = width / (terrain.midRidge.length - 1)
  for (let i = 0; i < terrain.midRidge.length; i++) {
    const x = i * step2
    const y = baseH2 + terrain.midRidge[i] - parallaxX * 0.012
    ctx.lineTo(x, y)
  }
  ctx.lineTo(width, height)
  ctx.closePath()
  ctx.fill()

  // Subtle horizontal terrain texture bands for realism
  ctx.save()
  ctx.globalAlpha = 0.06
  for (let band = 0; band < 5; band++) {
    const bandY = baseH2 + 12 + band * 14
    ctx.fillStyle = band % 2 === 0
      ? `rgb(${Math.max(0, grassBaseCol[0] - 18)}, ${Math.max(0, grassBaseCol[1] - 12)}, ${Math.max(0, grassBaseCol[2] - 18)})`
      : `rgb(${Math.min(255, grassBaseCol[0] + 8)}, ${Math.min(255, grassBaseCol[1] + 12)}, ${Math.min(255, grassBaseCol[2] + 5)})`
    ctx.fillRect(0, bandY, width, 6)
  }
  ctx.restore()

  // Mountain grass blades with wind animation
  ctx.save()
  const wind = Math.sin(time * 2.2) * 5 + Math.cos(time * 1.1) * 2.5
  for (let i = 0; i < mountainGrass.length; i++) {
    const mg = mountainGrass[i]
    const gx = mg.x * width
    const ridgeY = baseH2 + Math.sin(mg.x * 6.28 + 1.2) * 20 - parallaxX * 0.012
    const gy = ridgeY + mg.yOffset

    if (gy < height) {
      const sway = Math.sin(time * mg.bendSpeed + mg.phase) * 4 + wind + mg.lean
      const tipX = gx + sway
      const tipY = gy - mg.height

      const gBladeGrad = ctx.createLinearGradient(gx, gy, tipX, tipY)
      gBladeGrad.addColorStop(0, `rgba(${grassBaseCol[0]}, ${grassBaseCol[1]}, ${grassBaseCol[2]}, 0.85)`)
      gBladeGrad.addColorStop(1, `rgba(${Math.round(grassTipCol[0] * mg.shade)}, ${Math.round(grassTipCol[1] * mg.shade)}, ${Math.round(grassTipCol[2] * mg.shade)}, 0.95)`)

      ctx.strokeStyle = gBladeGrad
      ctx.lineWidth = mg.width
      ctx.beginPath()
      ctx.moveTo(gx, gy)
      ctx.quadraticCurveTo(gx + sway * 0.4, gy - mg.height * 0.5, tipX, tipY)
      ctx.stroke()

      // Alpine wildflowers
      if (mg.flowerType > 0 && progress < 0.75) {
        const flowerCol = mg.flowerType === 1 ? 'rgba(250, 204, 21, 0.85)' : 'rgba(244, 63, 94, 0.85)'
        ctx.fillStyle = flowerCol
        ctx.beginPath()
        ctx.arc(tipX, tipY, 2.0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  ctx.restore()

  // ── Forest Trees with realistic shapes, trunks, and canopy detail ──
  // Sort trees by x for natural depth layering
  const sortedTrees = [...terrain.trees].sort((a, b) => a.x - b.x)
  
  for (let i = 0; i < sortedTrees.length; i++) {
    const tree = sortedTrees[i]
    const tx = tree.x * width
    const ty = baseH2 + Math.sin(tree.x * 6.28) * 18 - parallaxX * 0.012
    const th = tree.h

    // Tree trunk
    const trunkW = th * 0.06 + 1
    const trunkH = th * 0.35
    const trunkCol = `rgb(${Math.max(0, Math.round(75 * tree.shade))}, ${Math.max(0, Math.round(55 * tree.shade))}, ${Math.max(0, Math.round(35 * tree.shade))})`
    ctx.fillStyle = trunkCol
    ctx.fillRect(tx - trunkW / 2, ty - trunkH, trunkW, trunkH)

    // Canopy color with variation
    const cr = Math.max(0, Math.round(mCol2[0] * tree.shade - 20))
    const cg = Math.max(0, Math.round(mCol2[1] * tree.shade - 10))
    const cb = Math.max(0, Math.round(mCol2[2] * tree.shade - 20))
    const canopyDark = `rgb(${cr}, ${cg}, ${cb})`
    const canopyLit = `rgb(${Math.min(255, cr + 22)}, ${Math.min(255, cg + 28)}, ${Math.min(255, cb + 15)})`

    if (tree.type === 1) {
      // Pine/Conifer — layered triangles
      ctx.fillStyle = canopyDark
      ctx.beginPath()
      ctx.moveTo(tx, ty - th)
      ctx.lineTo(tx - th * 0.28, ty - th * 0.35)
      ctx.lineTo(tx + th * 0.28, ty - th * 0.35)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = canopyLit
      ctx.beginPath()
      ctx.moveTo(tx, ty - th * 0.8)
      ctx.lineTo(tx - th * 0.34, ty - th * 0.15)
      ctx.lineTo(tx + th * 0.34, ty - th * 0.15)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = canopyDark
      ctx.beginPath()
      ctx.moveTo(tx, ty - th * 0.6)
      ctx.lineTo(tx - th * 0.38, ty + 2)
      ctx.lineTo(tx + th * 0.38, ty + 2)
      ctx.closePath()
      ctx.fill()
    } else if (tree.type === 2) {
      // Deciduous — natural round canopy with highlight
      const canopyR = th * 0.42
      ctx.fillStyle = canopyDark
      ctx.beginPath()
      ctx.arc(tx, ty - th * 0.55, canopyR, 0, Math.PI * 2)
      ctx.fill()
      // Sunlit highlight
      ctx.fillStyle = canopyLit
      ctx.beginPath()
      ctx.arc(tx - canopyR * 0.25, ty - th * 0.62, canopyR * 0.6, 0, Math.PI * 2)
      ctx.fill()
    } else if (tree.type === 3) {
      // Tall narrow pine/spruce
      ctx.fillStyle = canopyDark
      ctx.beginPath()
      ctx.moveTo(tx, ty - th * 1.1)
      ctx.lineTo(tx - th * 0.2, ty - th * 0.1)
      ctx.lineTo(tx + th * 0.2, ty - th * 0.1)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = canopyLit
      ctx.beginPath()
      ctx.moveTo(tx, ty - th)
      ctx.lineTo(tx - th * 0.15, ty - th * 0.4)
      ctx.lineTo(tx + th * 0.15, ty - th * 0.4)
      ctx.closePath()
      ctx.fill()
    } else {
      // Bush — low wide cluster
      ctx.fillStyle = canopyDark
      ctx.beginPath()
      ctx.ellipse(tx, ty - th * 0.25, th * 0.4, th * 0.25, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = canopyLit
      ctx.beginPath()
      ctx.ellipse(tx - th * 0.1, ty - th * 0.32, th * 0.22, th * 0.15, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function renderPhotorealisticMeadow(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  progress: number,
  parallaxX: number,
  baseCol: [number, number, number],
  tipCol: [number, number, number],
  grassBlades: Array<{ x: number; height: number; width: number; lean: number; bendSpeed: number; phase: number; flowerType: number }>
) {
  ctx.save()
  
  // Richer multi-stop meadow gradient with depth
  const meadowGrad = ctx.createLinearGradient(0, height * 0.86, 0, height)
  meadowGrad.addColorStop(0, `rgb(${baseCol[0]}, ${baseCol[1]}, ${baseCol[2]})`)
  meadowGrad.addColorStop(0.35, `rgb(${Math.max(0, baseCol[0] - 6)}, ${Math.max(0, baseCol[1] - 4)}, ${Math.max(0, baseCol[2] - 8)})`)
  meadowGrad.addColorStop(0.7, `rgb(${Math.max(0, baseCol[0] - 14)}, ${Math.max(0, baseCol[1] - 10)}, ${Math.max(0, baseCol[2] - 16)})`)
  meadowGrad.addColorStop(1, `rgb(${Math.max(0, baseCol[0] - 24)}, ${Math.max(0, baseCol[1] - 20)}, ${Math.max(0, baseCol[2] - 28)})`)
  ctx.fillStyle = meadowGrad

  // Rolling hills with smoother bezier curve
  ctx.beginPath()
  ctx.moveTo(0, height)
  const baseMeadowY = height * 0.91
  for (let x = 0; x <= width; x += 8) {
    const wave = Math.sin(x * 0.003 + parallaxX * 0.015) * 18
      + Math.cos(x * 0.007) * 10
      + Math.sin(x * 0.015 + 0.8) * 5
    ctx.lineTo(x, baseMeadowY + wave)
  }
  ctx.lineTo(width, height)
  ctx.closePath()
  ctx.fill()

  // Subtle ground texture overlay
  ctx.save()
  ctx.globalAlpha = 0.04
  for (let tx = 0; tx < width; tx += 35) {
    const ty = baseMeadowY + Math.sin(tx * 0.003) * 18 + 12
    ctx.fillStyle = tx % 70 < 35
      ? `rgb(${Math.max(0, baseCol[0] - 22)}, ${Math.max(0, baseCol[1] - 16)}, ${Math.max(0, baseCol[2] - 22)})`
      : `rgb(${Math.min(255, baseCol[0] + 10)}, ${Math.min(255, baseCol[1] + 14)}, ${Math.min(255, baseCol[2] + 6)})`
    ctx.fillRect(tx, ty, 30, 8)
  }
  ctx.restore()

  // Grass blades with cubic bezier for more natural curves
  const wind = Math.sin(time * 2.5) * 8 + Math.cos(time * 1.2) * 4

  for (let i = 0; i < grassBlades.length; i++) {
    const blade = grassBlades[i]
    const bx = blade.x * width
    const by = baseMeadowY + Math.sin(blade.x * width * 0.003 + parallaxX * 0.015) * 18 + 8

    const sway = Math.sin(time * blade.bendSpeed + blade.phase) * 6 + wind + blade.lean
    const tipX = bx + sway
    const tipY = by - blade.height

    const bladeGrad = ctx.createLinearGradient(bx, by, tipX, tipY)
    bladeGrad.addColorStop(0, `rgb(${baseCol[0]}, ${baseCol[1]}, ${baseCol[2]})`)
    bladeGrad.addColorStop(0.6, `rgb(${Math.round((baseCol[0] + tipCol[0]) / 2)}, ${Math.round((baseCol[1] + tipCol[1]) / 2)}, ${Math.round((baseCol[2] + tipCol[2]) / 2)})`)
    bladeGrad.addColorStop(1, `rgb(${tipCol[0]}, ${tipCol[1]}, ${tipCol[2]})`)

    ctx.strokeStyle = bladeGrad
    ctx.lineWidth = blade.width
    ctx.beginPath()
    ctx.moveTo(bx, by)
    // Cubic bezier for more natural S-curve bending
    ctx.bezierCurveTo(
      bx + sway * 0.2, by - blade.height * 0.35,
      bx + sway * 0.7, by - blade.height * 0.7,
      tipX, tipY
    )
    ctx.stroke()

    // Wildflowers with petal detail
    if (blade.flowerType > 0 && progress < 0.75) {
      if (blade.flowerType === 1) {
        // Yellow daisy — 4 small petals around center
        ctx.fillStyle = 'rgba(250, 204, 21, 0.85)'
        for (let p = 0; p < 4; p++) {
          const angle = (p * Math.PI) / 2 + time * 0.2
          ctx.beginPath()
          ctx.arc(tipX + Math.cos(angle) * 2.2, tipY + Math.sin(angle) * 2.2, 1.4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = 'rgba(220, 160, 0, 0.9)'
        ctx.beginPath()
        ctx.arc(tipX, tipY, 1.2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Pink wildflower
        ctx.fillStyle = 'rgba(244, 63, 94, 0.8)'
        ctx.beginPath()
        ctx.arc(tipX, tipY, 2.8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255, 180, 200, 0.9)'
        ctx.beginPath()
        ctx.arc(tipX, tipY, 1.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Dew/light glint on blade tips
    if (progress < 0.7 && i % 5 === 0) {
      const glintAlpha = progress < 0.35 ? 0.55 : 0.25
      ctx.fillStyle = progress < 0.35 ? `rgba(255, 255, 255, ${glintAlpha})` : `rgba(254, 210, 170, ${glintAlpha})`
      ctx.beginPath()
      ctx.arc(tipX, tipY, 1.1, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
}

// =========================================================
// 10. SAKURA PETALS ENGINE (Flowing in wind & reactive to cursor)
// =========================================================
function renderReactiveSakuraPetals(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  progress: number,
  mouseX: number,
  mouseY: number,
  mouseVelX: number,
  mouseVelY: number,
  petals: Array<{
    x: number
    y: number
    z: number
    vx: number
    vy: number
    rotation: number
    rotSpeed: number
    flip: number
    flipSpeed: number
    size: number
    opacity: number
  }>
) {
  // Ambient lighting for petals based on time of day
  let petalBaseColor = '255, 175, 200'
  let petalEdgeColor = '255, 215, 230'
  if (progress > 0.4 && progress < 0.72) {
    petalBaseColor = '255, 150, 185'
    petalEdgeColor = '254, 210, 200'
  } else if (progress >= 0.72) {
    petalBaseColor = '230, 170, 220'
    petalEdgeColor = '200, 215, 255'
  }

  ctx.save()

  for (let i = 0; i < petals.length; i++) {
    const p = petals[i]

    // Screen coordinates
    let px = p.x * width
    let py = p.y * height

    // --- CURSOR REACTIVITY / WIND VORTEX FORCE ---
    const dx = px - mouseX
    const dy = py - mouseY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const reactionRadius = 140

    if (dist < reactionRadius && dist > 1) {
      const force = (1 - dist / reactionRadius) * 0.0035
      // Push petals away from cursor + add cursor drag velocity
      p.vx += (dx / dist) * force + (mouseVelX / width) * 0.06
      p.vy += (dy / dist) * force + (mouseVelY / height) * 0.06
      p.rotSpeed += (Math.random() - 0.5) * 0.08
    }

    // Natural breeze and gravity
    const windBreezeX = 0.0006 + Math.sin(time * 1.5 + p.y * 5) * 0.0003
    const windBreezeY = 0.0007 + Math.cos(time * 1.2 + p.x * 5) * 0.0002

    p.vx += windBreezeX * 0.08
    p.vy += windBreezeY * 0.08

    // Drag damping
    p.vx *= 0.95
    p.vy *= 0.95

    p.x += p.vx
    p.y += p.vy

    p.rotation += p.rotSpeed
    p.flip += p.flipSpeed

    // Wrap around screen boundaries seamlessly
    if (p.x > 1.05) { p.x = -0.05; p.y = Math.random() * 0.9 }
    if (p.x < -0.05) { p.x = 1.05; p.y = Math.random() * 0.9 }
    if (p.y > 1.05) { p.y = -0.05; p.x = Math.random() }
    if (p.y < -0.05) { p.y = 1.05; p.x = Math.random() }

    px = p.x * width
    py = p.y * height

    // 3D scale based on depth z and flip angle
    const scaleX = Math.cos(p.flip) * p.size * p.z
    const scaleY = p.size * p.z * 1.35

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(p.rotation)

    // Draw Realistic 5-Point Sakura Petal Geometry
    const petalGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, scaleY)
    petalGrad.addColorStop(0, `rgba(${petalEdgeColor}, ${p.opacity})`)
    petalGrad.addColorStop(0.65, `rgba(${petalBaseColor}, ${p.opacity * 0.9})`)
    petalGrad.addColorStop(1, `rgba(${petalBaseColor}, ${p.opacity * 0.3})`)

    ctx.fillStyle = petalGrad
    ctx.beginPath()
    // Organic heart-shaped sakura petal curve with notched tip
    ctx.moveTo(0, scaleY * 0.5)
    ctx.bezierCurveTo(scaleX * 0.85, scaleY * 0.3, scaleX * 0.95, -scaleY * 0.4, 0, -scaleY * 0.5)
    ctx.bezierCurveTo(-scaleX * 0.95, -scaleY * 0.4, -scaleX * 0.85, scaleY * 0.3, 0, scaleY * 0.5)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  ctx.restore()
}

// =========================================================
// 11. ANIMATED 3D FLUTTERING BUTTERFLIES
// =========================================================
function renderAnimatedButterflies(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  progress: number,
  parallaxX: number,
  parallaxY: number,
  butterflies: Array<{
    x: number
    y: number
    z: number
    targetX: number
    targetY: number
    vx: number
    vy: number
    flapPhase: number
    flapSpeed: number
    scale: number
    type: number
  }>
) {
  // During deep night, butterflies rest near the flowers
  if (progress > 0.82) return

  ctx.save()

  for (let i = 0; i < butterflies.length; i++) {
    const b = butterflies[i]

    // Periodic wandering destination change
    if (Math.random() < 0.015) {
      b.targetX = Math.random() * 0.8 + 0.1
      b.targetY = Math.random() * 0.45 + 0.25
    }

    // Steering velocity towards target
    const tx = b.targetX - b.x
    const ty = b.targetY - b.y
    b.vx += tx * 0.0003 + (Math.sin(time * 3 + i) * 0.0004)
    b.vy += ty * 0.0003 + (Math.cos(time * 2 + i) * 0.0003)

    b.vx *= 0.94
    b.vy *= 0.94

    b.x += b.vx
    b.y += b.vy

    b.flapPhase += b.flapSpeed

    const bx = b.x * width + parallaxX * b.z * 0.4
    const by = b.y * height + parallaxY * b.z * 0.4

    // 3D Wing Flap scale
    const wingFlap = Math.sin(b.flapPhase)
    const wingWidth = Math.abs(wingFlap) * 14 * b.scale * b.z
    const wingHeight = 18 * b.scale * b.z

    // Flight direction angle
    const flightAngle = Math.atan2(b.vy, b.vx) + Math.PI / 2

    ctx.save()
    ctx.translate(bx, by)
    ctx.rotate(flightAngle * 0.4)

    // Butterfly Colors
    let wingCol1 = '#f97316'
    let wingCol2 = '#fbbf24'
    let wingBorder = '#1c1917'

    if (b.type === 2) {
      // Sakura Blossom Pink
      wingCol1 = '#ec4899'
      wingCol2 = '#fbcfe8'
      wingBorder = '#831843'
    } else if (b.type === 3) {
      // Azure Cerulean Blue
      wingCol1 = '#2563eb'
      wingCol2 = '#93c5fd'
      wingBorder = '#1e3a8a'
    } else if (b.type === 4) {
      // Emerald Mint
      wingCol1 = '#059669'
      wingCol2 = '#6ee7b7'
      wingBorder = '#064e3b'
    }

    // Left Wing
    ctx.save()
    ctx.scale(wingFlap > 0 ? 1 : -1, 1)
    const leftWingGrad = ctx.createLinearGradient(-wingWidth, -wingHeight * 0.5, 0, wingHeight * 0.5)
    leftWingGrad.addColorStop(0, wingCol1)
    leftWingGrad.addColorStop(0.7, wingCol2)
    leftWingGrad.addColorStop(1, '#ffffff')

    ctx.fillStyle = leftWingGrad
    ctx.strokeStyle = wingBorder
    ctx.lineWidth = 1.2

    // Forewing
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(-wingWidth * 1.3, -wingHeight * 0.9, -wingWidth * 1.5, wingHeight * 0.2, 0, wingHeight * 0.3)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Hindwing
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(-wingWidth * 1.1, wingHeight * 0.4, -wingWidth * 0.9, wingHeight * 0.9, 0, wingHeight * 0.7)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.restore()

    // Right Wing
    ctx.save()
    ctx.scale(wingFlap > 0 ? -1 : 1, 1)
    const rightWingGrad = ctx.createLinearGradient(wingWidth, -wingHeight * 0.5, 0, wingHeight * 0.5)
    rightWingGrad.addColorStop(0, wingCol1)
    rightWingGrad.addColorStop(0.7, wingCol2)
    rightWingGrad.addColorStop(1, '#ffffff')

    ctx.fillStyle = rightWingGrad
    ctx.strokeStyle = wingBorder
    ctx.lineWidth = 1.2

    // Forewing
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(wingWidth * 1.3, -wingHeight * 0.9, wingWidth * 1.5, wingHeight * 0.2, 0, wingHeight * 0.3)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Hindwing
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(wingWidth * 1.1, wingHeight * 0.4, wingWidth * 0.9, wingHeight * 0.9, 0, wingHeight * 0.7)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.restore()

    // Butterfly Slim Body
    ctx.fillStyle = '#0f172a'
    ctx.beginPath()
    ctx.ellipse(0, 0, 1.8 * b.scale, 7 * b.scale, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  ctx.restore()
}
