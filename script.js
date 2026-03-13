class Train {
    constructor(id, name, speed, route) {
        this.id = id;
        this.name = name;
        this.speed = speed;
        this.route = route;
        this.position = 0;
        this.distance = 0;
        this.status = 'moving';
        this.delay = 0;
        this.color = this.getRandomColor();
        this.destination = route[route.length - 1];
        this.nextStation = route[0];
        this.stationIndex = 0;
    }

    getRandomColor() {
        const colors = ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        if (this.status === 'moving') {
            this.position += this.speed / 10;
            this.distance += this.speed / 100;
            
            // Check if reached next station
            if (this.position >= 100) {
                this.position = 0;
                this.stationIndex++;
                if (this.stationIndex < this.route.length) {
                    this.nextStation = this.route[this.stationIndex];
                    this.logEvent(`Arrived at ${this.nextStation}`);
                    
                    // 30% chance of delay at station
                    if (Math.random() < 0.3) {
                        this.delay = Math.floor(Math.random() * 5) + 1;
                        this.status = 'delayed';
                        this.logEvent(`Delayed at ${this.nextStation} for ${this.delay} minutes`);
                    }
                } else {
                    this.status = 'arrived';
                    this.logEvent(`Reached final destination: ${this.destination}`);
                }
            }
        } else if (this.status === 'delayed') {
            this.delay--;
            if (this.delay <= 0) {
                this.status = 'moving';
                this.logEvent(`Departing from ${this.nextStation}`);
            }
        }
    }

    logEvent(message) {
        const time = new Date().toLocaleTimeString();
        addLog(`Train ${this.name}: ${message}`, 'train');
    }
}

class AIController {
    constructor() {
        this.trains = [];
        this.collisionsAvoided = 0;
        this.aiDecisions = 0;
        this.autoMode = true;
        this.simulationSpeed = 5;
        this.interval = null;
        this.trainCounter = 0;
        this.sections = {
            'A-B': { occupied: false, trainId: null },
            'B-C': { occupied: false, trainId: null },
            'C-D': { occupied: false, trainId: null },
            'D-E': { occupied: false, trainId: null },
            'E-F': { occupied: false, trainId: null }
        };
    }

    start() {
        this.updateClock();
        this.drawTracks();
        this.interval = setInterval(() => this.update(), 1000 / this.simulationSpeed);
        
        // Add initial trains
        this.addTrain('Express-1', ['Station A', 'Station C', 'Station E']);
        setTimeout(() => this.addTrain('Local-1', ['Station B', 'Station D', 'Station F']), 3000);
        setTimeout(() => this.addTrain('Express-2', ['Station A', 'Station D', 'Station F']), 6000);
    }

    addTrain(name, route) {
        this.trainCounter++;
        const speed = name.includes('Express') ? 8 : 5;
        const train = new Train(this.trainCounter, name, speed, route);
        this.trains.push(train);
        
        this.aiDecisions++;
        this.updateDisplay();
        this.addLog(`AI dispatched new train: ${name} on route ${route.join(' → ')}`, 'ai');
        
        return train;
    }

    update() {
        // Update all trains
        this.trains.forEach(train => {
            if (train.status !== 'arrived') {
                train.update();
            }
        });

        // AI collision avoidance
        if (this.autoMode) {
            this.avoidCollisions();
        }

        // Remove arrived trains
        this.trains = this.trains.filter(train => train.status !== 'arrived');
        
        this.updateDisplay();
        this.renderTrains();
    }

    avoidCollisions() {
        // Simple collision detection logic
        const positions = {};
        
        this.trains.forEach(train => {
            if (train.status === 'moving') {
                const section = this.getSection(train.position, train.route);
                if (section) {
                    if (positions[section]) {
                        // Potential collision detected
                        this.aiDecisions++;
                        this.collisionsAvoided++;
                        
                        // Slow down the following train
                        const followingTrain = train;
                        const originalSpeed = followingTrain.speed;
                        followingTrain.speed = Math.max(2, followingTrain.speed - 3);
                        
                        this.addLog(`AI prevented collision in ${section} by slowing ${followingTrain.name}`, 'ai-warning');
                        
                        // Restore speed after 5 seconds
                        setTimeout(() => {
                            if (followingTrain.status === 'moving') {
                                followingTrain.speed = originalSpeed;
                                this.addLog(`AI restored normal speed for ${followingTrain.name}`, 'ai');
                            }
                        }, 5000);
                    } else {
                        positions[section] = train.id;
                    }
                }
            }
        });
    }

