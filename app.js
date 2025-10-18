class MorseCode {
    constructor() {
        this.morseToText = {
            '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
            '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
            '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
            '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
            '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
            '--..': 'Z', '.----': '1', '..---': '2', '...--': '3',
            '....-': '4', '.....': '5', '-....': '6', '--...': '7',
            '---..': '8', '----.': '9', '-----': '0', '--..--': ',',
            '.-.-.-': '.', '..--..': '?', '.----.': "'", '-.-.--': '!',
            '-..-.': '/', '-.--.': '(', '-.--.-': ')', '.-...': '&',
            '---...': ':', '-.-.-.': ';', '-...-': '=', '.-.-.': '+',
            '-....-': '-', '..--.-': '_', '.-..-.': '"', '...-..-': '$',
            '.--.-.': '@'
        };

        this.textToMorse = {};
        for (let morse in this.morseToText) {
            this.textToMorse[this.morseToText[morse]] = morse;
        }
    }

    textToMorseCode(text) {
        return text.toUpperCase()
            .split('')
            .map(char => {
                if (char === ' ') return '/';
                return this.textToMorse[char] || '';
            })
            .filter(code => code !== '')
            .join(' ');
    }

    morseToTextCode(morse) {
        return morse.split(' / ')
            .map(word => {
                return word.split(' ')
                    .map(code => this.morseToText[code] || '')
                    .join('');
            })
            .join(' ');
    }
}


class MorseGame {
    constructor() {
        this.morse = new MorseCode();
        this.currentInput = '';
        this.isConnected = false;

        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }

    initializeElements() {
        this.dotBtn = document.getElementById('dotBtn');
        this.dashBtn = document.getElementById('dashBtn');
        this.spaceBtn = document.getElementById('spaceBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.sendBtn = document.getElementById('sendBtn');
        this.morseInput = document.getElementById('morseInput');
        this.textPreview = document.getElementById('textPreview');
        this.messagesList = document.getElementById('messagesList');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.playersList = document.getElementById('playersList');
    }

    bindEvents() {
        this.dotBtn.addEventListener('click', () => this.addSignal('.'));
        this.dashBtn.addEventListener('click', () => this.addSignal('-'));
        this.spaceBtn.addEventListener('click', () => this.addSpace());
        this.clearBtn.addEventListener('click', () => this.clearInput());
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        this.morseInput.addEventListener('click', () => {
            this.morseInput.focus();
        });

        this.morseInput.addEventListener('focus', () => {
            this.morseInput.classList.add('focused');
        });

        this.morseInput.addEventListener('blur', () => {
            this.morseInput.classList.remove('focused');
        });

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case '.':
                case 'j':
                    e.preventDefault();
                    this.addSignal('.');
                    this.flashButton(this.dotBtn);
                    break;
                case '-':
                case 'k':
                    e.preventDefault();
                    this.addSignal('-');
                    this.flashButton(this.dashBtn);
                    break;
                case ' ':
                    e.preventDefault();
                    this.addSpace();
                    this.flashButton(this.spaceBtn);
                    break;
                case 'Backspace':
                    e.preventDefault();
                    this.backspace();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.sendMessage();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.clearInput();
                    break;
            }
        });
    }

    addSignal(signal) {
        this.currentInput += signal;
        this.updateDisplay();
        this.playBeep(signal === '.' ? 200 : 600);
        this.showTypingFeedback();
    }

    addSpace() {
        if (this.currentInput && !this.currentInput.endsWith(' ')) {
            this.currentInput += ' ';
            this.updateDisplay();
            this.showTypingFeedback();
        }
    }

    backspace() {
        if (this.currentInput.endsWith(' / ')) {
            this.currentInput = this.currentInput.slice(0, -3);
        } else {
            this.currentInput = this.currentInput.slice(0, -1);
        }
        this.updateDisplay();
    }

    clearInput() {
        this.currentInput = '';
        this.updateDisplay();
    }

    updateDisplay() {
        if (this.currentInput) {
            this.morseInput.textContent = this.currentInput;
            this.morseInput.classList.remove('empty');
            const decoded = this.morse.morseToTextCode(this.currentInput);
            this.textPreview.textContent = decoded || 'Invalid morse code';
        } else {
            this.morseInput.textContent = 'Click here or use keyboard to enter morse code...';
            this.morseInput.classList.add('empty');
            this.textPreview.textContent = 'Text will appear here...';
        }

        this.sendBtn.disabled = !this.currentInput.trim() || !this.isConnected;
    }

    showTypingFeedback() {
        this.morseInput.classList.add('typing');
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.morseInput.classList.remove('typing');
        }, 500);
    }

    sendMessage() {
        if (!this.currentInput.trim() || !this.isConnected) return;

        const message = {
            morse: this.currentInput.trim(),
            text: this.morse.morseToTextCode(this.currentInput.trim()),
            timestamp: Date.now()
        };

        if (window.multiplayer) {
            window.multiplayer.sendMessage(message);
        }

        this.clearInput();
    }

    receiveMessage(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';

        const time = new Date(data.timestamp).toLocaleTimeString();
        const isOwnMessage = window.multiplayer && data.sender === window.multiplayer.socket.id;
        const sender = isOwnMessage ? 'You' : (data.senderName || 'Unknown');

        if (isOwnMessage) {
            messageDiv.classList.add('own-message');
        }

        messageDiv.innerHTML = `
            <div class="message-header">${sender} - ${time}</div>
            <div class="message-morse">${data.morse}</div>
            <div class="message-text">${data.text}</div>
        `;

        this.messagesList.appendChild(messageDiv);
        this.messagesList.scrollTop = this.messagesList.scrollHeight;

        if (!isOwnMessage) {
            this.playReceiveSound();
        }
    }

    updateConnectionStatus(connected, playerName = null) {
        this.isConnected = connected;
        if (connected && playerName) {
            this.connectionStatus.textContent = `Connected as ${playerName}`;
        } else {
            this.connectionStatus.textContent = connected ? 'Connected' : 'Disconnected';
        }
        this.connectionStatus.className = `status ${connected ? 'connected' : 'disconnected'}`;
        this.updateDisplay();
    }

    updatePlayersList(players) {
        this.playersList.innerHTML = '';
        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player';

            const isCurrentUser = window.multiplayer && player.id === window.multiplayer.socket.id;
            const playerName = player.name || `Player ${player.id.substring(0, 6)}`;

            if (isCurrentUser) {
                playerDiv.classList.add('current-user');
                playerDiv.textContent = `${playerName} (You)`;
            } else {
                playerDiv.textContent = playerName;
            }

            this.playersList.appendChild(playerDiv);
        });
    }

    flashButton(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 100);
    }

    playBeep(frequency = 400, duration = 100) {
        if (!window.AudioContext) return;

        try {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (e) {
            console.log('Audio not supported');


        }
    }

    playReceiveSound() {
        this.playBeep(800, 200);
    }
}

