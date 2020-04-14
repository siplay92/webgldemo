<?
include $_SERVER['DOCUMENT_ROOT'] . '/template/header_admin.php';
?>
    <div class="site-content">
        <div class="content-layout">
            <div class="head-title">
                <h1>Test game</h1>
            </div>
            <div class="row">
                <div class="col-xs-6">
                    <div class="form-registration">
                        <h1>Registration new account:</h1>
                        <form name="registration_form" id="registration_form" method="post" target="_top" action="">
                            <div class="form-group">
                                <label for="login">login</label>
                                <input type="text" class="form-control" id="registration_login"
                                       name="registration_login"
                                       placeholder="login">
                            </div>
                            <div class="form-group">
                                <label for="password">password</label>
                                <input type="password" class="form-control" id="registration_password"
                                       name="registration_password"
                                       placeholder="password">
                            </div>
                            <div class="form-group">
                                <label for="password">password confirm</label>
                                <input type="password" class="form-control" id="registration_password_confirm"
                                       name="registration_password_confirm"
                                       placeholder="password confirm">
                            </div>
                            <input type="submit" class="btn btn-default" value="Registration">
                        </form>
                    </div>
                </div>
                <div class="col-xs-6">
                    <div class="form-log-in">
                        <h1>Login</h1>
                        <form name="log_in_form" id="log_in_form" method="post">
                            <div class="form-group">
                                <label for="login">login</label>
                                <input type="text" class="form-control" id="log_in_login" placeholder="login"
                                       name="log_in_login">
                            </div>
                            <div class="form-group">
                                <label for="password">password</label>
                                <input type="password" class="form-control" id="log_in_password" placeholder="password"
                                       name="log_in_password">
                            </div>
                            <input type="submit" class="btn btn-default" value="Log in">
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
<?
include $_SERVER['DOCUMENT_ROOT'] . '/template/footer.php';
?>