    getSection(position, route) {
        const sections = ['A-B', 'B-C', 'C-D', 'D-E', 'E-F'];
        const sectionIndex = Math.floor(position / 20);
        if (sectionIndex < sections.length) {
            return sections[sectionIndex];
        }
        return null;
    }

    emergencyStop() {
        this.trains.forEach(train => {
            if (train.status === 'moving') {
                const originalSpeed = train.speed;
                train.speed = 0;
                train.status = 'emergency';
                
                this.addLog(`EMERGENCY STOP: ${train.name} halted`, 'emergency');
                
                // Resume after 3 seconds
                setTimeout(() => {
                    if (train.status === 'emergency') {
                        train.speed = originalSpeed;
                        train.status = 'moving';
                        this.addLog(`Resuming normal operations for ${train.name}`, 'ai');
                    }
                }, 3000);
            }
        });
        
        this.aiDecisions++;
        this.updateDisplay();
    }

    toggleAutoMode() {
        this.autoMode = !this.autoMode;
        const button = document.getElementById('autoMode');
        const status = this.autoMode ? 'ON' : 'OFF';
        
        button.innerHTML = `<i class="fas fa-robot"></i> AI Mode: ${status}`;
        button.className = this.autoMode ? 'btn btn-success' : 'btn btn-warning';
        
        this.addLog(`AI Auto Mode turned ${status}`, this.autoMode ? 'ai' : 'warning');
    }

    updateDisplay() {
        document.getElementById('trainCount').textContent = this.trains.length;
        document.getElementById('collisionsAvoided').textContent = this.collisionsAvoided;
        document.getElementById('aiDecisions').textContent = this.aiDecisions;
        
        // Update train list
        const trainList = document.getElementById('trainList');
        trainList.innerHTML = '';
        
        this.trains.forEach(train => {
            const card = document.createElement('div');
            card.className = `train-card ${train.status}`;
            card.innerHTML = `
                <h4>
                    <span><i class="fas fa-train"></i> ${train.name}</span>
                    <span>${train.status.toUpperCase()}</span>
                </h4>
                <div class="train-info">
                    <span><i class="fas fa-map-marker-alt"></i> Next: ${train.nextStation}</span>
                    <span><i class="fas fa-flag-checkered"></i> Dest: ${train.destination}</span>
                    <span><i class="fas fa-tachometer-alt"></i> Speed: ${train.speed * 10} km/h</span>
                    <span><i class="fas fa-road"></i> Progress: ${Math.min(100, Math.round(train.position))}%</span>
                    ${train.delay > 0 ? `<span><i class="fas fa-clock"></i> Delay: ${train.delay} min</span>` : ''}
                </div>
            `;
            trainList.appendChild(card);
        });
    }

    drawTracks() {
        const map = document.getElementById('railwayMap');
        map.innerHTML = '';
        
        // Draw tracks
        const stations = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        stations.forEach((station, index) => {
            // Draw station
            const stationEl = document.createElement('div');
            stationEl.className = 'station';
            stationEl.textContent = `Station ${station}`;
            stationEl.style.left = `${index * 18}%`;
            stationEl.style.top = '50%';
            stationEl.style.transform = 'translate(-50%, -50%)';
            map.appendChild(stationEl);
            
            // Draw track between stations
            if (index < stations.length - 1) {
                const track = document.createElement('div');
                track.className = 'track';
                track.style.left = `${index * 18 + 9}%`;
                track.style.top = '50%';
                track.style.width = '18%';
                map.appendChild(track);
            }
        });
        
        // Add CSS for tracks
        const style = document.createElement('style');
        style.textContent = `
            .station {
                position: absolute;
                background: linear-gradient(45deg, #FF9800, #FF5722);
                color: white;
                padding: 10px 15px;
                border-radius: 50%;
                width: 80px;
                height: 80px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                z-index: 10;
                box-shadow: 0 0 20px rgba(255, 152, 0, 0.5);
                border: 3px solid white;
            }
            
            .track {
                position: absolute;
                height: 8px;
                background: repeating-linear-gradient(
                    90deg,
                    #666,
                    #666 10px,
                    #888 10px,
                    #888 20px
                );
                transform: translateY(-50%);
                z-index: 1;
            }
            
            .train-marker {
                position: absolute;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                z-index: 20;
                transition: left 0.5s linear;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 15px currentColor;
            }
        `;
        document.head.appendChild(style);
    }

