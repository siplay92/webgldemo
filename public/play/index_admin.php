<?
include $_SERVER['DOCUMENT_ROOT'] . '/template/header_admin.php';
?>
<?
if (!isset($_SESSION['login'])) {
    header("Location: /login");
}
?>
<script src="/jslibs/3d/three.js"></script>
<script src="/jslibs/3d/loaders/OBJLoader.js"></script>
<script src="/jslibs/3d/loaders/OBJMTLLoader.js"></script>
<script src="/jslibs/3d/loaders/MTLLoader.js"></script>
<script src="/jslibs/3d/loaders/ColladaLoader.js"></script>
<script src="/jslibs/3d/PointerLockControls.js"></script>
<script src="/jslibs/3d/PointerLockEnable.js"></script>
<div class="top-panel">
    <span class="player-info">
        <span>Игрок:<label id="player-name"><?= $_SESSION['login'] ?></label></span>
        <label id="coord-x"><span> Координата по х:</span></label>
        <label id="coord-z"><span>Координата по z:</span></label>
        <label id="coord-y"><span>Координата по y:</span></label>
    </span>
</div>
<div id="sceneDomElement">
    <div id="blocker">
        <div id="instructions">
            <span style="font-size:40px">Click to play</span>
            <br/>
            (W, A, S, D = Move, SPACE = Jump, MOUSE = Look around ENTER - chat)
        </div>
    </div>
    <div class="chat-container" style="opacity:0.5">
        <div class="chat-message-container"></div>
        <div class="message-block">
            <form method="post" autocomplete="off" action="" name="chat-form" id="message-send-form">
                <input type="text" name="message-text" class="form-control" id="input-send-message">
            </form>
        </div>
    </div>
</div>
<script>
//    $(document).ready(function () {
//        // window.unload = window.onunload = window.onbeforeunload = function () {
//        window.unload = window.onbeforeunload = function () { //opera,chrome
//            var string = 'login=' + $('#player-name').text();
//            socket.json.emit('exit', string);
//            $.ajax({
//                method: "POST",
//                async: false,
//                url: "/ajaxScripts/logout.php"
//            }).done(function (result) {
//            });
//        }
//    });
</script>
<script src="/js/3d/app.js"></script>
<script src="/js/3d/main.js"></script>