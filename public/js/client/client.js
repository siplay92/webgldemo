// Создаем текст сообщений для событий
strings = {
    'connected': '[sys][time]%time%[/time]: Вы успешно соединились к сервером как [user]%name%[/user].[/sys]',
    'userJoined': '[sys][time]%time%[/time]: Пользователь [user]%name%[/user] присоединился к чату.[/sys]',
    'messageSent': '[out][time]%time%[/time]: [user]%name%[/user]: %text%[/out]',
    'messageReceived': '[in][time]%time%[/time]: [user]%name%[/user]: %text%[/in]',
    'userSplit': '[sys][time]%time%[/time]: Пользователь [user]%name%[/user] покинул чат.[/sys]'
};

// Создаем соединение с сервером; websockets почему-то в Хроме не работают, используем xhr
//if (navigator.userAgent.toLowerCase().indexOf('chrome') != -1) {
//	socket = io.connect('http://siplay.ru:8888', {'transports': ['xhr-polling']});
//} else {
socket = io.connect('http://siplay.ru:8888');
//}
socket.on('connect', function () {
    //socket.on('message', function (msg) {
    //	// Добавляем в лог сообщение, заменив время, имя и текст на полученные
    //	document.querySelector('#log').innerHTML += strings[msg.event].replace(/\[([a-z]+)\]/g, '<span class="$1">').replace(/\[\/[a-z]+\]/g, '</span>').replace(/\%time\%/, msg.time).replace(/\%name\%/, msg.name).replace(/\%text\%/, unescape(msg.text).replace('<', '&lt;').replace('>', '&gt;')) + '<br>';
    //	// Прокручиваем лог в конец
    //	document.querySelector('#log').scrollTop = document.querySelector('#log').scrollHeight;
    //});
    //// При нажатии <Enter> или кнопки отправляем текст
    //document.querySelector('#input').onkeypress = function(e) {
    //	if (e.which == '13') {
    //		// Отправляем содержимое input'а, закодированное в escape-последовательность
    //		socket.send(encodeURI(document.querySelector('#input').value));
    //		// Очищаем input
    //		document.querySelector('#input').value = '';
    //	}
    //};
    //document.querySelector('#send').onclick = function() {
    //	socket.send(encodeURI(document.querySelector('#input').value));
    //	document.querySelector('#input').value = '';
    //};
    $('#registration_form').submit(function (event) {
        var userData = $(this).serialize();
        socket.json.emit('registration', {'data': userData});
        event.preventDefault();
    });
    socket.on('response_registration', function (data) {
        alert(data.response);
        if (data.responseKey) {
            document.location.href = '';
        }
    });

    $('#log_in_form').submit(function (event) {
        var userData = $(this).serialize();
        socket.json.emit('login', {'data': userData});
        event.preventDefault();
    });
    socket.on('response_log_in', function (data) {
        alert(data.response);
        if (data.responseKey) {
            $.ajax({
                method: "POST",
                url: "/ajaxScripts/login.php",
                data: {'login': data.login}
            }).done(function (result) {
                document.location.href = '../play';
            });
        }
    });
});
