const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let users = [];

function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const msg = JSON.parse(message);
        
        if (msg.type === 'register') {
            ws.username = msg.username;
            ws.color = msg.color; // Сохраняем цвет ника
            users.push(ws.username);
            ws.send(JSON.stringify({
                type: 'welcome',
                message: `Добро пожаловать. В чате уже присутствуют: ${users.join(', ') || 'Вы первый в чате.'}`
            }));
            broadcast(`${ws.username} присоединился.`);
            broadcastUserList(); // Обновляем список пользователей
        } else if (msg.type === 'message') {
            const time = getCurrentTime();
            broadcast(JSON.stringify({
                type: 'message',
                username: ws.username,
                color: ws.color,
                text: msg.text,
                timestamp: time
            }));
        }
    });

    ws.on('close', () => {
        if (ws.username) {
            users = users.filter(user => user !== ws.username);
            broadcast(`${ws.username} нас покинул.`);
            broadcastUserList(); // Обновляем список пользователей
        }
    });
});

function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function broadcastUserList() {
    const userListMessage = JSON.stringify({
        type: 'userList',
        users: users
    });
    broadcast(userListMessage);
}

app.use(express.static('public'));

server.listen(3000,'0.0.0.0', () => {
    console.log('Сервер запущен на http://0.0.0.0:3000');
});