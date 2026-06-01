import { VisualizerSettings } from '../types';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    life: number;
    maxLife: number;
    color?: string;
}

export class EffectRenderer {
    private width: number = 1920;
    private height: number = 1080;
    
    // State Containers
    private snowParticles: Particle[] = [];
    private rainParticles: Particle[] = [];
    private dropParticles: Particle[] = []; // Window droplets
    private floatParticles: Particle[] = []; // Bokeh
    private fireworkParticles: Particle[] = [];
    private starParticles: Particle[] = [];
    private fogParticles: Particle[] = [];
    private fireflyParticles: Particle[] = [];

    constructor() {
        this.initStars();
        this.initFog();
    }

    resize(w: number, h: number) {
        this.width = w;
        this.height = h;
    }

    // deltaTime in seconds (e.g. 0.016 for 60fps)
    update(isBeat: boolean, bassEnergy: number, params: VisualizerSettings['effectParams'], deltaTime: number = 0.016) {
        const speed = params.speed || 1.0;
        const intensity = params.intensity || 1.0;
        
        // Normalize movement relative to 60fps
        // If deltaTime is 0.016 (60fps), scale is 1. If 0.033 (30fps), scale is 2.
        const dtScale = deltaTime * 60;

        // 1. Snow
        const maxSnow = 150 * intensity;
        if (this.snowParticles.length < maxSnow) {
            this.snowParticles.push({
                x: Math.random() * this.width,
                y: -10,
                vx: (Math.random() - 0.5) * 1 * speed,
                vy: (Math.random() * 2 + 1) * speed,
                size: Math.random() * 3 + 1,
                alpha: Math.random() * 0.5 + 0.3,
                life: 1, maxLife: 1
            });
        }
        // Remove excess if intensity lowered
        if (this.snowParticles.length > maxSnow) {
             this.snowParticles.splice(0, this.snowParticles.length - maxSnow);
        }

        this.snowParticles.forEach(p => {
            p.x += p.vx * dtScale;
            p.y += p.vy * dtScale;
            if (p.y > this.height) {
                p.y = -10;
                p.x = Math.random() * this.width;
            }
        });

        // 2. Rain
        const maxRain = 300 * intensity;
        if (this.rainParticles.length < maxRain) {
            this.rainParticles.push({
                x: Math.random() * this.width,
                y: -20,
                vx: (Math.random() - 0.5) * 0.5 * speed,
                vy: (Math.random() * 15 + 10) * speed,
                size: Math.random() * 2 + 1, // width
                alpha: Math.random() * 0.4 + 0.1,
                life: Math.random() * 20 + 10, // length factor
                maxLife: 1
            });
        }
        if (this.rainParticles.length > maxRain) {
             this.rainParticles.splice(0, this.rainParticles.length - maxRain);
        }

        this.rainParticles.forEach(p => {
            p.x += p.vx * dtScale;
            p.y += p.vy * dtScale;
            if (p.y > this.height) {
                p.y = -20;
                p.x = Math.random() * this.width;
            }
        });

        // 3. Window Raindrops (Spawn on beat or random)
        // Spawn chance impacted by intensity
        if ((isBeat && Math.random() > (0.7 / intensity)) || Math.random() > (0.98 / intensity)) {
            if (this.dropParticles.length < 20 * intensity) {
                this.dropParticles.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    vx: 0, vy: 0,
                    size: Math.random() * 20 + 10,
                    alpha: 0, // Fade in
                    life: 0,
                    maxLife: (Math.random() * 100 + 100) / speed
                });
            }
        }
        this.dropParticles.forEach((p, idx) => {
            p.life += 1 * dtScale;
            // Fade in then out
            if (p.life < 20) p.alpha = (p.life / 20) * 0.6;
            else if (p.life > p.maxLife - 30) p.alpha = Math.max(0, (p.maxLife - p.life) / 30) * 0.6;
            
            if (p.life > p.maxLife) this.dropParticles.splice(idx, 1);
        });

        // 4. Floating Particles
        const maxFloat = 50 * intensity;
        if (this.floatParticles.length < maxFloat) {
            this.floatParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.5 * speed,
                vy: (Math.random() - 0.5) * 0.5 * speed,
                size: Math.random() * 20 + 5,
                alpha: Math.random() * 0.3,
                life: 1, maxLife: 1
            });
        }
        if (this.floatParticles.length > maxFloat) {
             this.floatParticles.splice(0, this.floatParticles.length - maxFloat);
        }

        this.floatParticles.forEach(p => {
            p.x += p.vx * dtScale;
            p.y += p.vy * dtScale;
            // Wrap
            if (p.x < 0) p.x = this.width;
            if (p.x > this.width) p.x = 0;
            if (p.y < 0) p.y = this.height;
            if (p.y > this.height) p.y = 0;
            
            // Pulse size on beat
            if (isBeat) p.size = Math.min(40, p.size * 1.02);
            else p.size = Math.max(5, p.size * 0.99);
        });

        // 5. Fireworks (Spawn rate based on intensity)
        const spawnChance = 0.8 / Math.max(0.1, intensity);
        if (isBeat && Math.random() > spawnChance) {
             const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
             const color = colors[Math.floor(Math.random() * colors.length)];
             const cx = Math.random() * this.width;
             const cy = Math.random() * this.height * 0.6; // Top 60%
             
             for(let i=0; i<30; i++) {
                 const angle = Math.random() * Math.PI * 2;
                 const spd = (Math.random() * 5 + 2) * speed;
                 this.fireworkParticles.push({
                     x: cx, y: cy,
                     vx: Math.cos(angle) * spd,
                     vy: Math.sin(angle) * spd,
                     size: Math.random() * 3 + 1,
                     alpha: 1,
                     life: 1.0,
                     maxLife: 1.0, 
                     color: color
                 });
             }
        }
        for(let i = this.fireworkParticles.length - 1; i >= 0; i--) {
            const p = this.fireworkParticles[i];
            p.x += p.vx * dtScale;
            p.y += p.vy * dtScale;
            p.vy += 0.1 * speed * dtScale; // Gravity
            p.life -= 0.02 * speed * dtScale; // Fade
            if (p.life <= 0) this.fireworkParticles.splice(i, 1);
        }

        // 6. Starfield (Drifting)
        this.starParticles.forEach(p => {
             // Twinkle speed
             p.alpha += (Math.random() - 0.5) * 0.1 * speed * dtScale;
             if (p.alpha < 0.2) p.alpha = 0.2;
             if (p.alpha > 0.8) p.alpha = 0.8;
             
             // Drift
             p.x -= 0.2 * speed * dtScale; 
             if (p.x < 0) p.x = this.width;
        });

        // 7. Fog
        this.fogParticles.forEach(p => {
            p.x += p.vx * speed * dtScale;
            if (p.x > this.width + 200) p.x = -200;
            if (p.x < -200) p.x = this.width + 200;
        });

        // 8. Fireflies
        const maxFireflies = 30 * intensity;
        if (this.fireflyParticles.length < maxFireflies) {
            this.fireflyParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.5 * speed,
                vy: (Math.random() - 0.5) * 0.5 * speed,
                size: Math.random() * 4 + 2,
                alpha: 0, 
                life: Math.random() * Math.PI * 2, // Random phase
                maxLife: 0 // Unused
            });
        }
        if (this.fireflyParticles.length > maxFireflies) {
            this.fireflyParticles.splice(0, this.fireflyParticles.length - maxFireflies);
        }

        this.fireflyParticles.forEach(p => {
            p.x += p.vx * dtScale;
            p.y += p.vy * dtScale;
            // Gentle wandering
            p.vx += (Math.random() - 0.5) * 0.05 * dtScale;
            p.vy += (Math.random() - 0.5) * 0.05 * dtScale;
            // Limit speed
            const maxSpeed = 1.0 * speed;
            p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));
            p.vy = Math.max(-maxSpeed, Math.min(maxSpeed, p.vy));

            // Wrap
            if (p.x < -20) p.x = this.width + 20;
            if (p.x > this.width + 20) p.x = -20;
            if (p.y < -20) p.y = this.height + 20;
            if (p.y > this.height + 20) p.y = -20;

            // Pulse
            p.life += 0.05 * speed * dtScale; // Use life as time/phase
            p.alpha = (Math.sin(p.life) + 1) / 2 * 0.8 + 0.2; // 0.2 to 1.0
        });
    }

    private initStars() {
        for(let i=0; i<100; i++) {
            this.starParticles.push({
                x: Math.random() * 1920,
                y: Math.random() * 1080,
                vx: 0, vy: 0,
                size: Math.random() * 2 + 1,
                alpha: Math.random(),
                life: 0, maxLife: 0
            });
        }
    }

    private initFog() {
        for(let i=0; i<5; i++) {
            this.fogParticles.push({
                x: Math.random() * 1920,
                y: Math.random() * 1080,
                vx: (Math.random() - 0.5) * 0.5,
                vy: 0,
                size: 300 + Math.random() * 200,
                alpha: 0.1 + Math.random() * 0.1,
                life: 0, maxLife: 0
            });
        }
    }

    private noiseCanvas: OffscreenCanvas | null = null;

    private initNoise() {
        this.noiseCanvas = new OffscreenCanvas(this.width * 2, this.height * 2);
        const ctx = this.noiseCanvas.getContext('2d', { alpha: true });
        if (!ctx) return;
        
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for(let i=0; i<4000; i++) {
            const x = Math.random() * this.width * 2;
            const y = Math.random() * this.height * 2;
            const s = Math.random() * 2 + 1;
            ctx.fillRect(x, y, s, s);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        for(let i=0; i<4000; i++) {
            const x = Math.random() * this.width * 2;
            const y = Math.random() * this.height * 2;
            const s = Math.random() * 2 + 1;
            ctx.fillRect(x, y, s, s);
        }
    }

    draw(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, effects: VisualizerSettings['effects']) {
        const width = this.width;
        const height = this.height;

        // 7. Fog (Background layer)
        if (effects.fog) {
            ctx.save();
            this.fogParticles.forEach(p => {
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, `rgba(200, 200, 200, ${p.alpha})`);
                gradient.addColorStop(1, 'rgba(200, 200, 200, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
            });
            ctx.restore();
        }

        // 6. Starfield (Background layer)
        if (effects.starfield) {
            ctx.fillStyle = '#ffffff';
            this.starParticles.forEach(p => {
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
        }

        // 8. Fireflies
        if (effects.fireflies) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ccff00';
            ctx.fillStyle = '#ccff00';
            this.fireflyParticles.forEach(p => {
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        }

        // 4. Floating Particles (Bokeh)
        if (effects.particles) {
            this.floatParticles.forEach(p => {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
        }

        // 5. Fireworks
        if (effects.fireworks) {
            this.fireworkParticles.forEach(p => {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color || '#fff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
        }

        // 1. Snow
        if (effects.snow) {
            ctx.fillStyle = '#ffffff';
            this.snowParticles.forEach(p => {
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
        }

        // 2. Rain
        if (effects.rain) {
            ctx.strokeStyle = '#aaddff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            this.rainParticles.forEach(p => {
                ctx.globalAlpha = p.alpha;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x, p.y + p.life); // life stored as length
            });
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        // 3. Raindrops (Window overlay)
        if (effects.raindrops) {
            this.dropParticles.forEach(p => {
                ctx.globalAlpha = p.alpha;
                // Draw distortion-like circle
                // Outer ring
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.stroke();
                
                // Highlight
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.beginPath();
                ctx.arc(p.x - p.size*0.3, p.y - p.size*0.3, p.size*0.2, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
        }

        // --- Stateless Overlays ---

        // 9. Scanlines
        if (effects.scanlines) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            for (let y = 0; y < height; y += 4) {
                ctx.fillRect(0, y, width, 2);
            }
        }

        // 8. Vignette
        if (effects.vignette) {
            const gradient = ctx.createRadialGradient(width/2, height/2, height/3, width/2, height/2, height);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }

        // 7. Film Grain (Heavy noise)
        if (effects.filmGrain) {
            if (!this.noiseCanvas || this.noiseCanvas.width !== width * 2) {
                this.initNoise();
            }
            if (this.noiseCanvas) {
                const offsetX = -(Math.random() * width);
                const offsetY = -(Math.random() * height);
                ctx.drawImage(this.noiseCanvas, offsetX, offsetY);
            }
        }
    }
}