<?
if (!isset($_SESSION['login'])) {
    header("Location: /login");
}
else {
    header("Location: /play");
}
?>