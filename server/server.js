var server = require('socket.io').listen(8888);// Подключаем модуль и ставим на прослушивание 8888-порта - 80й обычно занят под http-сервер
var querystring = require("querystring");
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: '192.168.0.11',
    port: '3306',
    user: 'root',
    password: 'GNwhVf67ve',
    database: 'webgldemo'
});
var PlayersArr = new Array();

var cubes = new Array();
for(var i=0;i<500;i++){
    cubes[i]=new Array();
    cubes[i][0]=Math.floor(Math.random() * 20 - 10) * 20;
    cubes[i][1]=Math.floor(Math.random() * 30) * 20 + 10;
    cubes[i][2]=Math.floor(Math.random() * 20 - 10) * 20;
}

var CronJob = require('cron').CronJob;
var job = new CronJob('0 * * * * *', function () {
    //СОХРАНИТЬ ДАННЫЕ ПОЛЬЗОВАТЕЛЕЙ
    for (var i = 0; i < PlayersArr.length; i++) {
        var querySetOnline = "UPDATE Players SET x='" + PlayersArr[i].x + "'," +
                             " y='" + PlayersArr[i].y + "'," +
                             " z='" + PlayersArr[i].z + "'," +
                             " rotX='" + PlayersArr[i].rotX + "'," +
                             " rotY='" + PlayersArr[i].rotY + "'," +
                             " rotZ='" + PlayersArr[i].rotZ + "'" +
                             " WHERE login='" + PlayersArr[i].login + "';";
        connection.query(querySetOnline, function (err, rows, fields) {
            if (err) throw err;
        });
    }
});
job.start();