class Multiplayer {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.playerName = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        this.connect();
    }

    connect() {
        try {
            this.socket = io(https://morse-signal-1.onrender.com/);
            this.bindSocketEvents();
        } catch (error) {
            console.error('Failed to connect:', error);
            this.handleDisconnection();
        }
    }

    bindSocketEvents() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.reconnectAttempts = 0;
            this.game.updateConnectionStatus(true);

            this.playerName = `Player_${Math.random().toString(36).substring(2, 6)}`;
            this.socket.emit('join', { name: this.playerName });

            this.game.updateConnectionStatus(true, this.playerName);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.handleDisconnection();
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.handleDisconnection();
        });

        this.socket.on('message', (data) => {
            this.game.receiveMessage(data);
        });

        this.socket.on('players_update', (players) => {
            this.game.updatePlayersList(players);
        });

        this.socket.on('player_joined', (data) => {
            this.showNotification(`${data.name} joined the game`);
        });

        this.socket.on('player_left', (data) => {
            this.showNotification(`${data.name} left the game`);
        });
    }

    sendMessage(message) {
        if (this.socket && this.socket.connected) {
            const messageData = {
                ...message,
                sender: this.socket.id,
                senderName: this.playerName
            };
            this.socket.emit('message', messageData);
        }
    }

    handleDisconnection() {
        this.game.updateConnectionStatus(false);

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                this.connect();
            }, 2000 * this.reconnectAttempts);
        } else {
            console.log('Max reconnection attempts reached');
            this.showNotification('Connection lost. Please refresh the page.');
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-family: 'Press Start 2P', monospace;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new MorseGame();
    const multiplayer = new Multiplayer(game);
    
    window.MorseCode = MorseCode;
    window.MorseGame = MorseGame;
    window.Multiplayer = Multiplayer;
    window.multiplayer = multiplayer;

});
