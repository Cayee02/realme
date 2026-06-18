/* ==========================================================================
   REALMEOW LUCKY DRAW - CORE LOGIC & ANIMATIONS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // Element Selectors
    // ----------------------------------------------------------------------
    const cursorDot = document.getElementById('cursor-dot');
    const cursorOutline = document.getElementById('cursor-outline');
    const parallaxBg = document.getElementById('parallax-bg');
    const scrollHint = document.getElementById('scroll-hint');
    const mainCard = document.getElementById('main-card');
    const historyContainer = document.getElementById('history-container');
    const minInput = document.getElementById('min-val');
    const maxInput = document.getElementById('max-val');
    const drawBtn = document.getElementById('draw-btn');
    const winnerDisplay = document.getElementById('winner-display');
    const winnerDisplayContainer = document.getElementById('winner-display-container');
    const displayStatus = document.getElementById('display-status');
    const errorMessage = document.getElementById('error-message');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');
    const audioToggle = document.getElementById('audio-toggle');
    const audioOnIcon = audioToggle.querySelector('.audio-on');
    const audioOffIcon = audioToggle.querySelector('.audio-off');

    // Avatar elements
    const avatarWrapper = document.getElementById('avatar-wrapper');
    const avatarImg = document.getElementById('avatar-img');

    // Canvas declarations
    const particlesCanvas = document.getElementById('particles-canvas');
    const victoryCanvas = document.getElementById('victory-canvas');
    const pCtx = particlesCanvas.getContext('2d');
    const vCtx = victoryCanvas.getContext('2d');

    // ----------------------------------------------------------------------
    // State Variables
    // ----------------------------------------------------------------------
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let targetMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let currentCursorOutline = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let isDrawing = false;
    let scrollY = 0;
    let particlesArray = [];
    let victoryConfettiArray = [];
    let victoryExplosionRunning = false;
    let winnerHistory = JSON.parse(localStorage.getItem('realmeow_winners')) || [];

    // Avatar tilt state
    let avatarTiltX = 0;       // current tilt (degrees)
    let avatarTiltY = 0;
    let avatarTargetTiltX = 0; // lerp target
    let avatarTargetTiltY = 0;
    let avatarHovered = false;
    let avatarFloatPaused = false;

    // Setup reveal class for scroll effects
    mainCard.classList.add('scroll-reveal');
    historyContainer.classList.add('scroll-reveal');

    // Trigger reveal for elements already in viewport on load
    setTimeout(() => {
        document.querySelectorAll('.scroll-reveal').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 50) {
                el.classList.add('revealed');
            }
        });
    }, 100);

    // ----------------------------------------------------------------------
    // Synthesized Audio System (Web Audio API)
    // ----------------------------------------------------------------------
    class BrandSoundFX {
        constructor() {
            this.ctx = null;
            this.enabled = true; // Enabled by default
        }

        init() {
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        toggle(forceState) {
            this.enabled = forceState !== undefined ? forceState : !this.enabled;
            if (this.enabled) {
                this.init();
            }
            return this.enabled;
        }

        playTick(frequency = 600) {
            if (!this.enabled) return;
            this.init();
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(frequency, now);
                osc.frequency.exponentialRampToValueAtTime(frequency * 0.4, now + 0.04);

                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.05);
            } catch (e) {
                console.error("Audio playback error", e);
            }
        }

        playSuspenseDrumroll(duration = 0.05) {
            if (!this.enabled) return;
            this.init();
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(80 + Math.random() * 50, now);

                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + duration);
            } catch (e) {
                console.error("Audio playback error", e);
            }
        }

        playVictoryFanfare() {
            if (!this.enabled) return;
            this.init();
            try {
                const now = this.ctx.currentTime;

                // C Major 9 chord (C4, E4, G4, B4, D5) to sound retro-futuristic
                const frequencies = [261.63, 329.63, 392.00, 493.88, 587.33];

                frequencies.forEach((freq, idx) => {
                    const delay = idx * 0.07;
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + delay);

                    // Pitch bend slightly upward
                    osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + delay + 0.4);

                    gain.gain.setValueAtTime(0, now + delay);
                    gain.gain.linearRampToValueAtTime(0.15, now + delay + 0.03);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);

                    osc.start(now + delay);
                    osc.stop(now + delay + 0.9);
                });
            } catch (e) {
                console.error("Audio playback error", e);
            }
        }
    }

    const sound = new BrandSoundFX();

    // Sound toggle listener
    audioToggle.addEventListener('click', () => {
        const isSoundEnabled = sound.toggle();
        if (isSoundEnabled) {
            audioOnIcon.classList.remove('hidden');
            audioOffIcon.classList.add('hidden');
            audioToggle.classList.remove('disabled');
        } else {
            audioOnIcon.classList.add('hidden');
            audioOffIcon.classList.remove('hidden');
            audioToggle.classList.add('disabled');
        }
    });

    // ----------------------------------------------------------------------
    // Custom Cursor Interpolation
    // ----------------------------------------------------------------------
    window.addEventListener('mousemove', (e) => {
        targetMouse.x = e.clientX;
        targetMouse.y = e.clientY;
    });

    // Magnet and Hover effects
    const setupInteractiveHoverListeners = () => {
        const interactiveElements = document.querySelectorAll(
            'a, button, input, .scroll-indicator, .audio-toggle-btn, label, .input-wrapper'
        );

        interactiveElements.forEach(elem => {
            elem.addEventListener('mouseenter', () => {
                document.body.classList.add('hover-interactive');
            });
            elem.addEventListener('mouseleave', () => {
                document.body.classList.remove('hover-interactive');
                document.body.classList.remove('hover-active');
            });
            elem.addEventListener('mousedown', () => {
                document.body.classList.add('hover-active');
            });
            elem.addEventListener('mouseup', () => {
                document.body.classList.remove('hover-active');
            });
        });
    };

    setupInteractiveHoverListeners();

    // ----------------------------------------------------------------------
    // Scroll Events & Parallax
    // ----------------------------------------------------------------------
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    });

    // Smooth scroll down when clicking Scroll Hint
    scrollHint.addEventListener('click', () => {
        document.getElementById('draw-app').scrollIntoView({ behavior: 'smooth' });
    });

    // Intersection Observer for scroll reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.scroll-reveal').forEach(el => revealObserver.observe(el));

    // ----------------------------------------------------------------------
    // Canvas Background Particles Setup
    // ----------------------------------------------------------------------
    const handleResize = () => {
        particlesCanvas.width = window.innerWidth;
        particlesCanvas.height = window.innerHeight;
        victoryCanvas.width = window.innerWidth;
        victoryCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    class Particle {
        constructor() {
            this.x = Math.random() * particlesCanvas.width;
            this.y = Math.random() * particlesCanvas.height;
            this.size = Math.random() * 2 + 1;
            this.baseSpeedX = Math.random() * 0.4 - 0.2;
            this.baseSpeedY = Math.random() * 0.4 - 0.2;
            this.speedX = this.baseSpeedX;
            this.speedY = this.baseSpeedY;
            this.alpha = Math.random() * 0.5 + 0.1;
            this.color = `rgba(255, 200, 0, ${this.alpha})`;
        }

        update() {
            // Mouse push reaction
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const distance = Math.hypot(dx, dy);
            const maxDistance = 140;

            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                const angle = Math.atan2(dy, dx);
                this.speedX += Math.cos(angle) * force * 0.6;
                this.speedY += Math.sin(angle) * force * 0.6;
            } else {
                // Drag towards base speed
                this.speedX += (this.baseSpeedX - this.speedX) * 0.04;
                this.speedY += (this.baseSpeedY - this.speedY) * 0.04;
            }

            this.x += this.speedX;
            this.y += this.speedY;

            // Bounds check
            if (this.x < 0) this.x = particlesCanvas.width;
            if (this.x > particlesCanvas.width) this.x = 0;
            if (this.y < 0) this.y = particlesCanvas.height;
            if (this.y > particlesCanvas.height) this.y = 0;
        }

        draw() {
            pCtx.save();
            pCtx.beginPath();
            pCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            pCtx.fillStyle = this.color;
            pCtx.shadowBlur = this.size * 2;
            pCtx.shadowColor = 'rgba(255, 200, 0, 0.4)';
            pCtx.fill();
            pCtx.restore();
        }
    }

    const initBackgroundParticles = () => {
        particlesArray = [];
        const count = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 20000));
        for (let i = 0; i < count; i++) {
            particlesArray.push(new Particle());
        }
    };
    initBackgroundParticles();

    // ----------------------------------------------------------------------
    // Victory Confetti celebration system
    // ----------------------------------------------------------------------
    class Confetti {
        constructor(x, y, fromButton = false) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 8 + 6;

            // Random direction
            const angle = fromButton ? Math.random() * Math.PI + Math.PI : Math.random() * Math.PI * 2;
            const force = fromButton ? Math.random() * 14 + 10 : Math.random() * 8 + 4;

            this.speedX = Math.cos(angle) * force;
            this.speedY = Math.sin(angle) * force;
            this.gravity = 0.25;
            this.friction = 0.97;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 8 - 4;

            // Colors: Yellow shades, White, Ice Blue
            const colors = [
                '#ffc800', // Realme yellow
                '#ffe066', // Light yellow
                '#ffffff', // White
                '#00f0ff', // Cyber blue
                '#121212'  // Dark accent
            ];
            this.color = colors[Math.floor(Math.random() * colors.length)];

            // Shape choice: 0: rect, 1: circle, 2: Realmeow silhouette ears (triangle)
            this.shape = Math.floor(Math.random() * 3);
            this.alpha = 1;
            this.fadeSpeed = Math.random() * 0.005 + 0.008;
        }

        update() {
            this.speedX *= this.friction;
            this.speedY *= this.friction;
            this.speedY += this.gravity;

            this.x += this.speedX;
            this.y += this.speedY;
            this.rotation += this.rotationSpeed;
            this.alpha -= this.fadeSpeed;
        }

        draw() {
            if (this.alpha <= 0) return;
            vCtx.save();
            vCtx.translate(this.x, this.y);
            vCtx.rotate((this.rotation * Math.PI) / 180);
            vCtx.globalAlpha = this.alpha;
            vCtx.fillStyle = this.color;

            // Neon glow for yellow/blue pieces
            if (this.color === '#ffc800' || this.color === '#00f0ff') {
                vCtx.shadowBlur = 8;
                vCtx.shadowColor = this.color;
            }

            vCtx.beginPath();
            if (this.shape === 0) {
                // Rectangle
                vCtx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size / 2);
            } else if (this.shape === 1) {
                // Circle
                vCtx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                vCtx.fill();
            } else {
                // Mascot Ear / Triangle
                vCtx.moveTo(0, -this.size / 2);
                vCtx.lineTo(-this.size / 2, this.size / 2);
                vCtx.lineTo(this.size / 2, this.size / 2);
                vCtx.closePath();
                vCtx.fill();
            }
            vCtx.restore();
        }
    }

    const triggerVictoryExplosion = () => {
        victoryConfettiArray = [];
        victoryExplosionRunning = true;

        // Find button position to spawn confetti
        const btnRect = drawBtn.getBoundingClientRect();
        const spawnX = btnRect.left + btnRect.width / 2;
        const spawnY = btnRect.top + btnRect.height / 2;

        // Spawn from card/display
        const dispRect = winnerDisplayContainer.getBoundingClientRect();
        const displayX = dispRect.left + dispRect.width / 2;
        const displayY = dispRect.top + dispRect.height / 2;

        // Burst 1: From button (going upwards)
        for (let i = 0; i < 75; i++) {
            victoryConfettiArray.push(new Confetti(spawnX, spawnY, true));
        }

        // Burst 2: Ambient bursts from screen center
        for (let i = 0; i < 75; i++) {
            victoryConfettiArray.push(new Confetti(displayX, displayY, false));
        }

        // Ambient rain from top of screen
        const rainInterval = setInterval(() => {
            if (!victoryExplosionRunning || victoryConfettiArray.length > 300) return;
            for (let i = 0; i < 4; i++) {
                victoryConfettiArray.push(new Confetti(Math.random() * victoryCanvas.width, -10, false));
            }
        }, 80);

        // Terminate active rain after 4.5 seconds
        setTimeout(() => {
            clearInterval(rainInterval);
            setTimeout(() => {
                victoryExplosionRunning = false;
            }, 2000);
        }, 4500);
    };

    // ----------------------------------------------------------------------
    // Drawing Logic (Raffle Draw Execution)
    // ----------------------------------------------------------------------
    const updateHistoryUI = () => {
        if (winnerHistory.length === 0) {
            historyList.innerHTML = '<li class="history-empty">Aún no hay ganadores en esta sesión</li>';
            return;
        }

        historyList.innerHTML = '';
        // Show reverse sorted to get newest on top
        [...winnerHistory].reverse().forEach(winner => {
            const li = document.createElement('li');
            li.className = 'history-item';

            const numSpan = document.createElement('span');
            numSpan.className = 'history-number';
            numSpan.textContent = String(winner.num).padStart(3, '0');

            const metaSpan = document.createElement('span');
            metaSpan.className = 'history-meta';
            metaSpan.textContent = winner.time;

            li.appendChild(numSpan);
            li.appendChild(metaSpan);
            historyList.appendChild(li);
        });
        setupInteractiveHoverListeners();
    };

    const addWinnerToHistory = (num) => {
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        winnerHistory.push({ num: num, time: timeNow });

        // Cap history to 10 items
        if (winnerHistory.length > 10) {
            winnerHistory.shift();
        }

        localStorage.setItem('realmeow_winners', JSON.stringify(winnerHistory));
        updateHistoryUI();
    };

    const runRaffleDraw = () => {
        if (isDrawing) return;

        // Initialize audio context on first user click if suspended
        sound.init();

        const min = parseInt(minInput.value, 10);
        const max = parseInt(maxInput.value, 10);

        if (isNaN(min) || isNaN(max)) {
            errorMessage.textContent = "¡Por favor ingresa valores válidos!";
            errorMessage.classList.remove('hidden');
            return;
        }

        if (min >= max) {
            errorMessage.textContent = "¡El número final debe ser mayor que el inicial!";
            errorMessage.classList.remove('hidden');
            return;
        }

        // Clear error and lock interaction
        errorMessage.classList.add('hidden');
        isDrawing = true;
        drawBtn.disabled = true;
        winnerDisplayContainer.classList.remove('winner-flash');
        displayStatus.textContent = "ANALIZANDO...";
        displayStatus.style.color = "var(--text-muted)";
        winnerDisplay.classList.add('spinning');

        // Draw duration details
        const totalDuration = 3500; // 3.5 seconds
        let currentInterval = 25; // start fast
        const startTime = Date.now();

        // Target winner
        const winningNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        // Helper recursive spin loop
        const spin = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / totalDuration;

            if (progress >= 1.0) {
                // Finished! Set final values — write winner immediately, no extra delay
                winnerDisplay.classList.remove('spinning');
                winnerDisplay.textContent = String(winningNumber).padStart(3, '0');

                // Elastic pop animation: remove first in case re-running, then re-add
                winnerDisplay.classList.remove('winner-reveal');
                void winnerDisplay.offsetWidth; // force reflow to restart animation
                winnerDisplay.classList.add('winner-reveal');

                winnerDisplayContainer.classList.add('winner-flash');
                displayStatus.textContent = "GANADOR DEFINIDO";

                sound.playVictoryFanfare();
                triggerVictoryExplosion();
                celebrateAvatar();
                addWinnerToHistory(winningNumber);

                isDrawing = false;
                drawBtn.disabled = false;
            } else {
                // Generate a randomized display number in the range
                const randomDisplayNum = Math.floor(Math.random() * (max - min + 1)) + min;
                winnerDisplay.textContent = String(randomDisplayNum).padStart(3, '0');

                // Sound ticks
                // Play synth ticks, raise pitch as draw nears completion
                const pitch = 300 + Math.floor(progress * 800);
                sound.playTick(pitch);

                // Play suspense rumble
                if (progress > 0.4) {
                    sound.playSuspenseDrumroll(0.08);
                }

                // Slow down exponentially
                // Easing formula for smooth deceleration
                currentInterval = 25 + Math.pow(progress, 3) * 600;

                setTimeout(spin, currentInterval);
            }
        };

        spin();
    };

    drawBtn.addEventListener('click', runRaffleDraw);

    clearHistoryBtn.addEventListener('click', () => {
        winnerHistory = [];
        localStorage.removeItem('realmeow_winners');
        updateHistoryUI();
    });

    // Initialize UI history
    updateHistoryUI();

    // ----------------------------------------------------------------------
    // Avatar Mouse Tilt Interaction
    // ----------------------------------------------------------------------
    const setupAvatarInteraction = () => {
        if (!avatarWrapper) return;

        avatarWrapper.addEventListener('mouseenter', () => {
            avatarHovered = true;
            // Pause the CSS float animation so tilt takes full control
            avatarWrapper.style.animationPlayState = 'paused';
            avatarFloatPaused = true;
        });

        avatarWrapper.addEventListener('mouseleave', () => {
            avatarHovered = false;
            // Reset tilt targets to 0 → lerp back to neutral
            avatarTargetTiltX = 0;
            avatarTargetTiltY = 0;
        });

        avatarWrapper.addEventListener('mousemove', (e) => {
            const rect = avatarWrapper.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            // Normalize -1 to +1
            const nx = (e.clientX - cx) / (rect.width / 2);
            const ny = (e.clientY - cy) / (rect.height / 2);

            // Max tilt 22 degrees
            avatarTargetTiltY = nx * 22;   // rotate around Y (left–right)
            avatarTargetTiltX = -ny * 14;   // rotate around X (up–down)
        });

        // Click: quick jump + spin burst
        avatarWrapper.addEventListener('click', () => {
            avatarWrapper.style.transition = 'transform 0.15s ease-out';
            avatarWrapper.style.transform = `translateY(-30px) rotateY(360deg) scale(1.1)`;
            setTimeout(() => {
                avatarWrapper.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
                avatarWrapper.style.transform = `translateY(0px) rotateY(0deg) scale(1)`;
                setTimeout(() => {
                    avatarWrapper.style.transition = '';
                    avatarWrapper.style.transform = '';
                }, 500);
            }, 200);
        });
    };

    setupAvatarInteraction();

    // Called every rAF frame to smoothly apply tilt
    const updateAvatarTilt = () => {
        if (!avatarWrapper) return;

        // Lerp towards target
        const lerpSpeed = avatarHovered ? 0.12 : 0.06;
        avatarTiltX += (avatarTargetTiltX - avatarTiltX) * lerpSpeed;
        avatarTiltY += (avatarTargetTiltY - avatarTiltY) * lerpSpeed;

        const nearZero = Math.abs(avatarTiltX) < 0.05 && Math.abs(avatarTiltY) < 0.05;

        if (avatarHovered || !nearZero) {
            // Capture float vertical position via CSS var trick — just lift slightly
            const floatY = avatarHovered ? -8 : 0;
            avatarWrapper.style.transform =
                `translateY(${floatY}px) rotateX(${avatarTiltX}deg) rotateY(${avatarTiltY}deg)`;
        }

        // Re-enable float animation once tilt is fully settled
        if (!avatarHovered && nearZero && avatarFloatPaused) {
            avatarWrapper.style.transform = '';
            avatarWrapper.style.animationPlayState = 'running';
            avatarFloatPaused = false;
        }
    };

    // Avatar winner celebration: bounce + glow burst
    const celebrateAvatar = () => {
        if (!avatarWrapper || !avatarImg) return;

        // Quick series of bounces
        let bounces = 0;
        const bounceInterval = setInterval(() => {
            const up = bounces % 2 === 0;
            avatarWrapper.style.transition = 'transform 0.18s ease-out';
            avatarWrapper.style.transform = up
                ? `translateY(-28px) scale(1.08) rotateZ(${bounces % 4 === 0 ? -4 : 4}deg)`
                : `translateY(0px) scale(1) rotateZ(0deg)`;
            bounces++;
            if (bounces >= 8) {
                clearInterval(bounceInterval);
                setTimeout(() => {
                    avatarWrapper.style.transition = '';
                    avatarWrapper.style.transform = '';
                }, 200);
            }
        }, 180);

        // Intensify glow on the image
        avatarImg.style.transition = 'filter 0.3s';
        avatarImg.style.filter =
            'drop-shadow(0 0 40px rgba(255,200,0,1)) drop-shadow(0 0 80px rgba(255,200,0,0.6))';
        setTimeout(() => {
            avatarImg.style.filter = '';
            avatarImg.style.transition = '';
        }, 2500);
    };

    // ----------------------------------------------------------------------
    // Core Animation Frame Loop (Parallax + Custom Cursor + Particles)
    // ----------------------------------------------------------------------
    const updateFrame = () => {
        // 1. Lerp cursor outline for elastic/spring delay
        currentCursorOutline.x += (targetMouse.x - currentCursorOutline.x) * 0.14;
        currentCursorOutline.y += (targetMouse.y - currentCursorOutline.y) * 0.14;

        cursorDot.style.left = `${targetMouse.x}px`;
        cursorDot.style.top = `${targetMouse.y}px`;
        cursorOutline.style.left = `${currentCursorOutline.x}px`;
        cursorOutline.style.top = `${currentCursorOutline.y}px`;

        // Lerp mouse coordinates to actual coordinates for particles interaction
        mouse.x += (targetMouse.x - mouse.x) * 0.08;
        mouse.y += (targetMouse.y - mouse.y) * 0.08;

        // 2. Parallax background scroll and mouse shifts
        // Parallax scroll moves image vertically; mouse move shifts image subtly in 3D
        const bgShiftX = (targetMouse.x - window.innerWidth / 2) * -0.015;
        const bgShiftY = (targetMouse.y - window.innerHeight / 2) * -0.015 - scrollY * 0.08;
        parallaxBg.style.transform = `translate3d(${bgShiftX}px, ${bgShiftY}px, 0) scale(1.02)`;

        // 3. Render and Update Background Particles
        pCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
        particlesArray.forEach(p => {
            p.update();
            p.draw();
        });

        // 4. Render and Update Celebration Confetti
        vCtx.clearRect(0, 0, victoryCanvas.width, victoryCanvas.height);
        if (victoryExplosionRunning) {
            // Filter out dead confetti first, then update/draw remaining
            victoryConfettiArray = victoryConfettiArray.filter(c => c.alpha > 0 && c.y <= victoryCanvas.height + 30);
            victoryConfettiArray.forEach(c => {
                c.update();
                c.draw();
            });
        }

        // 5. Avatar 3D tilt (smooth lerp every frame)
        updateAvatarTilt();

        requestAnimationFrame(updateFrame);
    };

    // Begin Animation Loop
    requestAnimationFrame(updateFrame);
});