console.log("Server has started.");
//server.set('log level', 1); // Отключаем вывод полного лога - пригодится в production'е
server.sockets.on('connection', function (socket) {// Навешиваем обработчик на подключение нового клиента
    //console.log(socket.id);
    //var ID = (socket.id).toString().substr(0, 5);// Т.к. чат простой - в качестве ников пока используем первые 5 символов от ID сокета
    var time = (new Date).toLocaleTimeString();
    //socket.json.send({'event': 'connected', 'name': ID, 'time': time});// Посылаем клиенту сообщение о том, что он успешно подключился и его имя
    //socket.broadcast.json.send({'event': 'userJoined', 'name': ID, 'time': time}); // Посылаем всем остальным пользователям, что подключился новый клиент и его имя
    //
    //socket.on('message', function (msg) {  // Навешиваем обработчик на входящее сообщение
    //    var time = (new Date).toLocaleTimeString();
    //    socket.json.send({'event': 'messageSent', 'name': ID, 'text': msg, 'time': time});    // Уведомляем клиента, что его сообщение успешно дошло до сервера
    //    socket.broadcast.json.send({'event': 'messageReceived', 'name': ID, 'text': msg, 'time': time});// Отсылаем сообщение остальным участникам чата
    //});
    //
    socket.on('disconnect', function () { // При отключении клиента - уведомляем остальных
        var time = (new Date).toLocaleTimeString();
        //console.log(JSON.stringify(PlayersArr));
        //socket.broadcast.json.emit('playerOffline', {'name': JSON.stringify(PlayersArr)['login']});
    });
    socket.on('exit', function (data) {
        parseData = querystring.parse(data);
        //console.log(parseData);
        //console.log('search '+parseData['login']+' in ',PlayersArr);
        for (var i = 0; i < PlayersArr.length; i++) {
            if (PlayersArr[i].login == parseData['login']) {
                PlayersArr.splice(i, 1);
            }
        }
        var querySetOnline = "UPDATE Players SET online=0 WHERE login='" + parseData['login'] + "';";
        connection.query(querySetOnline, function (err, rows, fields) {
            if (err) throw err;
        });
        socket.broadcast.json.emit(
            'playerExitGame',
            {
                'login': parseData['login']
            }
        );
        socket.on('disconnect', function () {
            var time = (new Date).toLocaleTimeString();
            server.sockets.json.send({'event': 'userSplit', 'name': parseData['login'], 'time': time});
        });
        console.log(PlayersArr.length, PlayersArr);
    });
    socket.on('registration', function (data) {
        parseData = querystring.parse(data.data);
        if ((parseData['registration_login'].length > 0) && (parseData['registration_password'].length > 0) && (parseData['registration_password_confirm'].length > 0)) {
            if (parseData['registration_password'].length > 8) {
                if (parseData['registration_password'] == parseData['registration_password_confirm']) {
                    var queryCheckLogin = "SELECT login from Players WHERE login='" + parseData['registration_login'] + "';";
                    connection.query(queryCheckLogin, function (err, rows, fields) {
                        if (err) throw err;
                        //console.log('The solution is: ', rows.length);
                        if (rows.length > 0) {
                            socket.json.emit('response_registration', {
                                'response': 'Ошибка! Данный логин занят!',
                                'responseKey': false
                            });
                        }
                        else {
                            var query = "INSERT INTO Players (id,login,password,color,online,x,y,z,rotX,rotY,rotZ) VALUES " +
                                "('0','" + parseData['registration_login'] + "',MD5('" + parseData['registration_password'] + "'),'0', '0', '0', '0', '0', '0', '0','0');";
                            connection.query(query, function (err, rows, fields) {
                                if (err) throw err;
                            });
                            socket.json.emit('response_registration', {
                                'response': 'Вы успешно зарегистрированы. Теперь вы можете войти под своей учетной записью.',
                                'responseKey': true
                            });
                        }
                    });
                }
                else {
                    socket.json.emit('response_registration', {
                        'response': 'Пароли не совпадают.',
                        'responseKey': false
                    });
                }
            } else {
                socket.json.emit('response_registration', {
                    'response': 'Пароль меньше 8 символов!',
                    'responseKey': false
                });
            }
        } else {
            socket.json.emit('response_registration', {
                'response': 'Не все поля заполнены.',
                'responseKey': false
            });
        }

    });
    socket.on('login', function (data) {
        parseData = querystring.parse(data.data);
        if ((parseData['log_in_login'].length > 0) && (parseData['log_in_password'].length > 0)) {
            var query = "SELECT login,password from Players WHERE login='" + parseData['log_in_login'] + "' AND password = MD5('" + parseData['log_in_password'] + "');";
            connection.query(query, function (err, rows, fields) {
                if (err) throw err;
                //console.log('The solution is: ', rows);
                if (rows.length > 0) {
                    socket.json.emit('response_log_in', {   //ответ клиенту
                        'response': 'Вы успешно авторизированы.',
                        'responseKey': true,
                        'login': parseData['log_in_login']
                    });
                    socket.json.send({'event': 'connected', 'name': parseData['log_in_login'], 'time': time});
                    socket.broadcast.json.send({'event': 'userJoined', 'name': parseData['log_in_login'], 'time': time});

                    var querySetOnline = "UPDATE Players SET online=1 WHERE login='" + parseData['log_in_login'] + "';";
                    connection.query(querySetOnline, function (err, rows, fields) {
                        if (err) throw err;
                    });
                    var querySetCurrentPlayer = "SELECT login,color,x,y,z,rotX,rotY,rotZ from Players WHERE login='" + parseData['log_in_login'] + "';";
                    connection.query(querySetCurrentPlayer, function (err, rows, fields) {
                        if (err) throw err;
                        PlayersArr.push(rows[0]);     //запись в массив игроков
                        socket.broadcast.json.emit(
                            'newPlayerEnteredGame',
                            {
                                'login': rows[0].login,
                                'x': rows[0].x,
                                'y': rows[0].y,
                                'z': rows[0].z,
                                'rotX': rows[0].rotX,
                                'rotY': rows[0].rotY,
                                'rotZ': rows[0].rotZ
                            }
                        );
                        console.log(PlayersArr.length, PlayersArr);
                    });
                }
                else {
                    socket.json.emit('response_log_in', {
                        'response': 'Пара логин/пароль не найдена',
                        'responseKey': false
                    });
                }
            });
        } else {
            socket.json.emit('response_log_in', {'response': 'Не все поля заполнены.', 'responseKey': false});
        }
    });
    socket.on('getPlayersOnline', function (data) {
        socket.json.emit('response_getPlayersOnline', PlayersArr);
    });
    socket.on('getPlayerPosition', function (data) {
        for (var i = 0; i < PlayersArr.length; i++) {
            if (PlayersArr[i].login == data.login) {
                socket.json.emit('response_getPlayerPosition', PlayersArr[i]);
            }
        }
    });
    socket.on('getSceneElementsPositions', function () {
        socket.json.emit('response_getSceneElementsPositions', cubes);
    });
    socket.on('currentPlayerPosChange', function (data) {
        for (var i = 0; i < PlayersArr.length; i++) {
            if (PlayersArr[i].login == data.login) {
                PlayersArr[i].x = data.x;
                PlayersArr[i].y = data.y;
                PlayersArr[i].z = data.z;
                PlayersArr[i].rotX = data.rotX;
                PlayersArr[i].rotY = data.rotY;
                PlayersArr[i].rotZ = data.rotZ;
                //console.log(PlayersArr[i]);
            }
        }
        socket.broadcast.json.emit(
            'playerPosChange',
            {
                'login': data.login,
                'x': data.x,
                'y': data.y,
                'z': data.z,
                'rotX': data.rotX,
                'rotY': data.rotY,
                'rotZ': data.rotZ
            }
        );
    });
    socket.on('message', function (msg) {
        //console.log(msg);
        var time = (new Date).toLocaleTimeString();
        socket.json.send({'event': 'messageSent', 'name': msg.login, 'text': msg.message, 'time': time});    // Уведомляем клиента, что его сообщение успешно дошло до сервера
        socket.broadcast.json.send({'event': 'messageReceived', 'name': msg.login, 'text': msg.message, 'time': time});// Отсылаем сообщение остальным участникам чата
    });
});