    renderTrains() {
        const map = document.getElementById('railwayMap');
        
        // Remove existing train markers
        document.querySelectorAll('.train-marker').forEach(el => el.remove());
        
        // Add train markers
        this.trains.forEach(train => {
            if (train.status !== 'arrived') {
                const marker = document.createElement('div');
                marker.className = 'train-marker';
                marker.style.backgroundColor = train.color;
                marker.style.color = 'white';
                marker.style.left = `${10 + train.position * 0.8}%`;
                marker.style.top = '50%';
                marker.innerHTML = `<i class="fas fa-train"></i>`;
                
                // Add train number badge
                const badge = document.createElement('div');
                badge.style.position = 'absolute';
                badge.style.top = '-5px';
                badge.style.right = '-5px';
                badge.style.background = 'white';
                badge.style.color = train.color;
                badge.style.borderRadius = '50%';
                badge.style.width = '20px';
                badge.style.height = '20px';
                badge.style.fontSize = '0.8rem';
                badge.style.display = 'flex';
                badge.style.alignItems = 'center';
                badge.style.justifyContent = 'center';
                badge.style.fontWeight = 'bold';
                badge.textContent = train.id;
                marker.appendChild(badge);
                
                map.appendChild(marker);
            }
        });
    }

    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        document.getElementById('currentTime').textContent = timeString;
        
        // Update every second
        setTimeout(() => this.updateClock(), 1000);
    }

    addLog(message, type = 'info') {
        const console = document.getElementById('logConsole');
        const time = new Date().toLocaleTimeString();
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
        
        console.appendChild(logEntry);
        console.scrollTop = console.scrollHeight;
        
        // Keep only last 20 logs
        const logs = console.querySelectorAll('.log-entry');
        if (logs.length > 20) {
            logs[0].remove();
        }
        
        // Add CSS for log types
        if (!document.querySelector('#log-styles')) {
            const style = document.createElement('style');
            style.id = 'log-styles';
            style.textContent = `
                .log-ai { color: #4CAF50; }
                .log-ai-warning { color: #FF9800; }
                .log-emergency { color: #f44336; animation: blink 1s infinite; }
                .log-train { color: #2196F3; }
                .log-warning { color: #FFC107; }
                .log-time { color: #888; margin-right: 10px; }
                @keyframes blink { 50% { opacity: 0.5; } }
            `;
            document.head.appendChild(style);
        }
    }

    setSimulationSpeed(speed) {
        this.simulationSpeed = speed;
        clearInterval(this.interval);
        this.interval = setInterval(() => this.update(), 1000 / speed);
        document.getElementById('speedValue').textContent = `${speed}x`;
    }
}

// Initialize the system
const aiController = new AIController();

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Start the simulation
    aiController.start();
    
    // Add train button
    document.getElementById('addTrain').addEventListener('click', () => {
        const names = ['Express', 'Local', 'Freight', 'Bullet', 'Metro'];
        const prefixes = ['Northern', 'Southern', 'Eastern', 'Western', 'Central'];
        const name = `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${names[Math.floor(Math.random() * names.length)]}-${Math.floor(Math.random() * 100)}`;
        
        const routes = [
            ['Station A', 'Station C', 'Station E'],
            ['Station B', 'Station D', 'Station F'],
            ['Station A', 'Station B', 'Station D', 'Station F'],
            ['Station C', 'Station E', 'Station F']
        ];
        const route = routes[Math.floor(Math.random() * routes.length)];
        
        aiController.addTrain(name, route);
    });
    
    // Emergency stop button
    document.getElementById('emergency').addEventListener('click', () => {
        aiController.emergencyStop();
        
        // Visual feedback
        document.body.style.animation = 'emergency-bg 0.5s';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 500);
    });
    
    // AI mode toggle
    document.getElementById('autoMode').addEventListener('click', () => {
        aiController.toggleAutoMode();
    });
    
    // Speed control
    document.getElementById('speedControl').addEventListener('input', (e) => {
        const speed = parseInt(e.target.value);
        aiController.setSimulationSpeed(speed);
    });
    
    // Add emergency animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes emergency-bg {
            0%, 100% { background: linear-gradient(135deg, #0f2027, #203a43, #2c5364); }
            50% { background: linear-gradient(135deg, #5c0000, #8b0000, #b22222); }
        }
    `;
    document.head.appendChild(style);
});

// Global function to add logs from trains
function addLog(message, type) {
    aiController.addLog(message, type);
}
